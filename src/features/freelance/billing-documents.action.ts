"use server";

/* eslint-disable no-await-in-loop -- Bulk operations require sequential DB transactions within loops */

import {
  BillingAuditEventType,
  BillingCreditNoteStatus,
  BillingDeclarationPeriodStatus,
  BillingDeclarationPeriodType,
  BillingEntityType,
  BillingInvoiceStatus,
  BillingPaymentStatus,
  BillingQuoteStatus,
  BillingSequenceKind,
  type Prisma,
} from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { generateCsv } from "@/lib/csv-export";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import {
  bulkInvoiceActionSchema,
  bulkQuoteActionSchema,
  cancelInvoiceSchema,
  convertQuoteToInvoiceSchema,
  createCreditNoteSchema,
  createInvoiceDraftSchema,
  createQuoteDraftSchema,
  deleteQuoteSchema,
  creditNoteFilterSchema,
  deleteInvoiceSchema,
  duplicateQuoteSchema,
  duplicateInvoiceSchema,
  invoiceFilterSchema,
  issueInvoiceSchema,
  quoteFilterSchema,
  rebuildDeclarationPeriodsSchema,
  recordInvoicePaymentSchema,
  restoreInvoiceSchema,
  restoreQuoteSchema,
  setQuoteStatusSchema,
  updateInvoiceDraftSchema,
  updateQuoteDraftSchema,
} from "./billing.schema";
import {
  buildBeforeAfterMetadata,
  createBillingAuditEvent,
} from "./billing-audit";
import {
  computeDocumentLines,
  computeDocumentTotals,
  type BillingLineInput,
} from "./billing-math";
import { reserveBillingDocumentNumber } from "./billing-numbering";
import { resolveBillingCompliancePreset } from "./billing-compliance-rules";
import { generateFecEntries, generateFecFile } from "./billing-fec-export";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const ensureClientForUser = async (
  tx: Prisma.TransactionClient,
  input: { clientId: string; userId: string },
) => {
  const client = await tx.billingClient.findFirst({
    where: {
      id: input.clientId,
      userId: input.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      paymentTermsInDays: true,
      displayName: true,
    },
  });

  if (!client) {
    throw new ApplicationError("Client introuvable");
  }

  return client;
};

const buildQuoteVersionPayload = (quote: {
  id: string;
  number: string | null;
  status: BillingQuoteStatus;
  issueDate: Date;
  validUntil: Date | null;
  currency: string;
  notes: string | null;
  terms: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  lines: {
    position: number;
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountPercent: number;
    vatRatePercent: number;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  }[];
}) => {
  return {
    quoteId: quote.id,
    number: quote.number,
    status: quote.status,
    issueDate: quote.issueDate.toISOString(),
    validUntil: quote.validUntil ? quote.validUntil.toISOString() : null,
    currency: quote.currency,
    notes: quote.notes,
    terms: quote.terms,
    totals: {
      subtotalCents: quote.subtotalCents,
      discountCents: quote.discountCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
    },
    lines: quote.lines,
  };
};

const buildInvoiceVersionPayload = (invoice: {
  id: string;
  number: string | null;
  status: BillingInvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  documentTemplate: string | null;
  notes: string | null;
  terms: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  lines: {
    position: number;
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountPercent: number;
    vatRatePercent: number;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  }[];
}) => {
  return {
    invoiceId: invoice.id,
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
    currency: invoice.currency,
    documentTemplate: invoice.documentTemplate,
    notes: invoice.notes,
    terms: invoice.terms,
    totals: {
      subtotalCents: invoice.subtotalCents,
      discountCents: invoice.discountCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      paidCents: invoice.paidCents,
      balanceCents: invoice.balanceCents,
    },
    lines: invoice.lines,
  };
};

const persistQuoteVersion = async (
  tx: Prisma.TransactionClient,
  input: {
    quoteId: string;
    userId: string;
    payload: Prisma.InputJsonValue;
    reason: string;
  },
) => {
  const version = await tx.billingQuoteVersion.count({
    where: {
      quoteId: input.quoteId,
    },
  });

  await tx.billingQuoteVersion.create({
    data: {
      quoteId: input.quoteId,
      userId: input.userId,
      version: version + 1,
      reason: input.reason,
      payload: input.payload,
    },
  });
};

const persistInvoiceVersion = async (
  tx: Prisma.TransactionClient,
  input: {
    invoiceId: string;
    userId: string;
    payload: Prisma.InputJsonValue;
    reason: string;
  },
) => {
  const version = await tx.billingInvoiceVersion.count({
    where: {
      invoiceId: input.invoiceId,
    },
  });

  await tx.billingInvoiceVersion.create({
    data: {
      invoiceId: input.invoiceId,
      userId: input.userId,
      version: version + 1,
      reason: input.reason,
      payload: input.payload,
    },
  });
};

const normalizeLines = (lines: BillingLineInput[]) => {
  const computedLines = computeDocumentLines(lines);
  const totals = computeDocumentTotals(computedLines);

  return {
    computedLines,
    totals,
  };
};

const asOptionalText = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return value.trim();
};

const withDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const resolveInvoiceStatus = (input: {
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  currentStatus: BillingInvoiceStatus;
}) => {
  if (input.currentStatus === BillingInvoiceStatus.CANCELLED) {
    return BillingInvoiceStatus.CANCELLED;
  }

  if (input.balanceCents <= 0) {
    return BillingInvoiceStatus.PAID;
  }

  if (input.paidCents > 0) {
    return BillingInvoiceStatus.PARTIALLY_PAID;
  }

  if (input.currentStatus === BillingInvoiceStatus.DRAFT) {
    return BillingInvoiceStatus.DRAFT;
  }

  return BillingInvoiceStatus.ISSUED;
};

const getMonthBounds = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const roundCents = (value: number) => {
  return Math.round(value);
};

type BulkOperationItemResult = {
  id: string;
  status: "processed" | "skipped" | "failed";
  message: string;
};

const buildBulkAuditMetadata = (input: {
  operation: string;
  reason: string;
  batchId: string;
  index: number;
  total: number;
  dryRun: boolean;
  error?: string;
}) => {
  return {
    bulkContext: {
      operation: input.operation,
      reason: input.reason,
      batchId: input.batchId,
      index: input.index,
      total: input.total,
      dryRun: input.dryRun,
      ...(input.error ? { error: input.error } : {}),
    },
  };
};

export const createQuoteDraftAction = authAction
  .inputSchema(createQuoteDraftSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "billingQuotes");

    return prisma.$transaction(async (tx) => {
      await ensureClientForUser(tx, {
        clientId: parsedInput.clientId,
        userId: user.id,
      });

      const { computedLines, totals } = normalizeLines(parsedInput.lines);

      const quote = await tx.billingQuote.create({
        data: {
          userId: user.id,
          clientId: parsedInput.clientId,
          issueDate: parsedInput.issueDate,
          validUntil: parsedInput.validUntil ?? null,
          currency: parsedInput.currency,
          notes: asOptionalText(parsedInput.notes),
          terms: asOptionalText(parsedInput.terms),
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          lines: {
            create: computedLines.map((line) => ({
              position: line.position,
              description: line.description,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              discountPercent: line.discountPercent,
              vatRatePercent: line.vatRatePercent,
              subtotalCents: line.subtotalCents,
              taxCents: line.taxCents,
              totalCents: line.totalCents,
            })),
          },
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistQuoteVersion(tx, {
        quoteId: quote.id,
        userId: user.id,
        payload: buildQuoteVersionPayload(quote),
        reason: "Création du devis",
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.QUOTE,
        entityId: quote.id,
        eventType: BillingAuditEventType.CREATED,
        message: "Devis créé en brouillon",
      });

      return quote;
    });
  });

export const updateQuoteDraftAction = authAction
  .inputSchema(updateQuoteDraftSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const quote = await tx.billingQuote.findFirst({
        where: {
          id: parsedInput.quoteId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!quote) {
        throw new ApplicationError("Devis introuvable");
      }

      if (quote.status !== BillingQuoteStatus.DRAFT) {
        throw new ApplicationError(
          "Seuls les devis en brouillon peuvent être modifiés",
        );
      }

      const linesInput = parsedInput.lines
        ? normalizeLines(parsedInput.lines)
        : {
            computedLines: quote.lines,
            totals: {
              subtotalCents: quote.subtotalCents,
              discountCents: quote.discountCents,
              taxCents: quote.taxCents,
              totalCents: quote.totalCents,
            },
          };

      if (parsedInput.clientId) {
        await ensureClientForUser(tx, {
          userId: user.id,
          clientId: parsedInput.clientId,
        });
      }

      const updatedQuote = await tx.billingQuote.update({
        where: {
          id: quote.id,
        },
        data: {
          clientId: parsedInput.clientId,
          issueDate: parsedInput.issueDate,
          ...(parsedInput.validUntil === undefined
            ? {}
            : { validUntil: parsedInput.validUntil }),
          currency: parsedInput.currency,
          notes:
            parsedInput.notes === undefined
              ? undefined
              : asOptionalText(parsedInput.notes),
          terms:
            parsedInput.terms === undefined
              ? undefined
              : asOptionalText(parsedInput.terms),
          subtotalCents: linesInput.totals.subtotalCents,
          discountCents: linesInput.totals.discountCents,
          taxCents: linesInput.totals.taxCents,
          totalCents: linesInput.totals.totalCents,
          lines: parsedInput.lines
            ? {
                deleteMany: {},
                create: linesInput.computedLines.map((line) => ({
                  position: line.position,
                  description: line.description,
                  quantity: line.quantity,
                  unitPriceCents: line.unitPriceCents,
                  discountPercent: line.discountPercent,
                  vatRatePercent: line.vatRatePercent,
                  subtotalCents: line.subtotalCents,
                  taxCents: line.taxCents,
                  totalCents: line.totalCents,
                })),
              }
            : undefined,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistQuoteVersion(tx, {
        quoteId: updatedQuote.id,
        userId: user.id,
        payload: buildQuoteVersionPayload(updatedQuote),
        reason: "Mise à jour du devis brouillon",
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.QUOTE,
        entityId: updatedQuote.id,
        eventType: BillingAuditEventType.UPDATED,
        message: "Devis brouillon mis à jour",
        metadata: buildBeforeAfterMetadata({
          before: buildQuoteVersionPayload(quote),
          after: buildQuoteVersionPayload(updatedQuote),
        }),
      });

      return updatedQuote;
    });
  });

export const setQuoteStatusAction = authAction
  .inputSchema(setQuoteStatusSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const quote = await tx.billingQuote.findFirst({
        where: {
          id: parsedInput.quoteId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!quote) {
        throw new ApplicationError("Devis introuvable");
      }

      let number = quote.number;
      if (parsedInput.status === BillingQuoteStatus.SENT && !quote.number) {
        number = await reserveBillingDocumentNumber(tx, {
          userId: user.id,
          kind: BillingSequenceKind.QUOTE,
          date: quote.issueDate,
        });
      }

      const updated = await tx.billingQuote.update({
        where: {
          id: quote.id,
        },
        data: {
          status: parsedInput.status,
          number,
          acceptedAt:
            parsedInput.status === BillingQuoteStatus.ACCEPTED
              ? new Date()
              : parsedInput.status === BillingQuoteStatus.DRAFT
                ? null
                : quote.acceptedAt,
          refusedAt:
            parsedInput.status === BillingQuoteStatus.REFUSED
              ? new Date()
              : parsedInput.status === BillingQuoteStatus.DRAFT
                ? null
                : quote.refusedAt,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistQuoteVersion(tx, {
        quoteId: updated.id,
        userId: user.id,
        payload: buildQuoteVersionPayload(updated),
        reason: `Changement de statut vers ${parsedInput.status}`,
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.QUOTE,
        entityId: updated.id,
        eventType: BillingAuditEventType.STATUS_CHANGED,
        message: `Statut devis: ${quote.status} -> ${updated.status}`,
      });

      if (number && number !== quote.number) {
        await createBillingAuditEvent(tx, {
          userId: user.id,
          entityType: BillingEntityType.QUOTE,
          entityId: updated.id,
          eventType: BillingAuditEventType.NUMBER_ASSIGNED,
          message: `Numéro attribué: ${number}`,
        });
      }

      return updated;
    });
  });

export const duplicateQuoteAction = authAction
  .inputSchema(duplicateQuoteSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const quote = await tx.billingQuote.findFirst({
        where: {
          id: parsedInput.quoteId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!quote) {
        throw new ApplicationError("Devis introuvable");
      }

      const duplicated = await tx.billingQuote.create({
        data: {
          userId: user.id,
          clientId: quote.clientId,
          issueDate: new Date(),
          validUntil: quote.validUntil,
          currency: quote.currency,
          notes: quote.notes,
          terms: quote.terms,
          status: BillingQuoteStatus.DRAFT,
          number: null,
          acceptedAt: null,
          refusedAt: null,
          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          taxCents: quote.taxCents,
          totalCents: quote.totalCents,
          lines: {
            create: quote.lines.map((line) => ({
              position: line.position,
              description: line.description,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              discountPercent: line.discountPercent,
              vatRatePercent: line.vatRatePercent,
              subtotalCents: line.subtotalCents,
              taxCents: line.taxCents,
              totalCents: line.totalCents,
            })),
          },
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistQuoteVersion(tx, {
        quoteId: duplicated.id,
        userId: user.id,
        payload: buildQuoteVersionPayload(duplicated),
        reason: `Duplication depuis ${quote.number ?? quote.id}`,
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.QUOTE,
        entityId: duplicated.id,
        eventType: BillingAuditEventType.CREATED,
        message: "Devis dupliqué en brouillon",
        metadata: {
          sourceQuoteId: quote.id,
        },
      });

      return duplicated;
    });
  });

export const deleteQuoteAction = authAction
  .inputSchema(deleteQuoteSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const quote = await tx.billingQuote.findFirst({
        where: {
          id: parsedInput.quoteId,
          userId: user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          number: true,
          status: true,
        },
      });

      if (!quote) {
        throw new ApplicationError("Devis introuvable");
      }

      const deleted = await tx.billingQuote.update({
        where: {
          id: quote.id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.QUOTE,
        entityId: deleted.id,
        eventType: BillingAuditEventType.DELETED,
        message: `Devis ${deleted.number ?? deleted.id} supprimé`,
        metadata: {
          deletedFromStatus: quote.status,
          ownerOverride: true,
        },
      });

      return deleted;
    });
  });

export const restoreQuoteAction = authAction
  .inputSchema(restoreQuoteSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const quote = await tx.billingQuote.findFirst({
        where: {
          id: parsedInput.quoteId,
          userId: user.id,
          deletedAt: {
            not: null,
          },
        },
      });

      if (!quote) {
        throw new ApplicationError("Devis introuvable ou déjà actif");
      }

      const restored = await tx.billingQuote.update({
        where: {
          id: quote.id,
        },
        data: {
          deletedAt: null,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.QUOTE,
        entityId: restored.id,
        eventType: BillingAuditEventType.UPDATED,
        message: `Devis ${restored.number ?? restored.id} restauré`,
        metadata: {
          restoredFromDeletedAt: quote.deletedAt?.toISOString() ?? null,
        },
      });

      return restored;
    });
  });

export const bulkQuoteAction = authAction
  .inputSchema(bulkQuoteActionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const ids = Array.from(new Set(parsedInput.ids));
    const batchId = randomUUID();

    if (parsedInput.dryRun) {
      const quotes = await prisma.billingQuote.findMany({
        where: {
          id: { in: ids },
          userId: user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          number: true,
        },
      });

      return {
        dryRun: true,
        operation: parsedInput.operation,
        reason: parsedInput.reason,
        batchId,
        requestedCount: ids.length,
        matchedCount: quotes.length,
        items: quotes.map((quote) => ({
          id: quote.id,
          status: quote.status,
          number: quote.number,
        })),
      };
    }

    return prisma.$transaction(async (tx) => {
      const quotes = await tx.billingQuote.findMany({
        where: {
          id: { in: ids },
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });
      const byId = new Map(quotes.map((quote) => [quote.id, quote]));
      const results: BulkOperationItemResult[] = [];

      for (const [index, id] of ids.entries()) {
        const quote = byId.get(id);
        if (!quote) {
          results.push({
            id,
            status: "skipped",
            message: "Devis introuvable",
          });
          continue;
        }

        try {
          if (parsedInput.operation === "DELETE") {
            await tx.billingQuote.update({
              where: {
                id: quote.id,
              },
              data: {
                deletedAt: new Date(),
              },
            });

            await createBillingAuditEvent(tx, {
              userId: user.id,
              entityType: BillingEntityType.QUOTE,
              entityId: quote.id,
              eventType: BillingAuditEventType.DELETED,
              message: `Suppression bulk devis ${quote.number ?? quote.id}`,
              metadata: {
                deletedFromStatus: quote.status,
                ownerOverride: true,
                ...buildBulkAuditMetadata({
                  operation: parsedInput.operation,
                  reason: parsedInput.reason,
                  batchId,
                  index: index + 1,
                  total: ids.length,
                  dryRun: false,
                }),
              },
            });

            results.push({
              id: quote.id,
              status: "processed",
              message: "Devis supprimé",
            });
            continue;
          }

          if (parsedInput.operation === "CANCEL") {
            if (quote.status === BillingQuoteStatus.CANCELLED) {
              results.push({
                id: quote.id,
                status: "skipped",
                message: "Déjà annulé",
              });
              continue;
            }

            const updated = await tx.billingQuote.update({
              where: {
                id: quote.id,
              },
              data: {
                status: BillingQuoteStatus.CANCELLED,
              },
              include: {
                lines: {
                  orderBy: {
                    position: "asc",
                  },
                },
              },
            });

            await persistQuoteVersion(tx, {
              quoteId: updated.id,
              userId: user.id,
              payload: buildQuoteVersionPayload(updated),

              reason: `Bulk ${parsedInput.operation}: ${parsedInput.reason}`,
            });

            await createBillingAuditEvent(tx, {
              userId: user.id,
              entityType: BillingEntityType.QUOTE,
              entityId: updated.id,
              eventType: BillingAuditEventType.STATUS_CHANGED,
              message: `Bulk devis: ${quote.status} -> ${updated.status}`,
              metadata: buildBulkAuditMetadata({
                operation: parsedInput.operation,
                reason: parsedInput.reason,
                batchId,
                index: index + 1,
                total: ids.length,
                dryRun: false,
              }),
            });

            results.push({
              id: updated.id,
              status: "processed",
              message: "Devis annulé",
            });
            continue;
          }

          if (quote.status !== BillingQuoteStatus.DRAFT) {
            results.push({
              id: quote.id,
              status: "skipped",
              message: "Seuls les brouillons peuvent être envoyés",
            });
            continue;
          }

          const number =
            quote.number ??
            (await reserveBillingDocumentNumber(tx, {
              userId: user.id,
              kind: BillingSequenceKind.QUOTE,

              date: quote.issueDate,
            }));

          const updated = await tx.billingQuote.update({
            where: {
              id: quote.id,
            },
            data: {
              number,
              status: BillingQuoteStatus.SENT,
            },
            include: {
              lines: {
                orderBy: {
                  position: "asc",
                },
              },
            },
          });

          await persistQuoteVersion(tx, {
            quoteId: updated.id,
            userId: user.id,

            payload: buildQuoteVersionPayload(updated),
            reason: `Bulk ${parsedInput.operation}: ${parsedInput.reason}`,
          });

          await createBillingAuditEvent(tx, {
            userId: user.id,
            entityType: BillingEntityType.QUOTE,
            entityId: updated.id,
            eventType: BillingAuditEventType.STATUS_CHANGED,
            message: `Bulk devis: ${quote.status} -> ${updated.status}`,
            metadata: buildBulkAuditMetadata({
              operation: parsedInput.operation,
              reason: parsedInput.reason,
              batchId,
              index: index + 1,
              total: ids.length,
              dryRun: false,
            }),
          });

          results.push({
            id: updated.id,
            status: "processed",
            message: "Devis envoyé",
          });
        } catch (error) {
          await createBillingAuditEvent(tx, {
            userId: user.id,
            entityType: BillingEntityType.QUOTE,
            entityId: quote.id,
            eventType: BillingAuditEventType.UPDATED,
            message: `Échec opération bulk devis ${parsedInput.operation}`,
            metadata: buildBulkAuditMetadata({
              operation: parsedInput.operation,
              reason: parsedInput.reason,
              batchId,
              index: index + 1,
              total: ids.length,
              dryRun: false,
              error: error instanceof Error ? error.message : "Erreur inconnue",
            }),
          });

          results.push({
            id: quote.id,
            status: "failed",
            message: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }

      return {
        dryRun: false,
        operation: parsedInput.operation,
        reason: parsedInput.reason,
        batchId,
        requestedCount: ids.length,
        processedCount: results.filter((item) => item.status === "processed")
          .length,
        skippedCount: results.filter((item) => item.status === "skipped")
          .length,
        failedCount: results.filter((item) => item.status === "failed").length,
        results,
      };
    });
  });

export const convertQuoteToInvoiceAction = authAction
  .inputSchema(convertQuoteToInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "billingInvoices");

    return prisma.$transaction(async (tx) => {
      const quote = await tx.billingQuote.findFirst({
        where: {
          id: parsedInput.quoteId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          client: {
            select: {
              id: true,
              paymentTermsInDays: true,
              displayName: true,
            },
          },
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!quote) {
        throw new ApplicationError("Devis introuvable");
      }

      if (
        quote.status === BillingQuoteStatus.REFUSED ||
        quote.status === BillingQuoteStatus.CANCELLED
      ) {
        throw new ApplicationError(
          "Le devis ne peut pas être converti dans son statut actuel",
        );
      }

      const existingInvoice = await tx.billingInvoice.findFirst({
        where: {
          userId: user.id,
          sourceQuoteId: quote.id,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (existingInvoice) {
        throw new ApplicationError("Ce devis est déjà converti en facture");
      }

      const issueDate = parsedInput.issueDate ?? new Date();
      const dueDate =
        parsedInput.dueDate ??
        withDays(issueDate, quote.client.paymentTermsInDays ?? 30);
      const billingProfile = await tx.billingProfile.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          documentTemplate: true,
        },
      });

      const invoice = await tx.billingInvoice.create({
        data: {
          userId: user.id,
          clientId: quote.client.id,
          sourceQuoteId: quote.id,
          issueDate,
          dueDate,
          currency: quote.currency,
          documentTemplate: billingProfile?.documentTemplate ?? null,
          notes: asOptionalText(parsedInput.notes) ?? quote.notes,
          terms: asOptionalText(parsedInput.terms) ?? quote.terms,
          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          taxCents: quote.taxCents,
          totalCents: quote.totalCents,
          paidCents: 0,
          balanceCents: quote.totalCents,
          lines: {
            create: quote.lines.map((line) => ({
              position: line.position,
              description: line.description,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              discountPercent: line.discountPercent,
              vatRatePercent: line.vatRatePercent,
              subtotalCents: line.subtotalCents,
              taxCents: line.taxCents,
              totalCents: line.totalCents,
            })),
          },
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: invoice.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(invoice),
        reason: `Conversion du devis ${quote.id}`,
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.QUOTE,
        entityId: quote.id,
        eventType: BillingAuditEventType.CONVERTED_TO_INVOICE,
        message: `Devis converti en facture ${invoice.id}`,
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: invoice.id,
        eventType: BillingAuditEventType.CREATED,
        message: `Facture créée depuis le devis ${quote.id}`,
      });

      return invoice;
    });
  });

export const createInvoiceDraftAction = authAction
  .inputSchema(createInvoiceDraftSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "billingInvoices");

    return prisma.$transaction(async (tx) => {
      const client = await ensureClientForUser(tx, {
        clientId: parsedInput.clientId,
        userId: user.id,
      });

      const { computedLines, totals } = normalizeLines(parsedInput.lines);
      const issueDate = parsedInput.issueDate;
      const dueDate =
        parsedInput.dueDate ??
        withDays(issueDate, client.paymentTermsInDays ?? 30);
      const billingProfile = await tx.billingProfile.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          documentTemplate: true,
        },
      });

      const invoice = await tx.billingInvoice.create({
        data: {
          userId: user.id,
          clientId: parsedInput.clientId,
          issueDate,
          dueDate,
          currency: parsedInput.currency,
          documentTemplate:
            parsedInput.documentTemplate ??
            billingProfile?.documentTemplate ??
            null,
          notes: asOptionalText(parsedInput.notes),
          terms: asOptionalText(parsedInput.terms),
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          paidCents: 0,
          balanceCents: totals.totalCents,
          lines: {
            create: computedLines.map((line) => ({
              position: line.position,
              description: line.description,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              discountPercent: line.discountPercent,
              vatRatePercent: line.vatRatePercent,
              subtotalCents: line.subtotalCents,
              taxCents: line.taxCents,
              totalCents: line.totalCents,
            })),
          },
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: invoice.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(invoice),
        reason: "Création de la facture brouillon",
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: invoice.id,
        eventType: BillingAuditEventType.CREATED,
        message: "Facture brouillon créée",
      });

      return invoice;
    });
  });

export const updateInvoiceDraftAction = authAction
  .inputSchema(updateInvoiceDraftSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable");
      }

      if (parsedInput.clientId) {
        await ensureClientForUser(tx, {
          userId: user.id,
          clientId: parsedInput.clientId,
        });
      }

      const linesInput = parsedInput.lines
        ? normalizeLines(parsedInput.lines)
        : {
            computedLines: invoice.lines,
            totals: {
              subtotalCents: invoice.subtotalCents,
              discountCents: invoice.discountCents,
              taxCents: invoice.taxCents,
              totalCents: invoice.totalCents,
            },
          };

      const nextTotalCents = linesInput.totals.totalCents;
      const nextPaidCents = Math.min(invoice.paidCents, nextTotalCents);
      const nextBalanceCents = Math.max(0, nextTotalCents - nextPaidCents);
      const nextStatus = resolveInvoiceStatus({
        totalCents: nextTotalCents,
        paidCents: nextPaidCents,
        balanceCents: nextBalanceCents,
        currentStatus: invoice.status,
      });

      const updatedInvoice = await tx.billingInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          clientId: parsedInput.clientId,
          issueDate: parsedInput.issueDate,
          ...(parsedInput.dueDate === undefined
            ? {}
            : { dueDate: parsedInput.dueDate }),
          currency: parsedInput.currency,
          documentTemplate: parsedInput.documentTemplate ?? undefined,
          notes:
            parsedInput.notes === undefined
              ? undefined
              : asOptionalText(parsedInput.notes),
          terms:
            parsedInput.terms === undefined
              ? undefined
              : asOptionalText(parsedInput.terms),
          subtotalCents: linesInput.totals.subtotalCents,
          discountCents: linesInput.totals.discountCents,
          taxCents: linesInput.totals.taxCents,
          totalCents: nextTotalCents,
          paidCents: nextPaidCents,
          balanceCents: nextBalanceCents,
          status: nextStatus,
          lines: parsedInput.lines
            ? {
                deleteMany: {},
                create: linesInput.computedLines.map((line) => ({
                  position: line.position,
                  description: line.description,
                  quantity: line.quantity,
                  unitPriceCents: line.unitPriceCents,
                  discountPercent: line.discountPercent,
                  vatRatePercent: line.vatRatePercent,
                  subtotalCents: line.subtotalCents,
                  taxCents: line.taxCents,
                  totalCents: line.totalCents,
                })),
              }
            : undefined,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: updatedInvoice.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(updatedInvoice),
        reason: "Mise à jour de la facture",
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: updatedInvoice.id,
        eventType: BillingAuditEventType.UPDATED,
        message: `Facture mise à jour (${invoice.status} -> ${updatedInvoice.status})`,
        metadata: buildBeforeAfterMetadata({
          before: buildInvoiceVersionPayload(invoice),
          after: buildInvoiceVersionPayload(updatedInvoice),
        }),
      });

      return updatedInvoice;
    });
  });

