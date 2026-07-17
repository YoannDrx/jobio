"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import {
  deletePipelineViewSchema,
  pipelineSavedViewStateSchema,
  savePipelineViewSchema,
  type SavedPipelineView,
} from "./pipeline-views.schema";

const MAX_SAVED_VIEWS = 20;

const toSavedView = (view: {
  id: string;
  name: string;
  state: unknown;
}): SavedPipelineView | null => {
  const state = pipelineSavedViewStateSchema.safeParse(view.state);
  return state.success
    ? { id: view.id, name: view.name, state: state.data }
    : null;
};

export const getPipelineSavedViewsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const views = await prisma.pipelineSavedView.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, state: true },
      take: MAX_SAVED_VIEWS,
    });

    return views.flatMap((view) => {
      const parsed = toSavedView(view);
      return parsed ? [parsed] : [];
    });
  },
);

export const savePipelineSavedViewAction = authAction
  .inputSchema(savePipelineViewSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.pipelineSavedView.findUnique({
        where: { userId_name: { userId: user.id, name: parsedInput.name } },
        select: { id: true },
      });

      if (!existing) {
        const count = await tx.pipelineSavedView.count({
          where: { userId: user.id },
        });
        if (count >= MAX_SAVED_VIEWS) {
          const oldest = await tx.pipelineSavedView.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: "asc" },
            select: { id: true },
          });
          if (oldest) {
            await tx.pipelineSavedView.delete({ where: { id: oldest.id } });
          }
        }
      }

      return tx.pipelineSavedView.upsert({
        where: { userId_name: { userId: user.id, name: parsedInput.name } },
        create: {
          userId: user.id,
          name: parsedInput.name,
          state: parsedInput.state,
        },
        update: { state: parsedInput.state },
        select: { id: true, name: true, state: true },
      });
    });

    const parsed = toSavedView(saved);
    if (!parsed) throw new ApplicationError("Vue sauvegardée invalide");
    return parsed;
  });

export const deletePipelineSavedViewAction = authAction
  .inputSchema(deletePipelineViewSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const deleted = await prisma.pipelineSavedView.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      throw new ApplicationError("Vue introuvable");
    }

    return { id };
  });
