"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addInteractionSchema } from "./contacts.schema";

export const getContactInteractionsAction = authAction
  .inputSchema(z.object({ contactId: z.string() }))
  .action(async ({ parsedInput: { contactId }, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    return prisma.contactInteraction.findMany({
      where: { contactId },
      orderBy: { date: "desc" },
    });
  });

export const createContactInteractionAction = authAction
  .inputSchema(addInteractionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id: parsedInput.contactId, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    return prisma.contactInteraction.create({
      data: {
        contactId: parsedInput.contactId,
        type: parsedInput.type,
        description: parsedInput.description,
        date: parsedInput.date,
      },
    });
  });

export const deleteContactInteractionAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const interaction = await prisma.contactInteraction.findFirst({
      where: { id },
      include: { contact: { select: { userId: true } } },
    });

    if (interaction?.contact.userId !== user.id) {
      throw new ApplicationError("Interaction introuvable");
    }

    return prisma.contactInteraction.delete({
      where: { id },
    });
  });