export const duplicateInvoiceAction = authAction
  .inputSchema(duplicateInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable");
      }

      const duplicated = await tx.billingInvoice.create({
        data: {
          userId: user.id,
          clientId: invoice.clientId,
          sourceQuoteId: null,
          issueDate: new Date(),
          dueDate: invoice.dueDate,
          currency: invoice.currency,
          documentTemplate: invoice.documentTemplate,
          notes: invoice.notes,
          terms: invoice.terms,
          status: BillingInvoiceStatus.DRAFT,
          subtotalCents: invoice.subtotalCents,
          discountCents: invoice.discountCents,
          taxCents: invoice.taxCents,
          totalCents: invoice.totalCents,
          paidCents: 0,
          balanceCents: invoice.totalCents,
          issuedAt: null,
          paidAt: null,
          lines: {
            create: invoice.lines.map((line) => ({
              position: line.position,
              description: line.description,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              discountPercent: line.discountPercent,
              vatRatePercent: line.vatRatePercent,
              subtotalCents: line.subtotalCents,
              taxCents: line.taxCents,
              totalCents: line.totalCents,
            })),
          },
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: duplicated.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(duplicated),
        reason: `Duplication depuis ${invoice.number ?? invoice.id}`,
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: duplicated.id,
        eventType: BillingAuditEventType.CREATED,
        message: "Facture dupliquée en brouillon",
        metadata: {
          sourceInvoiceId: invoice.id,
        },
      });

      return duplicated;
    });
  });

