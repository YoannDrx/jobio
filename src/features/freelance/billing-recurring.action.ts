"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import {
  createRecurringInvoiceSchema,
  updateRecurringInvoiceSchema,
  deleteRecurringInvoiceSchema,
  listRecurringInvoicesSchema,
} from "./billing.schema";
import { createBillingAuditEvent } from "./billing-audit";
import type { BillingRecurrenceFrequency, Prisma } from "@/generated/prisma";

export const computeNextInvoiceDate = (
  currentDate: Date,
  frequency: BillingRecurrenceFrequency,
): Date => {
  const next = new Date(currentDate);
  switch (frequency) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "ANNUALLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
};

export const createRecurringInvoiceAction = authAction
  .inputSchema(createRecurringInvoiceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const client = await prisma.billingClient.findFirst({
      where: { id: parsedInput.clientId, userId: user.id, deletedAt: null },
    });

    if (!client) {
      throw new ApplicationError("Client introuvable");
    }

    const recurring = await prisma.$transaction(async (tx) => {
      const created = await tx.billingRecurringInvoice.create({
        data: {
          userId: user.id,
          clientId: parsedInput.clientId,
          name: parsedInput.name,
          frequency: parsedInput.frequency,
          lines: parsedInput.lines as unknown as Prisma.InputJsonValue,
          currency: parsedInput.currency,
          notes: parsedInput.notes,
          terms: parsedInput.terms,
          documentTemplate: parsedInput.documentTemplate,
          startDate: parsedInput.startDate,
          nextInvoiceDate: parsedInput.startDate,
          endDate: parsedInput.endDate ?? null,
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: "RECURRING_INVOICE",
        entityId: created.id,
        eventType: "CREATED",
        message: `Facture récurrente "${created.name}" créée`,
      });

      return created;
    });

    return recurring;
  });

export const updateRecurringInvoiceAction = authAction
  .inputSchema(updateRecurringInvoiceSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const existing = await prisma.billingRecurringInvoice.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      throw new ApplicationError("Facture récurrente introuvable");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.billingRecurringInvoice.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.frequency !== undefined && { frequency: data.frequency }),
          ...(data.lines !== undefined && {
            lines: data.lines as unknown as Prisma.InputJsonValue,
          }),
          ...(data.currency !== undefined && { currency: data.currency }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.terms !== undefined && { terms: data.terms }),
          ...(data.documentTemplate !== undefined && {
            documentTemplate: data.documentTemplate,
          }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: "RECURRING_INVOICE",
        entityId: id,
        eventType: "UPDATED",
        message: `Facture récurrente "${result.name}" mise à jour`,
      });

      return result;
    });

    return updated;
  });

export const deleteRecurringInvoiceAction = authAction
  .inputSchema(deleteRecurringInvoiceSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const existing = await prisma.billingRecurringInvoice.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      throw new ApplicationError("Facture récurrente introuvable");
    }

    await prisma.$transaction(async (tx) => {
      await tx.billingRecurringInvoice.delete({ where: { id } });

      await createBillingAuditEvent(tx, {
        userId: user.id,
        entityType: "RECURRING_INVOICE",
        entityId: id,
        eventType: "DELETED",
        message: `Facture récurrente "${existing.name}" supprimée`,
      });
    });

    return { deleted: true };
  });

export const getRecurringInvoicesAction = authAction
  .inputSchema(listRecurringInvoicesSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const [items, total] = await Promise.all([
      prisma.billingRecurringInvoice.findMany({
        where: { userId: user.id },
        include: {
          client: {
            select: { id: true, displayName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.billingRecurringInvoice.count({
        where: { userId: user.id },
      }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });
