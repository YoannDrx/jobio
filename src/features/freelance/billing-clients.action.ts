"use server";

import {
  BillingAuditEventType,
  BillingClientType,
  BillingEntityType,
  BillingInvoiceStatus,
  type Prisma,
} from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  billingClientFilterSchema,
  createBillingClientSchema,
  updateBillingClientSchema,
  upsertBillingProfileSchema,
} from "./billing.schema";
import { buildBeforeAfterMetadata, createBillingAuditEvent } from "./billing-audit";
import { DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID } from "./billing-document-templates";

const normalizeNullable = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return value.trim();
};

type BillingClientContactInput = {
  firstName?: string;
  lastName?: string;
  role?: string;
  email?: string;
  phone?: string;
  includeInEmail: boolean;
  isPrimary: boolean;
  notes?: string;
};

const normalizeClientContacts = (contacts: BillingClientContactInput[]) => {
  const normalized = contacts
    .map((contact) => {
      const firstName = normalizeNullable(contact.firstName);
      const lastName = normalizeNullable(contact.lastName);
      const role = normalizeNullable(contact.role);
      const email = normalizeNullable(contact.email);
      const phone = normalizeNullable(contact.phone);
      const notes = normalizeNullable(contact.notes);

      const hasData = [firstName, lastName, role, email, phone, notes].some(
        (value) => value !== null,
      );

      if (!hasData) {
        return null;
      }

      return {
        firstName,
        lastName,
        role,
        email,
        phone,
        includeInEmail: Boolean(contact.includeInEmail) && Boolean(email),
        isPrimary: Boolean(contact.isPrimary),
        notes,
      };
    })
    .filter((contact): contact is NonNullable<typeof contact> => contact !== null);

  if (normalized.length === 0) {
    return [];
  }

  const hasPrimary = normalized.some((contact) => contact.isPrimary);
  return normalized.map((contact, index) => ({
    ...contact,
    position: index,
    isPrimary: hasPrimary ? contact.isPrimary : index === 0,
  }));
};

const pickPrimaryContactField = (
  explicitValue: string | undefined,
  fallbackValue: string | null | undefined,
) => {
  if (explicitValue !== undefined) {
    return normalizeNullable(explicitValue);
  }

  return normalizeNullable(fallbackValue);
};

