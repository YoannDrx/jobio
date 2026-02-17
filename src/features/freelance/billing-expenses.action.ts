"use server";

import {
  BillingAuditEventType,
  BillingEntityType,
  BillingExpenseStatus,
} from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { generateCsv } from "@/lib/csv-export";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  buildBeforeAfterMetadata,
  createBillingAuditEvent,
} from "./billing-audit";

const pagerSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(50),
});

const normalizeNullable = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
};

const expenseInvoiceFilterSchema = pagerSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(BillingExpenseStatus).optional(),
});

const upsertExpenseInvoiceSchema = z.object({
  vendorName: z.string().min(1),
  vendorVatNumber: z.string().optional(),
  documentNumber: z.string().optional(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  currency: z.string().length(3).default("EUR"),
  category: z.string().optional(),
  status: z
    .nativeEnum(BillingExpenseStatus)
    .default(BillingExpenseStatus.DRAFT),
  totalExclTaxCents: z.number().int().min(0),
  taxCents: z.number().int().min(0),
  totalInclTaxCents: z.number().int().min(0),
  deductibleTaxCents: z.number().int().min(0).default(0),
  isPaid: z.boolean().default(false),
  paidAt: z.coerce.date().optional().nullable(),
  paymentReference: z.string().optional(),
  matchedRegisterRef: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const expenseNoteFilterSchema = pagerSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(BillingExpenseStatus).optional(),
});

const upsertExpenseNoteSchema = z.object({
  label: z.string().min(1),
  category: z.string().optional(),
  expenseDate: z.coerce.date(),
  currency: z.string().length(3).default("EUR"),
  status: z
    .nativeEnum(BillingExpenseStatus)
    .default(BillingExpenseStatus.DRAFT),
  amountExclTaxCents: z.number().int().min(0),
  taxCents: z.number().int().min(0),
  amountInclTaxCents: z.number().int().min(0),
  deductibleTaxCents: z.number().int().min(0).default(0),
  isReimbursable: z.boolean().default(true),
  isPaid: z.boolean().default(false),
  paidAt: z.coerce.date().optional().nullable(),
  paymentReference: z.string().optional(),
  matchedRegisterRef: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const expenseTripFilterSchema = pagerSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(BillingExpenseStatus).optional(),
});

const upsertExpenseTripSchema = z.object({
  tripDate: z.coerce.date(),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  distanceKm: z.number().min(0),
  roundTrip: z.boolean().default(false),
  vehiclePower: z.string().optional(),
  allowanceRateCentsPerKm: z.number().int().min(0).default(0),
  tollCents: z.number().int().min(0).default(0),
  parkingCents: z.number().int().min(0).default(0),
  totalCents: z.number().int().min(0),
  status: z
    .nativeEnum(BillingExpenseStatus)
    .default(BillingExpenseStatus.DRAFT),
  isPaid: z.boolean().default(false),
  paidAt: z.coerce.date().optional().nullable(),
  paymentReference: z.string().optional(),
  matchedRegisterRef: z.string().optional(),
  notes: z.string().optional(),
});

export const getExpenseInvoicesAction = authAction
  .inputSchema(expenseInvoiceFilterSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (parsedInput.status) {
      where.status = parsedInput.status;
    }

    if (parsedInput.search && parsedInput.search.trim().length > 0) {
      where.OR = [
        {
          vendorName: {
            contains: parsedInput.search,
            mode: "insensitive",
          },
        },
        {
          documentNumber: {
            contains: parsedInput.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.billingExpenseInvoice.findMany({
        where,
        orderBy: {
          issueDate: "desc",
        },
        skip: (parsedInput.page - 1) * parsedInput.pageSize,
        take: parsedInput.pageSize,
      }),
      prisma.billingExpenseInvoice.count({ where }),
    ]);

    return {
      items,
      total,
    };
  });

export const createExpenseInvoiceAction = authAction
  .inputSchema(upsertExpenseInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const created = await tx.billingExpenseInvoice.create({
        data: {
          userId: user.id,
          vendorName: parsedInput.vendorName,
          vendorVatNumber: normalizeNullable(parsedInput.vendorVatNumber),
          documentNumber: normalizeNullable(parsedInput.documentNumber),
          issueDate: parsedInput.issueDate,
          dueDate: parsedInput.dueDate ?? null,
          currency: parsedInput.currency,
          category: normalizeNullable(parsedInput.category),
          status: parsedInput.status,
          totalExclTaxCents: parsedInput.totalExclTaxCents,
          taxCents: parsedInput.taxCents,
          totalInclTaxCents: parsedInput.totalInclTaxCents,
          deductibleTaxCents: parsedInput.deductibleTaxCents,
          isPaid: parsedInput.isPaid,
          paidAt: parsedInput.paidAt ?? null,
          paymentReference: normalizeNullable(parsedInput.paymentReference),
          matchedRegisterRef: normalizeNullable(parsedInput.matchedRegisterRef),
          attachmentUrl: normalizeNullable(parsedInput.attachmentUrl),
          notes: normalizeNullable(parsedInput.notes),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_INVOICE,
        entityId: created.id,
        eventType: BillingAuditEventType.CREATED,
        message: `Dépense facture créée (${created.vendorName})`,
      });

      return created;
    });
  });