export const cancelInvoiceAction = authAction
  .inputSchema(cancelInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable");
      }

      if (invoice.status === BillingInvoiceStatus.CANCELLED) {
        throw new ApplicationError("Cette facture est déjà annulée");
      }

      if (invoice.paidCents > 0) {
        throw new ApplicationError(
          "Impossible d’annuler une facture déjà encaissée. Crée un avoir si besoin.",
        );
      }

      const updated = await tx.billingInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status: BillingInvoiceStatus.CANCELLED,
          balanceCents: 0,
          paidAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: updated.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(updated),
        reason: "Facture annulée",
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: updated.id,
        eventType: BillingAuditEventType.STATUS_CHANGED,
        message: `Facture annulée (${invoice.status} -> ${updated.status})`,
      });

      return updated;
    });
  });

export const deleteInvoiceAction = authAction
  .inputSchema(deleteInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          number: true,
          status: true,
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable");
      }

      const deleted = await tx.billingInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      // Soft delete associated payments
      await tx.billingPayment.updateMany({
        where: {
          userId: user.id,
          allocations: {
            some: {
              invoiceId: invoice.id,
            },
          },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: deleted.id,
        eventType: BillingAuditEventType.DELETED,
        message: `Facture ${deleted.number ?? deleted.id} supprimée`,
        metadata: {
          deletedFromStatus: invoice.status,
          ownerOverride: true,
        },
      });

      return deleted;
    });
  });

export const restoreInvoiceAction = authAction
  .inputSchema(restoreInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: {
            not: null,
          },
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable ou déjà active");
      }

      const restored = await tx.billingInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          deletedAt: null,
        },
      });

      // Restore associated payments
      await tx.billingPayment.updateMany({
        where: {
          userId: user.id,
          allocations: {
            some: {
              invoiceId: invoice.id,
            },
          },
          deletedAt: {
            not: null,
          },
        },
        data: {
          deletedAt: null,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: restored.id,
        eventType: BillingAuditEventType.UPDATED,
        message: `Facture ${restored.number ?? restored.id} restaurée`,
        metadata: {
          restoredFromDeletedAt: invoice.deletedAt?.toISOString() ?? null,
        },
      });

      return restored;
    });
  });