const ensureDeletedClientPlaceholder = async (
  tx: Prisma.TransactionClient,
  input: { userId: string; avoidClientId: string },
) => {
  const existing = await tx.billingClient.findFirst({
    where: {
      userId: input.userId,
      deletedAt: null,
      id: {
        not: input.avoidClientId,
      },
      tags: {
        has: "system-deleted-client-placeholder",
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return existing;
  }

  const created = await tx.billingClient.create({
    data: {
      userId: input.userId,
      type: BillingClientType.COMPANY,
      displayName: "Client supprimé",
      legalName: "Client supprimé",
      addressLine1: "Archive Jobio",
      postalCode: "00000",
      city: "Archive",
      countryCode: "FR",
      notes:
        "Client système de réaffectation automatique lors d'une suppression owner override.",
      tags: ["system-deleted-client-placeholder"],
    },
    select: {
      id: true,
    },
  });

  return created;
};

export const upsertBillingProfileAction = authAction
  .inputSchema(upsertBillingProfileSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const previousProfile = await tx.billingProfile.findUnique({
        where: {
          userId: user.id,
        },
      });

      const profile = await tx.billingProfile.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          legalName: parsedInput.legalName,
          tradeName: normalizeNullable(parsedInput.tradeName),
          legalForm: normalizeNullable(parsedInput.legalForm),
          siret: normalizeNullable(parsedInput.siret),
          siren: normalizeNullable(parsedInput.siren),
          vatNumber: normalizeNullable(parsedInput.vatNumber),
          rcsNumber: normalizeNullable(parsedInput.rcsNumber),
          rmNumber: normalizeNullable(parsedInput.rmNumber),
          activityLabel: normalizeNullable(parsedInput.activityLabel),
          addressLine1: parsedInput.addressLine1,
          addressLine2: normalizeNullable(parsedInput.addressLine2),
          postalCode: parsedInput.postalCode,
          city: parsedInput.city,
          countryCode: parsedInput.countryCode,
          email: normalizeNullable(parsedInput.email),
          phone: normalizeNullable(parsedInput.phone),
          website: normalizeNullable(parsedInput.website),
          iban: normalizeNullable(parsedInput.iban),
          bic: normalizeNullable(parsedInput.bic),
          paymentTermsInDays: parsedInput.paymentTermsInDays,
          latePenaltyRate: parsedInput.latePenaltyRate ?? null,
          latePenaltyFlatFeeEur: parsedInput.latePenaltyFlatFeeEur,
          notes: normalizeNullable(parsedInput.notes),
          freelanceStatus: normalizeNullable(parsedInput.freelanceStatus),
          activityCategory: normalizeNullable(parsedInput.activityCategory),
          urssafDeclarationType: parsedInput.urssafDeclarationType ?? null,
          urssafContributionRate: parsedInput.urssafContributionRate ?? null,
          vatExemptionMention: normalizeNullable(parsedInput.vatExemptionMention),
          documentTemplate:
            parsedInput.documentTemplate ?? DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID,
          documentPrimaryColor: normalizeNullable(parsedInput.documentPrimaryColor),
          documentAccentColor: normalizeNullable(parsedInput.documentAccentColor),
          documentLogoUrl: normalizeNullable(parsedInput.documentLogoUrl),
          documentFooterText: normalizeNullable(parsedInput.documentFooterText),
          documentShowNotes: parsedInput.documentShowNotes,
          documentShowTerms: parsedInput.documentShowTerms,
          documentShowBankDetails: parsedInput.documentShowBankDetails,
          documentShowClientContact: parsedInput.documentShowClientContact,
          documentShowIssuerContact: parsedInput.documentShowIssuerContact,
          documentShowLineVat: parsedInput.documentShowLineVat,
        },
        update: {
          legalName: parsedInput.legalName,
          tradeName: normalizeNullable(parsedInput.tradeName),
          legalForm: normalizeNullable(parsedInput.legalForm),
          siret: normalizeNullable(parsedInput.siret),
          siren: normalizeNullable(parsedInput.siren),
          vatNumber: normalizeNullable(parsedInput.vatNumber),
          rcsNumber: normalizeNullable(parsedInput.rcsNumber),
          rmNumber: normalizeNullable(parsedInput.rmNumber),
          activityLabel: normalizeNullable(parsedInput.activityLabel),
          addressLine1: parsedInput.addressLine1,
          addressLine2: normalizeNullable(parsedInput.addressLine2),
          postalCode: parsedInput.postalCode,
          city: parsedInput.city,
          countryCode: parsedInput.countryCode,
          email: normalizeNullable(parsedInput.email),
          phone: normalizeNullable(parsedInput.phone),
          website: normalizeNullable(parsedInput.website),
          iban: normalizeNullable(parsedInput.iban),
          bic: normalizeNullable(parsedInput.bic),
          paymentTermsInDays: parsedInput.paymentTermsInDays,
          latePenaltyRate: parsedInput.latePenaltyRate ?? null,
          latePenaltyFlatFeeEur: parsedInput.latePenaltyFlatFeeEur,
          notes: normalizeNullable(parsedInput.notes),
          freelanceStatus: normalizeNullable(parsedInput.freelanceStatus),
          activityCategory: normalizeNullable(parsedInput.activityCategory),
          urssafDeclarationType: parsedInput.urssafDeclarationType ?? null,
          urssafContributionRate: parsedInput.urssafContributionRate ?? null,
          vatExemptionMention: normalizeNullable(parsedInput.vatExemptionMention),
          documentTemplate:
            parsedInput.documentTemplate ?? DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID,
          documentPrimaryColor: normalizeNullable(parsedInput.documentPrimaryColor),
          documentAccentColor: normalizeNullable(parsedInput.documentAccentColor),
          documentLogoUrl: normalizeNullable(parsedInput.documentLogoUrl),
          documentFooterText: normalizeNullable(parsedInput.documentFooterText),
          documentShowNotes: parsedInput.documentShowNotes,
          documentShowTerms: parsedInput.documentShowTerms,
          documentShowBankDetails: parsedInput.documentShowBankDetails,
          documentShowClientContact: parsedInput.documentShowClientContact,
          documentShowIssuerContact: parsedInput.documentShowIssuerContact,
          documentShowLineVat: parsedInput.documentShowLineVat,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.PROFILE,
        entityId: profile.id,
        eventType: previousProfile
          ? BillingAuditEventType.UPDATED
          : BillingAuditEventType.CREATED,
        message: previousProfile
          ? "Profil de facturation mis à jour"
          : "Profil de facturation créé",
        metadata: buildBeforeAfterMetadata({
          before: previousProfile,
          after: profile,
        }),
      });

      return profile;
    });
  });