export const updateExpenseInvoiceAction = authAction
  .inputSchema(upsertExpenseInvoiceSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingExpenseInvoice.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        vendorName: true,
        vendorVatNumber: true,
        documentNumber: true,
        issueDate: true,
        dueDate: true,
        currency: true,
        category: true,
        status: true,
        totalExclTaxCents: true,
        taxCents: true,
        totalInclTaxCents: true,
        deductibleTaxCents: true,
        isPaid: true,
        paidAt: true,
        paymentReference: true,
        matchedRegisterRef: true,
        attachmentUrl: true,
        notes: true,
      },
    });

    if (!existing) {
      throw new ApplicationError("Dépense facture introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.billingExpenseInvoice.update({
        where: { id: parsedInput.id },
        data: {
          vendorName: parsedInput.vendorName,
          vendorVatNumber: normalizeNullable(parsedInput.vendorVatNumber),
          documentNumber: normalizeNullable(parsedInput.documentNumber),
          issueDate: parsedInput.issueDate,
          dueDate: parsedInput.dueDate ?? null,
          currency: parsedInput.currency,
          category: normalizeNullable(parsedInput.category),
          status: parsedInput.status,
          totalExclTaxCents: parsedInput.totalExclTaxCents,
          taxCents: parsedInput.taxCents,
          totalInclTaxCents: parsedInput.totalInclTaxCents,
          deductibleTaxCents: parsedInput.deductibleTaxCents,
          isPaid: parsedInput.isPaid,
          paidAt: parsedInput.paidAt ?? null,
          paymentReference: normalizeNullable(parsedInput.paymentReference),
          matchedRegisterRef: normalizeNullable(parsedInput.matchedRegisterRef),
          attachmentUrl: normalizeNullable(parsedInput.attachmentUrl),
          notes: normalizeNullable(parsedInput.notes),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_INVOICE,
        entityId: updated.id,
        eventType: BillingAuditEventType.UPDATED,
        message: `Dépense facture mise à jour (${updated.vendorName})`,
        metadata: buildBeforeAfterMetadata({
          before: existing,
          after: updated,
        }),
      });

      return updated;
    });
  });

export const deleteExpenseInvoiceAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingExpenseInvoice.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      select: { id: true, vendorName: true, status: true },
    });

    if (!existing) {
      throw new ApplicationError("Dépense facture introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.billingExpenseInvoice.update({
        where: { id: parsedInput.id },
        data: {
          deletedAt: new Date(),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_INVOICE,
        entityId: deleted.id,
        eventType: BillingAuditEventType.DELETED,
        message: `Dépense facture supprimée (${existing.vendorName})`,
        metadata: {
          ownerOverride: true,
          deletedFromStatus: existing.status,
        },
      });

      return deleted;
    });
  });

export const getExpenseNotesAction = authAction
  .inputSchema(expenseNoteFilterSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (parsedInput.status) {
      where.status = parsedInput.status;
    }

    if (parsedInput.search && parsedInput.search.trim().length > 0) {
      where.OR = [
        {
          label: {
            contains: parsedInput.search,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: parsedInput.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.billingExpenseNote.findMany({
        where,
        orderBy: {
          expenseDate: "desc",
        },
        skip: (parsedInput.page - 1) * parsedInput.pageSize,
        take: parsedInput.pageSize,
      }),
      prisma.billingExpenseNote.count({ where }),
    ]);

    return {
      items,
      total,
    };
  });

export const createExpenseNoteAction = authAction
  .inputSchema(upsertExpenseNoteSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const created = await tx.billingExpenseNote.create({
        data: {
          userId: user.id,
          label: parsedInput.label,
          category: normalizeNullable(parsedInput.category),
          expenseDate: parsedInput.expenseDate,
          currency: parsedInput.currency,
          status: parsedInput.status,
          amountExclTaxCents: parsedInput.amountExclTaxCents,
          taxCents: parsedInput.taxCents,
          amountInclTaxCents: parsedInput.amountInclTaxCents,
          deductibleTaxCents: parsedInput.deductibleTaxCents,
          isReimbursable: parsedInput.isReimbursable,
          isPaid: parsedInput.isPaid,
          paidAt: parsedInput.paidAt ?? null,
          paymentReference: normalizeNullable(parsedInput.paymentReference),
          matchedRegisterRef: normalizeNullable(parsedInput.matchedRegisterRef),
          attachmentUrl: normalizeNullable(parsedInput.attachmentUrl),
          notes: normalizeNullable(parsedInput.notes),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_NOTE,
        entityId: created.id,
        eventType: BillingAuditEventType.CREATED,
        message: `Note de frais créée (${created.label})`,
      });

      return created;
    });
  });

export const updateExpenseNoteAction = authAction
  .inputSchema(upsertExpenseNoteSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingExpenseNote.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        label: true,
        category: true,
        expenseDate: true,
        currency: true,
        status: true,
        amountExclTaxCents: true,
        taxCents: true,
        amountInclTaxCents: true,
        deductibleTaxCents: true,
        isReimbursable: true,
        isPaid: true,
        paidAt: true,
        paymentReference: true,
        matchedRegisterRef: true,
        attachmentUrl: true,
        notes: true,
      },
    });

    if (!existing) {
      throw new ApplicationError("Note de frais introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.billingExpenseNote.update({
        where: { id: parsedInput.id },
        data: {
          label: parsedInput.label,
          category: normalizeNullable(parsedInput.category),
          expenseDate: parsedInput.expenseDate,
          currency: parsedInput.currency,
          status: parsedInput.status,
          amountExclTaxCents: parsedInput.amountExclTaxCents,
          taxCents: parsedInput.taxCents,
          amountInclTaxCents: parsedInput.amountInclTaxCents,
          deductibleTaxCents: parsedInput.deductibleTaxCents,
          isReimbursable: parsedInput.isReimbursable,
          isPaid: parsedInput.isPaid,
          paidAt: parsedInput.paidAt ?? null,
          paymentReference: normalizeNullable(parsedInput.paymentReference),
          matchedRegisterRef: normalizeNullable(parsedInput.matchedRegisterRef),
          attachmentUrl: normalizeNullable(parsedInput.attachmentUrl),
          notes: normalizeNullable(parsedInput.notes),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_NOTE,
        entityId: updated.id,
        eventType: BillingAuditEventType.UPDATED,
        message: `Note de frais mise à jour (${updated.label})`,
        metadata: buildBeforeAfterMetadata({
          before: existing,
          after: updated,
        }),
      });

      return updated;
    });
  });

export const deleteExpenseNoteAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingExpenseNote.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      select: { id: true, label: true, status: true },
    });

    if (!existing) {
      throw new ApplicationError("Note de frais introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.billingExpenseNote.update({
        where: { id: parsedInput.id },
        data: {
          deletedAt: new Date(),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_NOTE,
        entityId: deleted.id,
        eventType: BillingAuditEventType.DELETED,
        message: `Note de frais supprimée (${existing.label})`,
        metadata: {
          ownerOverride: true,
          deletedFromStatus: existing.status,
        },
      });

      return deleted;
    });
  });

