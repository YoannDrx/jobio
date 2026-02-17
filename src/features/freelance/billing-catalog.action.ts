"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  catalogFilterSchema,
  createCatalogItemSchema,
  updateCatalogItemSchema,
} from "./billing.schema";

const nullableText = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return value.trim();
};

export const createCatalogItemAction = authAction
  .inputSchema(createCatalogItemSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "billingCatalogItems");

    return prisma.billingCatalogItem.create({
      data: {
        userId: user.id,
        name: parsedInput.name,
        description: nullableText(parsedInput.description),
        unitLabel: parsedInput.unitLabel,
        unitPriceCents: parsedInput.unitPriceCents,
        vatRatePercent: parsedInput.vatRatePercent,
      },
    });
  });

export const updateCatalogItemAction = authAction
  .inputSchema(updateCatalogItemSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const item = await prisma.billingCatalogItem.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new ApplicationError("Élément catalogue introuvable");
    }

    return prisma.billingCatalogItem.update({
      where: {
        id: parsedInput.id,
      },
      data: {
        name: parsedInput.name,
        description:
          parsedInput.description === undefined
            ? undefined
            : nullableText(parsedInput.description),
        unitLabel: parsedInput.unitLabel,
        unitPriceCents: parsedInput.unitPriceCents,
        vatRatePercent: parsedInput.vatRatePercent,
        isActive: parsedInput.isActive,
      },
    });
  });

export const deleteCatalogItemAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const item = await prisma.billingCatalogItem.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new ApplicationError("Élément catalogue introuvable");
    }

    return prisma.billingCatalogItem.delete({
      where: {
        id: parsedInput.id,
      },
    });
  });

export const getCatalogItemsAction = authAction
  .inputSchema(catalogFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      ...(filters.includeInactive ? {} : { isActive: true }),
    };

    if (filters.search && filters.search.trim().length > 0) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.billingCatalogItem.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.billingCatalogItem.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });
