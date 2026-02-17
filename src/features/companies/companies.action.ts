"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createCompanySchema, updateCompanySchema } from "./companies.schema";

export const getCompaniesAction = authAction.action(
  async ({ ctx: { user } }) => {
    const companies = await prisma.targetCompany.findMany({
      where: { userId: user.id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return companies;
  },
);

export const createCompanyAction = authAction
  .inputSchema(createCompanySchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "companies");

    const company = await prisma.targetCompany.create({
      data: {
        userId: user.id,
        name: parsedInput.name,
        website: parsedInput.website ?? null,
        notes: parsedInput.notes ?? null,
        sector: parsedInput.sector ?? null,
        size: parsedInput.size ?? null,
        status: parsedInput.status ?? "A_DEMARCHER",
        contactId: parsedInput.contactId ?? null,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return company;
  });

export const updateCompanyAction = authAction
  .inputSchema(updateCompanySchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const company = await prisma.targetCompany.findFirst({
      where: { id, userId: user.id },
    });

    if (!company) {
      throw new ApplicationError("Entreprise introuvable");
    }

    const updated = await prisma.targetCompany.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.website !== undefined && {
          website: data.website === "" ? null : data.website,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.sector !== undefined && { sector: data.sector }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.contactId !== undefined && { contactId: data.contactId }),
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  });

export const deleteCompanyAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const company = await prisma.targetCompany.findFirst({
      where: { id, userId: user.id },
    });

    if (!company) {
      throw new ApplicationError("Entreprise introuvable");
    }

    await prisma.targetCompany.delete({
      where: { id },
    });

    return { success: true };
  });
