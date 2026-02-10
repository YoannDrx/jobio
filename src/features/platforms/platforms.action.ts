"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addUserPlatformSchema = z.object({
  platformId: z.string(),
  profileUrl: z.string().url().optional(),
});

const updateUserPlatformSchema = z.object({
  id: z.string(),
  profileUrl: z.string().url().optional(),
  status: z.enum(["NOT_REGISTERED", "REGISTERED", "ACTIVE"]).optional(),
});

const removeUserPlatformSchema = z.object({
  id: z.string(),
});

export const getPlatformsAction = authAction.action(async () => {
  const platforms = await prisma.platform.findMany({
    where: { isSystem: true },
    orderBy: { name: "asc" },
  });

  return platforms;
});

export const getUserPlatformsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const userPlatforms = await prisma.userPlatform.findMany({
      where: { userId: user.id },
      include: { platform: true },
      orderBy: { createdAt: "desc" },
    });

    return userPlatforms;
  },
);

export const addUserPlatformAction = authAction
  .inputSchema(addUserPlatformSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "platforms");

    const platform = await prisma.platform.findUnique({
      where: { id: parsedInput.platformId },
    });

    if (!platform) {
      throw new ApplicationError("Plateforme introuvable");
    }

    const existing = await prisma.userPlatform.findUnique({
      where: {
        userId_platformId: {
          userId: user.id,
          platformId: parsedInput.platformId,
        },
      },
    });

    if (existing) {
      throw new ApplicationError("Plateforme déjà ajoutée");
    }

    const userPlatform = await prisma.userPlatform.create({
      data: {
        userId: user.id,
        platformId: parsedInput.platformId,
        profileUrl: parsedInput.profileUrl ?? null,
      },
      include: { platform: true },
    });

    return userPlatform;
  });

export const updateUserPlatformAction = authAction
  .inputSchema(updateUserPlatformSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const userPlatform = await prisma.userPlatform.findFirst({
      where: { id, userId: user.id },
    });

    if (!userPlatform) {
      throw new ApplicationError("Plateforme utilisateur introuvable");
    }

    const updated = await prisma.userPlatform.update({
      where: { id },
      data: {
        ...(data.profileUrl !== undefined && {
          profileUrl: data.profileUrl ?? null,
        }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: { platform: true },
    });

    return updated;
  });

export const removeUserPlatformAction = authAction
  .inputSchema(removeUserPlatformSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const userPlatform = await prisma.userPlatform.findFirst({
      where: { id, userId: user.id },
    });

    if (!userPlatform) {
      throw new ApplicationError("Plateforme utilisateur introuvable");
    }

    await prisma.userPlatform.delete({
      where: { id },
    });

    return { success: true };
  });