export const bulkInvoiceAction = authAction
  .inputSchema(bulkInvoiceActionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const ids = Array.from(new Set(parsedInput.ids));
    const batchId = randomUUID();

    if (parsedInput.dryRun) {
      const invoices = await prisma.billingInvoice.findMany({
        where: {
          id: { in: ids },
          userId: user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          number: true,
          balanceCents: true,
          paidCents: true,
        },
      });

      return {
        dryRun: true,
        operation: parsedInput.operation,
        reason: parsedInput.reason,
        batchId,
        requestedCount: ids.length,
        matchedCount: invoices.length,
        items: invoices,
      };
    }

    return prisma.$transaction(async (tx) => {
      const invoices = await tx.billingInvoice.findMany({
        where: {
          id: { in: ids },
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      const byId = new Map(invoices.map((invoice) => [invoice.id, invoice]));
      const results: BulkOperationItemResult[] = [];

      for (const [index, id] of ids.entries()) {
        const invoice = byId.get(id);
        if (!invoice) {
          results.push({
            id,
            status: "skipped",
            message: "Facture introuvable",
          });

          continue;
        }

        try {
          if (parsedInput.operation === "DELETE") {
            await tx.billingInvoice.update({
              where: {
                id: invoice.id,
              },
              data: {
                deletedAt: new Date(),
              },
            });

            await createBillingAuditEvent(tx, {
              userId: user.id,
              entityType: BillingEntityType.INVOICE,
              entityId: invoice.id,
              eventType: BillingAuditEventType.DELETED,
              message: `Suppression bulk facture ${invoice.number ?? invoice.id}`,
              metadata: {
                deletedFromStatus: invoice.status,
                ownerOverride: true,
                ...buildBulkAuditMetadata({
                  operation: parsedInput.operation,
                  reason: parsedInput.reason,
                  batchId,
                  index: index + 1,
                  total: ids.length,
                  dryRun: false,
                }),
              },
            });

            results.push({
              id: invoice.id,
              status: "processed",
              message: "Facture supprimée",
            });
            continue;
          }

          if (parsedInput.operation === "CANCEL") {
            if (invoice.status === BillingInvoiceStatus.CANCELLED) {
              results.push({
                id: invoice.id,
                status: "skipped",
                message: "Déjà annulée",
              });
              continue;
            }

            if (invoice.paidCents > 0) {
              results.push({
                id: invoice.id,
                status: "skipped",
                message: "Facture encaissée: annulation ignorée",
              });
              continue;
            }

            const updated = await tx.billingInvoice.update({
              where: {
                id: invoice.id,
              },
              data: {
                status: BillingInvoiceStatus.CANCELLED,

                balanceCents: 0,
                paidAt: null,
              },
              include: {
                lines: {
                  orderBy: {
                    position: "asc",
                  },
                },
              },
            });

            await persistInvoiceVersion(tx, {
              invoiceId: updated.id,
              userId: user.id,
              payload: buildInvoiceVersionPayload(updated),
              reason: `Bulk ${parsedInput.operation}: ${parsedInput.reason}`,
            });

            await createBillingAuditEvent(tx, {
              userId: user.id,
              entityType: BillingEntityType.INVOICE,
              entityId: updated.id,
              eventType: BillingAuditEventType.STATUS_CHANGED,
              message: `Bulk facture: ${invoice.status} -> ${updated.status}`,
              metadata: buildBulkAuditMetadata({
                operation: parsedInput.operation,
                reason: parsedInput.reason,
                batchId,
                index: index + 1,
                total: ids.length,
                dryRun: false,
              }),
            });

            results.push({
              id: updated.id,
              status: "processed",
              message: "Facture annulée",
            });
            continue;
          }

          if (invoice.status !== BillingInvoiceStatus.DRAFT) {
            results.push({
              id: invoice.id,
              status: "skipped",
              message: "Seuls les brouillons peuvent être émis",
            });
            continue;
          }

          const issueDate = invoice.issueDate;
          const number =
            invoice.number ??
            (await reserveBillingDocumentNumber(tx, {
              userId: user.id,
              kind: BillingSequenceKind.INVOICE,
              date: issueDate,
            }));
          const balanceCents = Math.max(
            0,
            invoice.totalCents - invoice.paidCents,
          );
          const status =
            balanceCents === 0
              ? BillingInvoiceStatus.PAID
              : invoice.paidCents > 0
                ? BillingInvoiceStatus.PARTIALLY_PAID
                : BillingInvoiceStatus.ISSUED;

          const updated = await tx.billingInvoice.update({
            where: {
              id: invoice.id,
            },
            data: {
              number,
              issueDate,
              issuedAt: new Date(),
              status,

              balanceCents,
              paidAt: status === BillingInvoiceStatus.PAID ? new Date() : null,
            },
            include: {
              lines: {
                orderBy: {
                  position: "asc",
                },
              },
            },
          });

          await persistInvoiceVersion(tx, {
            invoiceId: updated.id,
            userId: user.id,
            payload: buildInvoiceVersionPayload(updated),
            reason: `Bulk ${parsedInput.operation}: ${parsedInput.reason}`,
          });

          await createBillingAuditEvent(tx, {
            userId: user.id,
            entityType: BillingEntityType.INVOICE,
            entityId: updated.id,

            eventType: BillingAuditEventType.STATUS_CHANGED,
            message: `Bulk facture: ${invoice.status} -> ${updated.status}`,
            metadata: buildBulkAuditMetadata({
              operation: parsedInput.operation,
              reason: parsedInput.reason,
              batchId,
              index: index + 1,

              total: ids.length,
              dryRun: false,
            }),
          });

          results.push({
            id: updated.id,
            status: "processed",
            message: "Facture émise",
          });
        } catch (error) {
          await createBillingAuditEvent(tx, {
            userId: user.id,
            entityType: BillingEntityType.INVOICE,
            entityId: invoice.id,
            eventType: BillingAuditEventType.UPDATED,
            message: `Échec opération bulk facture ${parsedInput.operation}`,
            metadata: buildBulkAuditMetadata({
              operation: parsedInput.operation,
              reason: parsedInput.reason,
              batchId,
              index: index + 1,
              total: ids.length,
              dryRun: false,
              error: error instanceof Error ? error.message : "Erreur inconnue",
            }),
          });

          results.push({
            id: invoice.id,
            status: "failed",
            message: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }

      return {
        dryRun: false,
        operation: parsedInput.operation,
        reason: parsedInput.reason,
        batchId,
        requestedCount: ids.length,
        processedCount: results.filter((item) => item.status === "processed")
          .length,
        skippedCount: results.filter((item) => item.status === "skipped")
          .length,
        failedCount: results.filter((item) => item.status === "failed").length,
        results,
      };
    });
  });

export const issueInvoiceAction = authAction
  .inputSchema(issueInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable");
      }

      if (invoice.status !== BillingInvoiceStatus.DRAFT) {
        throw new ApplicationError(
          "Seules les factures brouillon peuvent être émises",
        );
      }

      const issueDate = parsedInput.issueDate ?? invoice.issueDate;
      const number =
        invoice.number ??
        (await reserveBillingDocumentNumber(tx, {
          userId: user.id,
          kind: BillingSequenceKind.INVOICE,
          date: issueDate,
        }));

      const balanceCents = Math.max(0, invoice.totalCents - invoice.paidCents);
      const status =
        balanceCents === 0
          ? BillingInvoiceStatus.PAID
          : invoice.paidCents > 0
            ? BillingInvoiceStatus.PARTIALLY_PAID
            : BillingInvoiceStatus.ISSUED;

      const updated = await tx.billingInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          number,
          issueDate,
          issuedAt: new Date(),
          status,
          balanceCents,
          paidAt: status === BillingInvoiceStatus.PAID ? new Date() : null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: updated.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(updated),
        reason: "Émission de la facture",
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: updated.id,
        eventType: BillingAuditEventType.STATUS_CHANGED,
        message: `Facture émise (${updated.number ?? "sans numéro"})`,
      });

      if (updated.number && updated.number !== invoice.number) {
        await createBillingAuditEvent(tx, {
          userId: user.id,
          entityType: BillingEntityType.INVOICE,
          entityId: updated.id,
          eventType: BillingAuditEventType.NUMBER_ASSIGNED,
          message: `Numéro attribué: ${updated.number}`,
        });
      }

      return updated;
    });
  });

export const recordInvoicePaymentAction = authAction
  .inputSchema(recordInvoicePaymentSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable");
      }

      if (invoice.status === BillingInvoiceStatus.CANCELLED) {
        throw new ApplicationError("La facture est annulée");
      }

      if (invoice.balanceCents <= 0) {
        throw new ApplicationError("Cette facture est déjà soldée");
      }

      if (parsedInput.amountCents > invoice.balanceCents) {
        throw new ApplicationError("Le paiement dépasse le solde restant dû");
      }

      const payment = await tx.billingPayment.create({
        data: {
          userId: user.id,
          clientId: invoice.clientId,
          method: parsedInput.method,
          status: BillingPaymentStatus.CONFIRMED,
          amountCents: parsedInput.amountCents,
          paidAt: parsedInput.paidAt,
          reference: asOptionalText(parsedInput.reference),
          note: asOptionalText(parsedInput.note),
          allocations: {
            create: {
              invoiceId: invoice.id,
              amountCents: parsedInput.amountCents,
            },
          },
        },
        include: {
          allocations: true,
        },
      });

      const paidCents = invoice.paidCents + parsedInput.amountCents;
      const balanceCents = Math.max(0, invoice.totalCents - paidCents);

      const status =
        balanceCents === 0
          ? BillingInvoiceStatus.PAID
          : BillingInvoiceStatus.PARTIALLY_PAID;

      const updatedInvoice = await tx.billingInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          paidCents,
          balanceCents,
          status,
          paidAt:
            status === BillingInvoiceStatus.PAID ? parsedInput.paidAt : null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: updatedInvoice.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(updatedInvoice),
        reason: `Paiement enregistré (${parsedInput.amountCents} cents)`,
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.PAYMENT,
        entityId: payment.id,
        eventType: BillingAuditEventType.PAYMENT_RECORDED,
        message: `Paiement de ${parsedInput.amountCents} cents enregistré`,
        metadata: {
          invoiceId: invoice.id,
          amountCents: parsedInput.amountCents,
          method: parsedInput.method,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: invoice.id,
        eventType: BillingAuditEventType.STATUS_CHANGED,
        message: `Facture mise à jour après paiement (${status})`,
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  });

