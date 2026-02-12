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

const createCustomPlatformSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  website: z.string().url().optional().or(z.literal("")),
});

const deleteCustomPlatformSchema = z.object({
  id: z.string(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const getPlatformsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const platforms = await prisma.platform.findMany({
      where: {
        OR: [
          { isSystem: true },
          {
            isSystem: false,
            userPlatforms: { some: { userId: user.id } },
          },
        ],
      },
      orderBy: { name: "asc" },
    });

    return platforms;
  },
);

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

export const createCustomPlatformAction = authAction
  .inputSchema(createCustomPlatformSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "platforms");

    const slug = slugify(parsedInput.name);

    const existingSlug = await prisma.platform.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ApplicationError("Une plateforme avec ce nom existe déjà");
    }

    const result = await prisma.$transaction(async (tx) => {
      const platform = await tx.platform.create({
        data: {
          name: parsedInput.name,
          slug,
          website: parsedInput.website ?? null,
          category: "GENERALIST",
          isSystem: false,
        },
      });

      const userPlatform = await tx.userPlatform.create({
        data: {
          userId: user.id,
          platformId: platform.id,
        },
        include: { platform: true },
      });

      return userPlatform;
    });

    return result;
  });

export const deleteCustomPlatformAction = authAction
  .inputSchema(deleteCustomPlatformSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const platform = await prisma.platform.findFirst({
      where: { id, isSystem: false },
    });

    if (!platform) {
      throw new ApplicationError("Plateforme introuvable ou non supprimable");
    }

    const userPlatform = await prisma.userPlatform.findFirst({
      where: { userId: user.id, platformId: id },
    });

    if (!userPlatform) {
      throw new ApplicationError(
        "Vous n'êtes pas propriétaire de cette plateforme",
      );
    }

    await prisma.platform.delete({
      where: { id },
    });

    return { success: true };
  });
