"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { z } from "zod";
import {
  createSequenceSchema,
  updateSequenceSchema,
  deleteSequenceSchema,
} from "./sequences.schema";

export const createSequenceAction = authAction
  .inputSchema(createSequenceSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "sequences");

    const sequence = await prisma.sequence.create({
      data: {
        ...parsedInput,
        userId: user.id,
        steps: parsedInput.steps,
      },
    });

    return sequence;
  });

export const updateSequenceAction = authAction
  .inputSchema(updateSequenceSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const sequence = await prisma.sequence.findFirst({
      where: { id, userId: user.id },
    });

    if (!sequence) {
      throw new ApplicationError("Séquence introuvable");
    }

    const updated = await prisma.sequence.update({
      where: { id },
      data,
    });

    return updated;
  });

export const deleteSequenceAction = authAction
  .inputSchema(deleteSequenceSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const sequence = await prisma.sequence.findFirst({
      where: { id, userId: user.id },
    });

    if (!sequence) {
      throw new ApplicationError("Séquence introuvable");
    }

    if (sequence.isDefault) {
      throw new ApplicationError(
        "Impossible de supprimer la séquence par défaut",
      );
    }

    await prisma.sequence.delete({
      where: { id },
    });

    return { deleted: true };
  });

export const getSequencesAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const sequences = await prisma.sequence.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return sequences;
  });

export const getSequenceAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const sequence = await prisma.sequence.findFirst({
      where: { id, userId: user.id },
    });

    if (!sequence) {
      throw new ApplicationError("Séquence introuvable");
    }

    return sequence;
  });