export const getBillingProfileAction = authAction
  .inputSchema(z.object({}).optional())
  .action(async ({ ctx: { user } }) => {
    return prisma.billingProfile.findUnique({
      where: {
        userId: user.id,
      },
    });
  });

export const createBillingClientAction = authAction
  .inputSchema(createBillingClientSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "billingClients");

    return prisma.$transaction(async (tx) => {
      const normalizedContacts = normalizeClientContacts(parsedInput.contacts);
      const primaryContact = normalizedContacts.find((contact) => contact.isPrimary);

      const client = await tx.billingClient.create({
        data: {
          userId: user.id,
          type: parsedInput.type,
          displayName: parsedInput.displayName,
          legalName: normalizeNullable(parsedInput.legalName),
          contactFirstName: pickPrimaryContactField(
            parsedInput.contactFirstName,
            primaryContact?.firstName,
          ),
          contactLastName: pickPrimaryContactField(
            parsedInput.contactLastName,
            primaryContact?.lastName,
          ),
          email: pickPrimaryContactField(parsedInput.email, primaryContact?.email),
          phone: pickPrimaryContactField(parsedInput.phone, primaryContact?.phone),
          vatNumber: normalizeNullable(parsedInput.vatNumber),
          siret: normalizeNullable(parsedInput.siret),
          addressLine1: parsedInput.addressLine1,
          addressLine2: normalizeNullable(parsedInput.addressLine2),
          postalCode: parsedInput.postalCode,
          city: parsedInput.city,
          countryCode: parsedInput.countryCode,
          paymentTermsInDays: parsedInput.paymentTermsInDays ?? null,
          defaultLateRate: parsedInput.defaultLateRate ?? null,
          defaultFlatFeeEur: parsedInput.defaultFlatFeeEur ?? null,
          notes: normalizeNullable(parsedInput.notes),
          tags: parsedInput.tags,
          contacts:
            normalizedContacts.length > 0
              ? {
                  create: normalizedContacts.map((contact) => ({
                    ...contact,
                    userId: user.id,
                  })),
                }
              : undefined,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.CLIENT,
        entityId: client.id,
        eventType: BillingAuditEventType.CREATED,
        message: `Client ${client.displayName} créé`,
      });

      return client;
    });
  });