export const getExpenseTripsAction = authAction
  .inputSchema(expenseTripFilterSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (parsedInput.status) {
      where.status = parsedInput.status;
    }

    if (parsedInput.search && parsedInput.search.trim().length > 0) {
      where.OR = [
        {
          fromAddress: {
            contains: parsedInput.search,
            mode: "insensitive",
          },
        },
        {
          toAddress: {
            contains: parsedInput.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.billingExpenseTrip.findMany({
        where,
        orderBy: {
          tripDate: "desc",
        },
        skip: (parsedInput.page - 1) * parsedInput.pageSize,
        take: parsedInput.pageSize,
      }),
      prisma.billingExpenseTrip.count({ where }),
    ]);

    return {
      items,
      total,
    };
  });

export const createExpenseTripAction = authAction
  .inputSchema(upsertExpenseTripSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const created = await tx.billingExpenseTrip.create({
        data: {
          userId: user.id,
          tripDate: parsedInput.tripDate,
          fromAddress: parsedInput.fromAddress,
          toAddress: parsedInput.toAddress,
          distanceKm: parsedInput.distanceKm,
          roundTrip: parsedInput.roundTrip,
          vehiclePower: normalizeNullable(parsedInput.vehiclePower),
          allowanceRateCentsPerKm: parsedInput.allowanceRateCentsPerKm,
          tollCents: parsedInput.tollCents,
          parkingCents: parsedInput.parkingCents,
          totalCents: parsedInput.totalCents,
          status: parsedInput.status,
          isPaid: parsedInput.isPaid,
          paidAt: parsedInput.paidAt ?? null,
          paymentReference: normalizeNullable(parsedInput.paymentReference),
          matchedRegisterRef: normalizeNullable(parsedInput.matchedRegisterRef),
          notes: normalizeNullable(parsedInput.notes),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_TRIP,
        entityId: created.id,
        eventType: BillingAuditEventType.CREATED,
        message: "Trajet professionnel créé",
      });

      return created;
    });
  });

export const updateExpenseTripAction = authAction
  .inputSchema(upsertExpenseTripSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingExpenseTrip.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        tripDate: true,
        fromAddress: true,
        toAddress: true,
        distanceKm: true,
        roundTrip: true,
        vehiclePower: true,
        allowanceRateCentsPerKm: true,
        tollCents: true,
        parkingCents: true,
        totalCents: true,
        status: true,
        isPaid: true,
        paidAt: true,
        paymentReference: true,
        matchedRegisterRef: true,
        notes: true,
      },
    });

    if (!existing) {
      throw new ApplicationError("Trajet introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.billingExpenseTrip.update({
        where: { id: parsedInput.id },
        data: {
          tripDate: parsedInput.tripDate,
          fromAddress: parsedInput.fromAddress,
          toAddress: parsedInput.toAddress,
          distanceKm: parsedInput.distanceKm,
          roundTrip: parsedInput.roundTrip,
          vehiclePower: normalizeNullable(parsedInput.vehiclePower),
          allowanceRateCentsPerKm: parsedInput.allowanceRateCentsPerKm,
          tollCents: parsedInput.tollCents,
          parkingCents: parsedInput.parkingCents,
          totalCents: parsedInput.totalCents,
          status: parsedInput.status,
          isPaid: parsedInput.isPaid,
          paidAt: parsedInput.paidAt ?? null,
          paymentReference: normalizeNullable(parsedInput.paymentReference),
          matchedRegisterRef: normalizeNullable(parsedInput.matchedRegisterRef),
          notes: normalizeNullable(parsedInput.notes),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_TRIP,
        entityId: updated.id,
        eventType: BillingAuditEventType.UPDATED,
        message: "Trajet professionnel mis à jour",
        metadata: buildBeforeAfterMetadata({
          before: existing,
          after: updated,
        }),
      });

      return updated;
    });
  });