export const createCreditNoteAction = authAction
  .inputSchema(createCreditNoteSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findFirst({
        where: {
          id: parsedInput.invoiceId,
          userId: user.id,
          deletedAt: null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      if (!invoice) {
        throw new ApplicationError("Facture introuvable");
      }

      if (invoice.status === BillingInvoiceStatus.DRAFT) {
        throw new ApplicationError(
          "La facture doit être émise avant création d’un avoir",
        );
      }

      const targetAmountCents =
        parsedInput.amountCents ??
        (invoice.balanceCents > 0 ? invoice.balanceCents : invoice.totalCents);

      if (targetAmountCents <= 0) {
        throw new ApplicationError("Le montant de l’avoir est invalide");
      }

      if (targetAmountCents > invoice.totalCents) {
        throw new ApplicationError(
          "Le montant de l’avoir ne peut pas dépasser le total de la facture",
        );
      }

      const number = await reserveBillingDocumentNumber(tx, {
        userId: user.id,
        kind: BillingSequenceKind.CREDIT_NOTE,
      });

      const totalBefore = Math.max(invoice.totalCents, 1);
      const ratio = targetAmountCents / totalBefore;
      const taxReduction = roundCents(invoice.taxCents * ratio);

      const creditNote = await tx.billingCreditNote.create({
        data: {
          userId: user.id,
          invoiceId: invoice.id,
          number,
          status: BillingCreditNoteStatus.ISSUED,
          issueDate: parsedInput.issueDate ?? new Date(),
          reason: asOptionalText(parsedInput.reason),
          subtotalCents: Math.max(0, targetAmountCents - taxReduction),
          taxCents: Math.max(0, taxReduction),
          totalCents: targetAmountCents,
        },
      });

      const nextTotalCents = Math.max(
        0,
        invoice.totalCents - targetAmountCents,
      );
      const nextTaxCents = Math.max(0, invoice.taxCents - taxReduction);
      const nextSubtotalCents = Math.max(0, nextTotalCents - nextTaxCents);
      const nextDiscountCents =
        invoice.totalCents === 0
          ? invoice.discountCents
          : roundCents(invoice.discountCents * (nextTotalCents / totalBefore));
      const nextPaidCents = Math.min(invoice.paidCents, nextTotalCents);
      const nextBalanceCents = Math.max(0, nextTotalCents - nextPaidCents);
      const nextStatus = resolveInvoiceStatus({
        totalCents: nextTotalCents,
        paidCents: nextPaidCents,
        balanceCents: nextBalanceCents,
        currentStatus: invoice.status,
      });

      const updatedInvoice = await tx.billingInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          subtotalCents: nextSubtotalCents,
          taxCents: nextTaxCents,
          discountCents: nextDiscountCents,
          totalCents: nextTotalCents,
          paidCents: nextPaidCents,
          balanceCents: nextBalanceCents,
          status: nextStatus,
          paidAt:
            nextStatus === BillingInvoiceStatus.PAID
              ? (invoice.paidAt ?? new Date())
              : null,
        },
        include: {
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await persistInvoiceVersion(tx, {
        invoiceId: updatedInvoice.id,
        userId: user.id,
        payload: buildInvoiceVersionPayload(updatedInvoice),
        reason: `Avoir ${creditNote.number ?? creditNote.id} créé`,
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.CREDIT_NOTE,
        entityId: creditNote.id,
        eventType: BillingAuditEventType.CREATED,
        message: `Avoir ${creditNote.number} créé`,
        metadata: {
          invoiceId: invoice.id,
          amountCents: targetAmountCents,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.INVOICE,
        entityId: invoice.id,
        eventType: BillingAuditEventType.STATUS_CHANGED,
        message: `Facture ajustée après avoir (${nextStatus})`,
      });

      return {
        creditNote,
        invoice: updatedInvoice,
      };
    });
  });

export const getCreditNotesAction = authAction
  .inputSchema(creditNoteFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Prisma.BillingCreditNoteWhereInput = {
      userId: user.id,
    };

    if (filters.search && filters.search.trim().length > 0) {
      where.OR = [
        {
          number: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          invoice: {
            client: {
              displayName: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const [creditNotes, total] = await Promise.all([
      prisma.billingCreditNote.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              client: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.billingCreditNote.count({ where }),
    ]);

    return {
      creditNotes,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });

export const rebuildBillingDeclarationPeriodsAction = authAction
  .inputSchema(rebuildDeclarationPeriodsSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    let resolvedType =
      parsedInput.type ?? BillingDeclarationPeriodType.QUARTERLY;
    let resolvedContributionRatePercent =
      parsedInput.contributionRatePercent ?? 23.1;

    const periods = await prisma.$transaction(async (tx) => {
      const profile = await tx.billingProfile.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          freelanceStatus: true,
          activityCategory: true,
          urssafDeclarationType: true,
          urssafContributionRate: true,
        },
      });

      const preset = resolveBillingCompliancePreset({
        freelanceStatus: profile?.freelanceStatus ?? null,
        activityCategory: profile?.activityCategory ?? null,
      });

      resolvedType =
        parsedInput.type ??
        profile?.urssafDeclarationType ??
        preset.defaultDeclarationType;
      resolvedContributionRatePercent =
        parsedInput.contributionRatePercent ??
        profile?.urssafContributionRate ??
        preset.defaultContributionRatePercent;

      await tx.billingSocialContributionSnapshot.deleteMany({
        where: {
          userId: user.id,
          periodKey: {
            startsWith: `${parsedInput.year}-`,
          },
        },
      });

      const periodKeys =
        resolvedType === BillingDeclarationPeriodType.MONTHLY
          ? Array.from({ length: 12 }, (_, index) => ({
              month: index + 1,
              quarter: null as number | null,
              periodKey: `${parsedInput.year}-${String(index + 1).padStart(2, "0")}`,
            }))
          : Array.from({ length: 4 }, (_, index) => ({
              month: null as number | null,
              quarter: index + 1,
              periodKey: `${parsedInput.year}-Q${index + 1}`,
            }));

      const generated = (
        await Promise.all(
          periodKeys.map(async (entry) => {
            const monthBounds =
              resolvedType === BillingDeclarationPeriodType.MONTHLY
                ? [getMonthBounds(parsedInput.year, entry.month ?? 1)]
                : (() => {
                    const quarter = entry.quarter ?? 1;
                    const monthStart = (quarter - 1) * 3 + 1;
                    return [
                      getMonthBounds(parsedInput.year, monthStart),
                      getMonthBounds(parsedInput.year, monthStart + 1),
                      getMonthBounds(parsedInput.year, monthStart + 2),
                    ];
                  })();

            const rangeStart = monthBounds.at(0)?.start;
            const rangeEnd = monthBounds.at(-1)?.end;

            if (!rangeStart || !rangeEnd) {
              return null;
            }

            const [invoicedAgg, collectedAgg] = await Promise.all([
              tx.billingInvoice.aggregate({
                where: {
                  userId: user.id,
                  deletedAt: null,
                  status: {
                    in: [
                      BillingInvoiceStatus.ISSUED,
                      BillingInvoiceStatus.PARTIALLY_PAID,
                      BillingInvoiceStatus.PAID,
                      BillingInvoiceStatus.OVERDUE,
                    ],
                  },
                  issueDate: {
                    gte: rangeStart,
                    lte: rangeEnd,
                  },
                },
                _sum: {
                  totalCents: true,
                },
              }),
              tx.billingPayment.aggregate({
                where: {
                  userId: user.id,
                  deletedAt: null,
                  status: BillingPaymentStatus.CONFIRMED,
                  paidAt: {
                    gte: rangeStart,
                    lte: rangeEnd,
                  },
                },
                _sum: {
                  amountCents: true,
                },
              }),
            ]);

            const invoicedCents = invoicedAgg._sum.totalCents ?? 0;
            const collectedCents = collectedAgg._sum.amountCents ?? 0;
            const socialChargesCents = roundCents(
              (collectedCents * resolvedContributionRatePercent) / 100,
            );

            const dueDate =
              resolvedType === BillingDeclarationPeriodType.MONTHLY
                ? new Date(
                    parsedInput.year,
                    (entry.month ?? 1) + 1,
                    0,
                    23,
                    59,
                    59,
                    999,
                  )
                : (() => {
                    const quarter = entry.quarter ?? 1;
                    if (quarter === 4) {
                      return new Date(
                        parsedInput.year + 1,
                        1,
                        0,
                        23,
                        59,
                        59,
                        999,
                      );
                    }
                    return new Date(
                      parsedInput.year,
                      quarter * 3 + 1,
                      0,
                      23,
                      59,
                      59,
                      999,
                    );
                  })();

            const declaration = await tx.billingDeclarationPeriod.upsert({
              where: {
                userId_periodKey: {
                  userId: user.id,
                  periodKey: entry.periodKey,
                },
              },
              create: {
                userId: user.id,
                type: resolvedType,
                year: parsedInput.year,
                month: entry.month,
                quarter: entry.quarter,
                periodKey: entry.periodKey,
                status: BillingDeclarationPeriodStatus.READY,
                dueDate,
                invoicedCents,
                collectedCents,
                socialChargesCents,
              },
              update: {
                type: resolvedType,
                year: parsedInput.year,
                month: entry.month,
                quarter: entry.quarter,
                status: BillingDeclarationPeriodStatus.READY,
                dueDate,
                invoicedCents,
                collectedCents,
                socialChargesCents,
              },
            });

            await tx.billingSocialContributionSnapshot.create({
              data: {
                userId: user.id,
                periodKey: entry.periodKey,
                activityType: "FREELANCE",
                regimeLabel: "URSSAF_ESTIMATE",
                revenueCents: collectedCents,
                ratePercent: resolvedContributionRatePercent,
                amountCents: socialChargesCents,
                source: "jobio-estimator",
              },
            });

            return {
              id: declaration.id,
              periodKey: declaration.periodKey,
              dueDate: declaration.dueDate,
              invoicedCents: declaration.invoicedCents,
              collectedCents: declaration.collectedCents,
              socialChargesCents: declaration.socialChargesCents,
            };
          }),
        )
      ).filter(
        (period): period is NonNullable<typeof period> => period !== null,
      );

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.DECLARATION_PERIOD,
        entityId: `${parsedInput.year}-${resolvedType}`,
        eventType: BillingAuditEventType.UPDATED,
        message: `Périodes ${resolvedType.toLowerCase()} recalculées pour ${parsedInput.year}`,
        metadata: {
          contributionRatePercent: resolvedContributionRatePercent,
          declarationType: resolvedType,
          profilePreset: preset.statusLabel,
          periods: generated.length,
        },
      });

      return generated;
    });

    return {
      periods,
      year: parsedInput.year,
      type: resolvedType,
      contributionRatePercent: resolvedContributionRatePercent,
    };
  });

export const getQuotesAction = authAction
  .inputSchema(quoteFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search && filters.search.trim().length > 0) {
      where.OR = [
        {
          number: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          client: {
            displayName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.billingQuote.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              displayName: true,
            },
          },
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.billingQuote.count({ where }),
    ]);

    return {
      quotes,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });

export const getInvoicesAction = authAction
  .inputSchema(invoiceFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search && filters.search.trim().length > 0) {
      where.OR = [
        {
          number: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          client: {
            displayName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.billingInvoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              displayName: true,
            },
          },
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.billingInvoice.count({ where }),
    ]);

    return {
      invoices,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });

export const getBillingDashboardSnapshotAction = authAction
  .inputSchema(z.object({}).optional())
  .action(async ({ ctx: { user } }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const chartRangeStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      invoiceAgg,
      outstandingAgg,
      paidAgg,
      overdueCount,
      quoteToValidateCount,
      declarations,
      invoiceStatusBreakdown,
      timelineInvoices,
      timelinePayments,
    ] = await Promise.all([
      prisma.billingInvoice.aggregate({
        where: {
          userId: user.id,
          deletedAt: null,
          issueDate: {
            gte: monthStart,
          },
        },
        _sum: {
          totalCents: true,
        },
      }),
      prisma.billingInvoice.aggregate({
        where: {
          userId: user.id,
          deletedAt: null,
          status: {
            in: [
              BillingInvoiceStatus.ISSUED,
              BillingInvoiceStatus.PARTIALLY_PAID,
              BillingInvoiceStatus.OVERDUE,
            ],
          },
        },
        _sum: {
          balanceCents: true,
        },
      }),
      prisma.billingInvoice.aggregate({
        where: {
          userId: user.id,
          deletedAt: null,
          status: BillingInvoiceStatus.PAID,
        },
        _sum: {
          paidCents: true,
        },
      }),
      prisma.billingInvoice.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: BillingInvoiceStatus.OVERDUE,
        },
      }),
      prisma.billingQuote.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: {
            in: [BillingQuoteStatus.DRAFT, BillingQuoteStatus.SENT],
          },
        },
      }),
      prisma.billingDeclarationPeriod.findMany({
        where: {
          userId: user.id,
          submittedAt: null,
        },
        orderBy: [
          {
            year: "desc",
          },
          {
            quarter: "desc",
          },
          {
            month: "desc",
          },
        ],
        take: 3,
      }),
      prisma.billingInvoice.groupBy({
        by: ["status"],
        where: {
          userId: user.id,
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.billingInvoice.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          issueDate: {
            gte: chartRangeStart,
          },
        },
        select: {
          issueDate: true,
          totalCents: true,
          balanceCents: true,
          clientId: true,
          client: {
            select: {
              displayName: true,
            },
          },
        },
      }),
      prisma.billingPayment.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          paidAt: {
            gte: chartRangeStart,
          },
        },
        select: {
          paidAt: true,
          amountCents: true,
        },
      }),
    ]);

    const revenueTimeline = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(
        chartRangeStart.getFullYear(),
        chartRangeStart.getMonth() + index,
        1,
      );
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      const label = monthDate.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      });
      return {
        key,
        label,
        invoicedCents: 0,
        collectedCents: 0,
        outstandingCents: 0,
      };
    });

    const timelineMap = new Map(
      revenueTimeline.map((item) => [item.key, item]),
    );

    for (const invoice of timelineInvoices) {
      const key = `${invoice.issueDate.getFullYear()}-${String(
        invoice.issueDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      const bucket = timelineMap.get(key);
      if (!bucket) {
        continue;
      }

      bucket.invoicedCents += invoice.totalCents;
      bucket.outstandingCents += invoice.balanceCents;
    }

    for (const payment of timelinePayments) {
      const key = `${payment.paidAt.getFullYear()}-${String(
        payment.paidAt.getMonth() + 1,
      ).padStart(2, "0")}`;
      const bucket = timelineMap.get(key);
      if (!bucket) {
        continue;
      }

      bucket.collectedCents += payment.amountCents;
    }

    const statusBreakdown = invoiceStatusBreakdown.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    }));

    const byClient = new Map<
      string,
      { clientLabel: string; invoicedCents: number; outstandingCents: number }
    >();

    for (const invoice of timelineInvoices) {
      const existing = byClient.get(invoice.clientId);
      if (!existing) {
        byClient.set(invoice.clientId, {
          clientLabel: invoice.client.displayName,
          invoicedCents: invoice.totalCents,
          outstandingCents: invoice.balanceCents,
        });
        continue;
      }

      existing.invoicedCents += invoice.totalCents;
      existing.outstandingCents += invoice.balanceCents;
    }

    const topClients = Array.from(byClient.values())
      .sort((left, right) => right.invoicedCents - left.invoicedCents)
      .slice(0, 6);

    const declarationBreakdown = declarations.map((period) => ({
      periodKey: period.periodKey,
      invoicedCents: period.invoicedCents,
      collectedCents: period.collectedCents,
      socialChargesCents: period.socialChargesCents,
    }));

    return {
      turnoverInvoicedCurrentMonthCents: invoiceAgg._sum.totalCents ?? 0,
      outstandingCents: outstandingAgg._sum.balanceCents ?? 0,
      collectedCents: paidAgg._sum.paidCents ?? 0,
      overdueCount,
      quoteToValidateCount,
      declarations,
      charts: {
        revenueTimeline,
        statusBreakdown,
        topClients,
        declarationBreakdown,
      },
    };
  });

export const getBillingPaymentsAction = authAction
  .inputSchema(
    z.object({
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(20),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const [payments, total] = await Promise.all([
      prisma.billingPayment.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        include: {
          client: {
            select: {
              id: true,
              displayName: true,
            },
          },
          allocations: {
            include: {
              invoice: {
                select: {
                  id: true,
                  number: true,
                },
              },
            },
          },
        },
        orderBy: {
          paidAt: "desc",
        },
        skip: (parsedInput.page - 1) * parsedInput.pageSize,
        take: parsedInput.pageSize,
      }),
      prisma.billingPayment.count({
        where: {
          userId: user.id,
          deletedAt: null,
        },
      }),
    ]);

    return {
      payments,
      total,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
      totalPages: Math.ceil(total / parsedInput.pageSize),
    };
  });

export const getBillingAuditEventsAction = authAction
  .inputSchema(
    z.object({
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(30),
      entityType: z.nativeEnum(BillingEntityType).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const where: Prisma.BillingAuditEventWhereInput = {
      userId: user.id,
      ...(parsedInput.entityType ? { entityType: parsedInput.entityType } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.billingAuditEvent.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (parsedInput.page - 1) * parsedInput.pageSize,
        take: parsedInput.pageSize,
      }),
      prisma.billingAuditEvent.count({ where }),
    ]);

    return {
      events,
      total,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
      totalPages: Math.ceil(total / parsedInput.pageSize),
    };
  });

export const exportBillingCompliancePackageAction = authAction
  .inputSchema(
    z
      .object({
        includeExpenses: z.boolean().default(true),
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const includeExpenses = parsedInput?.includeExpenses ?? true;

    const [
      profile,
      clients,
      quotes,
      invoices,
      payments,
      creditNotes,
      declarations,
      audits,
      expenseInvoices,
      expenseNotes,
      expenseTrips,
    ] = await Promise.all([
      prisma.billingProfile.findUnique({
        where: {
          userId: user.id,
        },
      }),
      prisma.billingClient.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        include: {
          contacts: {
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.billingQuote.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        include: {
          client: {
            select: {
              displayName: true,
            },
          },
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          issueDate: "desc",
        },
      }),
      prisma.billingInvoice.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        include: {
          client: {
            select: {
              displayName: true,
            },
          },
          lines: {
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          issueDate: "desc",
        },
      }),
      prisma.billingPayment.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        include: {
          client: {
            select: {
              displayName: true,
            },
          },
          allocations: {
            include: {
              invoice: {
                select: {
                  number: true,
                },
              },
            },
          },
        },
        orderBy: {
          paidAt: "desc",
        },
      }),
      prisma.billingCreditNote.findMany({
        where: {
          userId: user.id,
        },
        include: {
          invoice: {
            select: {
              number: true,
              client: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          issueDate: "desc",
        },
      }),
      prisma.billingDeclarationPeriod.findMany({
        where: {
          userId: user.id,
        },
        orderBy: [
          {
            year: "desc",
          },
          {
            quarter: "desc",
          },
          {
            month: "desc",
          },
        ],
      }),
      prisma.billingAuditEvent.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10_000,
      }),
      includeExpenses
        ? prisma.billingExpenseInvoice.findMany({
            where: {
              userId: user.id,
              deletedAt: null,
            },
            orderBy: {
              issueDate: "desc",
            },
          })
        : Promise.resolve([]),
      includeExpenses
        ? prisma.billingExpenseNote.findMany({
            where: {
              userId: user.id,
              deletedAt: null,
            },
            orderBy: {
              expenseDate: "desc",
            },
          })
        : Promise.resolve([]),
      includeExpenses
        ? prisma.billingExpenseTrip.findMany({
            where: {
              userId: user.id,
              deletedAt: null,
            },
            orderBy: {
              tripDate: "desc",
            },
          })
        : Promise.resolve([]),
    ]);

    const now = new Date();
    const exportDate = now.toISOString().slice(0, 10);
    const zip = new JSZip();

    zip.file(
      "README.txt",
      [
        "Jobio Compliance Export Package",
        `Date: ${now.toISOString()}`,
        `User: ${user.id}`,
        "",
        "Ce package contient les donnees brutes (JSON) et registres CSV de facturation.",
      ].join("\n"),
    );

    zip.file(
      "manifest.json",
      JSON.stringify(
        {
          generatedAt: now.toISOString(),
          userId: user.id,
          includeExpenses,
          counts: {
            clients: clients.length,
            quotes: quotes.length,
            invoices: invoices.length,
            payments: payments.length,
            creditNotes: creditNotes.length,
            declarations: declarations.length,
            auditEvents: audits.length,
            expenseInvoices: expenseInvoices.length,
            expenseNotes: expenseNotes.length,
            expenseTrips: expenseTrips.length,
          },
        },
        null,
        2,
      ),
    );

    zip.file(
      "json/profile.json",
      JSON.stringify(
        {
          profile,
        },
        null,
        2,
      ),
    );
    zip.file("json/clients.json", JSON.stringify(clients, null, 2));
    zip.file("json/quotes.json", JSON.stringify(quotes, null, 2));
    zip.file("json/invoices.json", JSON.stringify(invoices, null, 2));
    zip.file("json/payments.json", JSON.stringify(payments, null, 2));
    zip.file("json/credit-notes.json", JSON.stringify(creditNotes, null, 2));
    zip.file("json/declarations.json", JSON.stringify(declarations, null, 2));
    zip.file("json/audit-events.json", JSON.stringify(audits, null, 2));

    if (includeExpenses) {
      zip.file(
        "json/expenses-invoices.json",
        JSON.stringify(expenseInvoices, null, 2),
      );
      zip.file(
        "json/expenses-notes.json",
        JSON.stringify(expenseNotes, null, 2),
      );
      zip.file(
        "json/expenses-trips.json",
        JSON.stringify(expenseTrips, null, 2),
      );
    }

    const invoicesCsv = generateCsv(
      invoices.map((invoice) => ({
        number: invoice.number ?? "",
        issueDate: invoice.issueDate.toISOString().slice(0, 10),
        dueDate: invoice.dueDate
          ? invoice.dueDate.toISOString().slice(0, 10)
          : "",
        client: invoice.client.displayName,
        status: invoice.status,
        totalCents: invoice.totalCents,
        paidCents: invoice.paidCents,
        balanceCents: invoice.balanceCents,
      })),
      [
        { key: "number", header: "Numero" },
        { key: "issueDate", header: "Date emission" },
        { key: "dueDate", header: "Date echeance" },
        { key: "client", header: "Client" },
        { key: "status", header: "Statut" },
        { key: "totalCents", header: "Total centimes" },
        { key: "paidCents", header: "Encaisse centimes" },
        { key: "balanceCents", header: "Encours centimes" },
      ],
    );
    zip.file("csv/register-invoices.csv", invoicesCsv);

    const paymentsCsv = generateCsv(
      payments.map((payment) => ({
        date: payment.paidAt.toISOString().slice(0, 10),
        client: payment.client.displayName,
        method: payment.method,
        status: payment.status,
        amountCents: payment.amountCents,
        reference: payment.reference ?? "",
        invoices: payment.allocations
          .map((allocation) => allocation.invoice.number ?? "")
          .filter(Boolean)
          .join(" | "),
      })),
      [
        { key: "date", header: "Date paiement" },
        { key: "client", header: "Client" },
        { key: "method", header: "Methode" },
        { key: "status", header: "Statut" },
        { key: "amountCents", header: "Montant centimes" },
        { key: "reference", header: "Reference" },
        { key: "invoices", header: "Factures allouees" },
      ],
    );
    zip.file("csv/register-payments.csv", paymentsCsv);

    const auditsCsv = generateCsv(
      audits.map((event) => ({
        createdAt: event.createdAt.toISOString(),
        entityType: event.entityType,
        entityId: event.entityId,
        eventType: event.eventType,
        message: event.message ?? "",
        metadata: event.metadata ? JSON.stringify(event.metadata) : "",
      })),
      [
        { key: "createdAt", header: "Date" },
        { key: "entityType", header: "Entite" },
        { key: "entityId", header: "Entite ID" },
        { key: "eventType", header: "Event" },
        { key: "message", header: "Message" },
        { key: "metadata", header: "Metadata JSON" },
      ],
    );
    zip.file("csv/audit-events.csv", auditsCsv);

    if (includeExpenses) {
      const expenseInvoicesCsv = generateCsv(
        expenseInvoices.map((expense) => ({
          date: expense.issueDate.toISOString().slice(0, 10),
          vendor: expense.vendorName,
          documentNumber: expense.documentNumber ?? "",
          status: expense.status,
          totalInclTaxCents: expense.totalInclTaxCents,
          paymentReference: expense.paymentReference ?? "",
          matchedRegisterRef: expense.matchedRegisterRef ?? "",
        })),
        [
          { key: "date", header: "Date" },
          { key: "vendor", header: "Fournisseur" },
          { key: "documentNumber", header: "Numero document" },
          { key: "status", header: "Statut" },
          { key: "totalInclTaxCents", header: "TTC centimes" },
          { key: "paymentReference", header: "Ref paiement" },
          { key: "matchedRegisterRef", header: "Ref registre" },
        ],
      );
      zip.file("csv/register-expenses-invoices.csv", expenseInvoicesCsv);

      const expenseNotesCsv = generateCsv(
        expenseNotes.map((expense) => ({
          date: expense.expenseDate.toISOString().slice(0, 10),
          label: expense.label,
          status: expense.status,
          amountInclTaxCents: expense.amountInclTaxCents,
          paymentReference: expense.paymentReference ?? "",
          matchedRegisterRef: expense.matchedRegisterRef ?? "",
        })),
        [
          { key: "date", header: "Date" },
          { key: "label", header: "Libelle" },
          { key: "status", header: "Statut" },
          { key: "amountInclTaxCents", header: "TTC centimes" },
          { key: "paymentReference", header: "Ref paiement" },
          { key: "matchedRegisterRef", header: "Ref registre" },
        ],
      );
      zip.file("csv/register-expenses-notes.csv", expenseNotesCsv);

      const expenseTripsCsv = generateCsv(
        expenseTrips.map((expense) => ({
          date: expense.tripDate.toISOString().slice(0, 10),
          fromAddress: expense.fromAddress,
          toAddress: expense.toAddress,
          totalCents: expense.totalCents,
          status: expense.status,
          paymentReference: expense.paymentReference ?? "",
          matchedRegisterRef: expense.matchedRegisterRef ?? "",
        })),
        [
          { key: "date", header: "Date" },
          { key: "fromAddress", header: "Depart" },
          { key: "toAddress", header: "Arrivee" },
          { key: "totalCents", header: "Total centimes" },
          { key: "status", header: "Statut" },
          { key: "paymentReference", header: "Ref paiement" },
          { key: "matchedRegisterRef", header: "Ref registre" },
        ],
      );
      zip.file("csv/register-expenses-trips.csv", expenseTripsCsv);
    }

    const base64 = await zip.generateAsync({
      type: "base64",
      compression: "DEFLATE",
    });

    await prisma.$transaction(async (tx) => {
      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.PROFILE,
        entityId: user.id,
        eventType: BillingAuditEventType.UPDATED,
        message: "Export package conformité généré",
        metadata: {
          includeExpenses,
          generatedAt: now.toISOString(),
        },
      });
    });

    return {
      filename: `jobio-compliance-package-${exportDate}.zip`,
      mimeType: "application/zip",
      base64,
    };
  });

const exportFecSchema = z.object({
  year: z.number().int().min(2020).max(2099),
});

export const exportFecAction = authAction
  .inputSchema(exportFecSchema)
  .action(async ({ parsedInput: { year }, ctx: { user } }) => {
    const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00Z`);

    const [invoices, payments, creditNotes] = await Promise.all([
      prisma.billingInvoice.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          issueDate: {
            gte: startOfYear,
            lt: endOfYear,
          },
          status: {
            in: ["ISSUED", "PAID", "PARTIALLY_PAID"],
          },
        },
        include: {
          client: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: {
          issueDate: "asc",
        },
      }),
      prisma.billingPayment.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          paidAt: {
            gte: startOfYear,
            lt: endOfYear,
          },
          status: "CONFIRMED",
        },
        include: {
          client: {
            select: {
              displayName: true,
            },
          },
          allocations: {
            include: {
              invoice: {
                select: {
                  number: true,
                },
              },
            },
          },
        },
        orderBy: {
          paidAt: "asc",
        },
      }),
      prisma.billingCreditNote.findMany({
        where: {
          userId: user.id,
          issueDate: {
            gte: startOfYear,
            lt: endOfYear,
          },
          status: {
            in: ["ISSUED", "APPLIED"],
          },
        },
        include: {
          invoice: {
            select: {
              number: true,
              client: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          issueDate: "asc",
        },
      }),
    ]);

    const fecEntries = generateFecEntries({
      invoices,
      payments,
      creditNotes,
    });

    const fecContent = generateFecFile(fecEntries);

    await prisma.$transaction(async (tx) => {
      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.PROFILE,
        entityId: user.id,
        eventType: BillingAuditEventType.UPDATED,
        message: `Export FEC ${year} généré`,
        metadata: {
          year,
          entriesCount: fecEntries.length,
          generatedAt: new Date().toISOString(),
        },
      });
    });

    return {
      filename: `FEC_${year}.txt`,
      content: fecContent,
    };
  });
