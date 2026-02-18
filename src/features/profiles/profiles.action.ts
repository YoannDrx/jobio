"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createProfileSchema, updateProfileSchema } from "./profiles.schema";

export const createProfileAction = authAction
  .inputSchema(createProfileSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "profiles");

    const profile = await prisma.userProfile.create({
      data: {
        ...parsedInput,
        userId: user.id,
        skills:
          parsedInput.skills.length > 0 ? parsedInput.skills : Prisma.JsonNull,
        experiences:
          parsedInput.experiences.length > 0
            ? parsedInput.experiences
            : Prisma.JsonNull,
        education:
          parsedInput.education.length > 0
            ? parsedInput.education
            : Prisma.JsonNull,
        certifications:
          parsedInput.certifications.length > 0
            ? parsedInput.certifications
            : Prisma.JsonNull,
        languages:
          parsedInput.languages.length > 0
            ? parsedInput.languages
            : Prisma.JsonNull,
        projects:
          parsedInput.projects.length > 0
            ? parsedInput.projects
            : Prisma.JsonNull,
        tjmTarget: parsedInput.tjmTarget ?? null,
        workTypePreference: parsedInput.workTypePreference ?? null,
        zone: parsedInput.zone ?? null,
        minDuration: parsedInput.minDuration ?? null,
        maxDuration: parsedInput.maxDuration ?? null,
      },
    });

    if (parsedInput.isDefault) {
      await prisma.userProfile.updateMany({
        where: {
          userId: user.id,
          id: { not: profile.id },
        },
        data: { isDefault: false },
      });
    }

    return profile;
  });

export const updateProfileAction = authAction
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const profile = await prisma.userProfile.findFirst({
      where: { id, userId: user.id },
    });

    if (!profile) {
      throw new ApplicationError("Profil introuvable");
    }

    const jsonField = (arr: unknown[] | undefined) =>
      arr ? (arr.length > 0 ? arr : Prisma.JsonNull) : undefined;

    const updateData: Record<string, unknown> = {
      ...data,
      skills: jsonField(data.skills),
      experiences: jsonField(data.experiences),
      education: jsonField(data.education),
      certifications: jsonField(data.certifications),
      languages: jsonField(data.languages),
      projects: jsonField(data.projects),
    };

    const updated = await prisma.userProfile.update({
      where: { id },
      data: updateData,
    });

    if (data.isDefault === true) {
      await prisma.userProfile.updateMany({
        where: {
          userId: user.id,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return updated;
  });

export const deleteProfileAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const profile = await prisma.userProfile.findFirst({
      where: { id, userId: user.id },
    });

    if (!profile) {
      throw new ApplicationError("Profil introuvable");
    }

    return prisma.userProfile.delete({
      where: { id },
    });
  });

export const getProfilesAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const profiles = await prisma.userProfile.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      include: {
        clientPortals: {
          where: { isPublic: true },
          select: { slug: true },
        },
      },
    });

    return profiles.map((profile) => ({
      ...profile,
      portalSlug: profile.clientPortals[0]?.slug ?? null,
    }));
  });

export const getProfileAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const profile = await prisma.userProfile.findFirst({
      where: { id, userId: user.id },
    });

    if (!profile) {
      throw new ApplicationError("Profil introuvable");
    }

    return profile;
  });

export const getDefaultProfileAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    let profile = await prisma.userProfile.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    profile ??= await prisma.userProfile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return profile;
  });