export const deleteExpenseTripAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.billingExpenseTrip.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new ApplicationError("Trajet introuvable");
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.billingExpenseTrip.update({
        where: { id: parsedInput.id },
        data: {
          deletedAt: new Date(),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: BillingEntityType.EXPENSE_TRIP,
        entityId: deleted.id,
        eventType: BillingAuditEventType.DELETED,
        message: "Trajet professionnel supprimé",
        metadata: {
          ownerOverride: true,
          deletedFromStatus: existing.status,
        },
      });

      return deleted;
    });
  });

const expenseEntitySchema = z.enum([
  "EXPENSE_INVOICE",
  "EXPENSE_NOTE",
  "EXPENSE_TRIP",
]);

const suggestExpenseMatchingSchema = z.object({
  entityType: expenseEntitySchema,
  expenseId: z.string().optional(),
  amountCents: z.number().int().min(0).optional(),
  date: z.coerce.date().optional(),
  referenceHint: z.string().optional(),
});

const exportExpenseRegisterSchema = z.object({
  kind: z.enum(["INVOICES", "NOTES", "TRIPS"]),
});

const normalizeSearchText = (value?: string | null) => {
  return value
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
};

const formatIsoDate = (value: Date) => {
  return value.toISOString().slice(0, 10);
};

const computeMatchScore = (input: {
  paymentAmountCents: number;
  paymentDate: Date;
  paymentReference?: string | null;
  paymentNote?: string | null;
  targetAmountCents?: number;
  targetDate?: Date;
  targetReferenceHint?: string | null;
}) => {
  let score = 0;
  const reasons: string[] = [];

  if (input.targetAmountCents !== undefined) {
    const amountDiff = Math.abs(
      input.paymentAmountCents - input.targetAmountCents,
    );
    const ratio = amountDiff / Math.max(100, input.targetAmountCents);

    if (ratio <= 0.02) {
      score += 60;
      reasons.push("Montant quasi identique");
    } else if (ratio <= 0.1) {
      score += 35;
      reasons.push("Montant proche");
    } else if (ratio <= 0.25) {
      score += 12;
      reasons.push("Montant approchant");
    }
  }

  if (input.targetDate) {
    const dayDiff = Math.abs(
      Math.round(
        (input.paymentDate.getTime() - input.targetDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    if (dayDiff <= 2) {
      score += 25;
      reasons.push("Date très proche");
    } else if (dayDiff <= 7) {
      score += 15;
      reasons.push("Date proche");
    } else if (dayDiff <= 30) {
      score += 5;
      reasons.push("Date approchante");
    }
  }

  const referenceHint = normalizeSearchText(input.targetReferenceHint);
  if (referenceHint) {
    const referencePool = normalizeSearchText(
      `${input.paymentReference ?? ""} ${input.paymentNote ?? ""}`,
    );
    if (referencePool?.includes(referenceHint)) {
      score += 18;
      reasons.push("Référence similaire");
    }
  }

  return { score, reasons };
};

export const suggestExpenseMatchingAction = authAction
  .inputSchema(suggestExpenseMatchingSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    let targetAmountCents = parsedInput.amountCents;
    let targetDate = parsedInput.date ?? undefined;
    let targetReferenceHint = normalizeNullable(parsedInput.referenceHint);

    if (parsedInput.expenseId) {
      if (parsedInput.entityType === "EXPENSE_INVOICE") {
        const expense = await prisma.billingExpenseInvoice.findFirst({
          where: {
            id: parsedInput.expenseId,
            userId: user.id,
            deletedAt: null,
          },
          select: {
            totalInclTaxCents: true,
            issueDate: true,
            documentNumber: true,
            vendorName: true,
          },
        });
        if (!expense) {
          throw new ApplicationError(
            "Dépense facture introuvable pour le matching",
          );
        }
        targetAmountCents = expense.totalInclTaxCents;
        targetDate = expense.issueDate;
        targetReferenceHint = normalizeNullable(
          `${expense.documentNumber ?? ""} ${expense.vendorName}`,
        );
      } else if (parsedInput.entityType === "EXPENSE_NOTE") {
        const expense = await prisma.billingExpenseNote.findFirst({
          where: {
            id: parsedInput.expenseId,
            userId: user.id,
            deletedAt: null,
          },
          select: {
            amountInclTaxCents: true,
            expenseDate: true,
            label: true,
          },
        });
        if (!expense) {
          throw new ApplicationError(
            "Note de frais introuvable pour le matching",
          );
        }
        targetAmountCents = expense.amountInclTaxCents;
        targetDate = expense.expenseDate;
        targetReferenceHint = normalizeNullable(expense.label);
      } else {
        const expense = await prisma.billingExpenseTrip.findFirst({
          where: {
            id: parsedInput.expenseId,
            userId: user.id,
            deletedAt: null,
          },
          select: {
            totalCents: true,
            tripDate: true,
            fromAddress: true,
            toAddress: true,
          },
        });
        if (!expense) {
          throw new ApplicationError("Trajet introuvable pour le matching");
        }
        targetAmountCents = expense.totalCents;
        targetDate = expense.tripDate;
        targetReferenceHint = normalizeNullable(
          `${expense.fromAddress} ${expense.toAddress}`,
        );
      }
    }

    if (
      targetAmountCents === undefined &&
      !targetDate &&
      !targetReferenceHint
    ) {
      throw new ApplicationError(
        "Fournis un montant, une date ou une référence pour calculer les suggestions",
      );
    }

    const minDate = targetDate
      ? new Date(targetDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      : undefined;
    const maxDate = targetDate
      ? new Date(targetDate.getTime() + 90 * 24 * 60 * 60 * 1000)
      : undefined;

    const payments = await prisma.billingPayment.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        ...(minDate && maxDate
          ? {
              paidAt: {
                gte: minDate,
                lte: maxDate,
              },
            }
          : {}),
      },
      orderBy: {
        paidAt: "desc",
      },
      take: 120,
      include: {
        client: {
          select: {
            displayName: true,
          },
        },
      },
    });

    const suggestions = payments
      .map((payment) => {
        const scoring = computeMatchScore({
          paymentAmountCents: payment.amountCents,
          paymentDate: payment.paidAt,
          paymentReference: payment.reference,
          paymentNote: payment.note,
          targetAmountCents,
          targetDate,
          targetReferenceHint,
        });

        return {
          paymentId: payment.id,
          registerRef: `PAY-${payment.id.slice(0, 8).toUpperCase()}`,
          amountCents: payment.amountCents,
          paidAt: payment.paidAt,
          reference: payment.reference,
          note: payment.note,
          clientDisplayName: payment.client.displayName,
          method: payment.method,
          status: payment.status,
          score: scoring.score,
          reasons: scoring.reasons,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) => b.score - a.score || b.paidAt.getTime() - a.paidAt.getTime(),
      )
      .slice(0, 6);

    return {
      targetAmountCents: targetAmountCents ?? null,
      targetDate: targetDate ?? null,
      targetReferenceHint,
      suggestions,
      recommended: suggestions[0] ?? null,
    };
  });

export const exportExpenseRegisterCsvAction = authAction
  .inputSchema(exportExpenseRegisterSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (parsedInput.kind === "INVOICES") {
      const items = await prisma.billingExpenseInvoice.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        orderBy: {
          issueDate: "desc",
        },
      });

      const rows = items.map((item) => ({
        date: formatIsoDate(item.issueDate),
        dueDate: item.dueDate ? formatIsoDate(item.dueDate) : "",
        vendorName: item.vendorName,
        documentNumber: item.documentNumber ?? "",
        status: item.status,
        totalExclTaxCents: item.totalExclTaxCents,
        taxCents: item.taxCents,
        totalInclTaxCents: item.totalInclTaxCents,
        deductibleTaxCents: item.deductibleTaxCents,
        paid: item.isPaid ? "Oui" : "Non",
        paymentReference: item.paymentReference ?? "",
        matchedRegisterRef: item.matchedRegisterRef ?? "",
      }));

      const csv = generateCsv(rows, [
        { key: "date", header: "Date" },
        { key: "dueDate", header: "Echeance" },
        { key: "vendorName", header: "Fournisseur" },
        { key: "documentNumber", header: "Numero document" },
        { key: "status", header: "Statut" },
        { key: "totalExclTaxCents", header: "Montant HT (centimes)" },
        { key: "taxCents", header: "TVA (centimes)" },
        { key: "totalInclTaxCents", header: "Montant TTC (centimes)" },
        { key: "deductibleTaxCents", header: "TVA deductible (centimes)" },
        { key: "paid", header: "Payee" },
        { key: "paymentReference", header: "Reference paiement" },
        { key: "matchedRegisterRef", header: "Reference registre" },
      ]);

      return {
        filename: "jobio-expenses-factures-fournisseur.csv",
        csv,
      };
    }

    if (parsedInput.kind === "NOTES") {
      const items = await prisma.billingExpenseNote.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        orderBy: {
          expenseDate: "desc",
        },
      });

      const rows = items.map((item) => ({
        date: formatIsoDate(item.expenseDate),
        label: item.label,
        category: item.category ?? "",
        status: item.status,
        amountExclTaxCents: item.amountExclTaxCents,
        taxCents: item.taxCents,
        amountInclTaxCents: item.amountInclTaxCents,
        deductibleTaxCents: item.deductibleTaxCents,
        reimbursable: item.isReimbursable ? "Oui" : "Non",
        paid: item.isPaid ? "Oui" : "Non",
        paymentReference: item.paymentReference ?? "",
        matchedRegisterRef: item.matchedRegisterRef ?? "",
      }));

      const csv = generateCsv(rows, [
        { key: "date", header: "Date" },
        { key: "label", header: "Libelle" },
        { key: "category", header: "Categorie" },
        { key: "status", header: "Statut" },
        { key: "amountExclTaxCents", header: "Montant HT (centimes)" },
        { key: "taxCents", header: "TVA (centimes)" },
        { key: "amountInclTaxCents", header: "Montant TTC (centimes)" },
        { key: "deductibleTaxCents", header: "TVA deductible (centimes)" },
        { key: "reimbursable", header: "Remboursable" },
        { key: "paid", header: "Payee" },
        { key: "paymentReference", header: "Reference paiement" },
        { key: "matchedRegisterRef", header: "Reference registre" },
      ]);

      return {
        filename: "jobio-expenses-notes-frais.csv",
        csv,
      };
    }

    const items = await prisma.billingExpenseTrip.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: {
        tripDate: "desc",
      },
    });

    const rows = items.map((item) => ({
      date: formatIsoDate(item.tripDate),
      fromAddress: item.fromAddress,
      toAddress: item.toAddress,
      distanceKm: item.distanceKm,
      roundTrip: item.roundTrip ? "Oui" : "Non",
      allowanceRateCentsPerKm: item.allowanceRateCentsPerKm,
      tollCents: item.tollCents,
      parkingCents: item.parkingCents,
      totalCents: item.totalCents,
      status: item.status,
      paid: item.isPaid ? "Oui" : "Non",
      paymentReference: item.paymentReference ?? "",
      matchedRegisterRef: item.matchedRegisterRef ?? "",
    }));

    const csv = generateCsv(rows, [
      { key: "date", header: "Date" },
      { key: "fromAddress", header: "Depart" },
      { key: "toAddress", header: "Arrivee" },
      { key: "distanceKm", header: "Distance (km)" },
      { key: "roundTrip", header: "Aller-retour" },
      { key: "allowanceRateCentsPerKm", header: "Bareme (centimes/km)" },
      { key: "tollCents", header: "Peages (centimes)" },
      { key: "parkingCents", header: "Parking (centimes)" },
      { key: "totalCents", header: "Total (centimes)" },
      { key: "status", header: "Statut" },
      { key: "paid", header: "Paye" },
      { key: "paymentReference", header: "Reference paiement" },
      { key: "matchedRegisterRef", header: "Reference registre" },
    ]);

    return {
      filename: "jobio-expenses-trajets.csv",
      csv,
    };
  });