export const updateBillingClientAction = authAction
  .inputSchema(updateBillingClientSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const normalizedContacts =
      parsedInput.contacts !== undefined
        ? normalizeClientContacts(parsedInput.contacts)
        : null;
    const primaryContact = normalizedContacts?.find((contact) => contact.isPrimary);

    const existing = await prisma.billingClient.findFirst({
      where: {
        id: parsedInput.id,
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
    });

    if (!existing) {
      throw new ApplicationError("Client introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.billingClient.update({
        where: {
          id: parsedInput.id,
        },
        include: {
          contacts: {
            orderBy: {
              position: "asc",
            },
          },
        },
        data: {
          type: parsedInput.type,
          displayName: parsedInput.displayName,
          legalName: normalizeNullable(parsedInput.legalName),
          contactFirstName:
            parsedInput.contactFirstName !== undefined
              ? normalizeNullable(parsedInput.contactFirstName)
              : normalizedContacts !== null
                ? normalizeNullable(primaryContact?.firstName)
                : undefined,
          contactLastName:
            parsedInput.contactLastName !== undefined
              ? normalizeNullable(parsedInput.contactLastName)
              : normalizedContacts !== null
                ? normalizeNullable(primaryContact?.lastName)
                : undefined,
          email:
            parsedInput.email !== undefined
              ? normalizeNullable(parsedInput.email)
              : normalizedContacts !== null
                ? normalizeNullable(primaryContact?.email)
                : undefined,
          phone:
            parsedInput.phone !== undefined
              ? normalizeNullable(parsedInput.phone)
              : normalizedContacts !== null
                ? normalizeNullable(primaryContact?.phone)
                : undefined,
          vatNumber: normalizeNullable(parsedInput.vatNumber),
          siret: normalizeNullable(parsedInput.siret),
          addressLine1: parsedInput.addressLine1,
          addressLine2: normalizeNullable(parsedInput.addressLine2),
          postalCode: parsedInput.postalCode,
          city: parsedInput.city,
          countryCode: parsedInput.countryCode,
          paymentTermsInDays:
            parsedInput.paymentTermsInDays ?? undefined,
          defaultLateRate:
            parsedInput.defaultLateRate ?? undefined,
          defaultFlatFeeEur:
            parsedInput.defaultFlatFeeEur ?? undefined,
          notes:
            parsedInput.notes === undefined
              ? undefined
              : normalizeNullable(parsedInput.notes),
          tags: parsedInput.tags,
          contacts:
            normalizedContacts === null
              ? undefined
              : {
                  deleteMany: {},
                  create: normalizedContacts.map((contact) => ({
                    ...contact,
                    userId: user.id,
                  })),
                },
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.CLIENT,
        entityId: updated.id,
        eventType: BillingAuditEventType.UPDATED,
        message: `Client ${updated.displayName} mis à jour`,
        metadata: buildBeforeAfterMetadata({
          before: existing,
          after: updated,
        }),
      });

      return updated;
    });
  });

export const deleteBillingClientAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingClient.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new ApplicationError("Client introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.billingClient.update({
        where: {
          id: parsedInput.id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.CLIENT,
        entityId: deleted.id,
        eventType: BillingAuditEventType.DELETED,
        message: `Client ${deleted.displayName} archivé`,
      });

      return deleted;
    });
  });

export const hardDeleteBillingClientAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingClient.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      select: {
        id: true,
        displayName: true,
        _count: {
          select: {
            quotes: true,
            invoices: true,
            payments: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApplicationError("Client introuvable");
    }

    return prisma.$transaction(async (tx) => {
      let reassignedClientId: string | null = null;

      if (
        existing._count.quotes > 0 ||
        existing._count.invoices > 0 ||
        existing._count.payments > 0
      ) {
        const placeholder = await ensureDeletedClientPlaceholder(tx, {
          userId: user.id,
          avoidClientId: parsedInput.id,
        });
        reassignedClientId = placeholder.id;

        await tx.billingQuote.updateMany({
          where: {
            userId: user.id,
            clientId: parsedInput.id,
          },
          data: {
            clientId: placeholder.id,
          },
        });

        await tx.billingInvoice.updateMany({
          where: {
            userId: user.id,
            clientId: parsedInput.id,
          },
          data: {
            clientId: placeholder.id,
          },
        });

        await tx.billingPayment.updateMany({
          where: {
            userId: user.id,
            clientId: parsedInput.id,
          },
          data: {
            clientId: placeholder.id,
          },
        });

        await tx.billingDeclarationPeriod.updateMany({
          where: {
            userId: user.id,
            clientId: parsedInput.id,
          },
          data: {
            clientId: placeholder.id,
          },
        });
      } else {
        await tx.billingDeclarationPeriod.updateMany({
          where: {
            userId: user.id,
            clientId: parsedInput.id,
          },
          data: {
            clientId: null,
          },
        });
      }

      await tx.billingClient.delete({
        where: {
          id: parsedInput.id,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.CLIENT,
        entityId: parsedInput.id,
        eventType: BillingAuditEventType.DELETED,
        message: `Client ${existing.displayName} supprimé définitivement`,
        metadata: {
          hardDelete: true,
          ownerOverride: true,
          reassignedClientId,
          reassignedCounts: {
            quotes: existing._count.quotes,
            invoices: existing._count.invoices,
            payments: existing._count.payments,
          },
        },
      });

      return {
        id: parsedInput.id,
      };
    });
  });

export const getBillingClientAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const client = await prisma.billingClient.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      include: {
        contacts: {
          orderBy: [
            {
              isPrimary: "desc",
            },
            {
              position: "asc",
            },
          ],
        },
        _count: {
          select: {
            quotes: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      throw new ApplicationError("Client introuvable");
    }

    return client;
  });

export const getBillingClientsAction = authAction
  .inputSchema(billingClientFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (filters.search && filters.search.trim().length > 0) {
      where.OR = [
        {
          displayName: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          legalName: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.billingClient.findMany({
        where,
        orderBy: {
          [filters.sortBy]: filters.sortOrder,
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: {
          contacts: {
            orderBy: [
              {
                isPrimary: "desc",
              },
              {
                position: "asc",
              },
            ],
          },
          _count: {
            select: {
              quotes: true,
              invoices: true,
            },
          },
        },
      }),
      prisma.billingClient.count({ where }),
    ]);

    const clientIds = clients.map((client) => client.id);

    const [invoiceTotalsByClient, overdueByClient] =
      clientIds.length === 0
        ? [[], []]
        : await Promise.all([
            prisma.billingInvoice.groupBy({
              by: ["clientId"],
              where: {
                userId: user.id,
                clientId: {
                  in: clientIds,
                },
                deletedAt: null,
                status: {
                  not: BillingInvoiceStatus.CANCELLED,
                },
              },
              _sum: {
                totalCents: true,
                paidCents: true,
                balanceCents: true,
              },
            }),
            prisma.billingInvoice.groupBy({
              by: ["clientId"],
              where: {
                userId: user.id,
                clientId: {
                  in: clientIds,
                },
                deletedAt: null,
                status: {
                  in: [
                    BillingInvoiceStatus.ISSUED,
                    BillingInvoiceStatus.PARTIALLY_PAID,
                    BillingInvoiceStatus.OVERDUE,
                  ],
                },
                dueDate: {
                  lt: new Date(),
                },
                balanceCents: {
                  gt: 0,
                },
              },
              _count: {
                _all: true,
              },
            }),
          ]);

    const totalsMap = new Map(
      invoiceTotalsByClient.map((entry) => [
        entry.clientId,
        {
          totalInvoicedCents: entry._sum.totalCents ?? 0,
          totalPaidCents: entry._sum.paidCents ?? 0,
          totalOutstandingCents: entry._sum.balanceCents ?? 0,
        },
      ]),
    );
    const overdueSet = new Set(
      overdueByClient
        .filter((entry) => entry._count._all > 0)
        .map((entry) => entry.clientId),
    );

    const clientsWithStats = clients.map((client) => {
      const stats = totalsMap.get(client.id);
      return {
        ...client,
        totalInvoicedCents: stats?.totalInvoicedCents ?? 0,
        totalPaidCents: stats?.totalPaidCents ?? 0,
        totalOutstandingCents: stats?.totalOutstandingCents ?? 0,
        hasOverdueInvoices: overdueSet.has(client.id),
      };
    });

    return {
      clients: clientsWithStats,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });
