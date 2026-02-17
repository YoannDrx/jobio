"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getPortalAction = authAction
  .inputSchema(z.object({ profileId: z.string() }))
  .action(async ({ parsedInput: { profileId }, ctx: { user } }) => {
    const portal = await prisma.clientPortal.findFirst({
      where: { profileId, userId: user.id },
    });

    return portal;
  });

export const upsertPortalAction = authAction
  .inputSchema(
    z.object({
      profileId: z.string(),
      slug: z
        .string()
        .min(3)
        .max(60)
        .regex(
          /^[a-z0-9-]+$/,
          "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets",
        ),
      isPublic: z.boolean().optional(),
      customBio: z.string().nullable().optional(),
      showSkills: z.boolean().optional(),
      showExperiences: z.boolean().optional(),
      showEducation: z.boolean().optional(),
      showProjects: z.boolean().optional(),
      showLanguages: z.boolean().optional(),
      showTjm: z.boolean().optional(),
      showAvailability: z.boolean().optional(),
    }),
  )
  .action(
    async ({ parsedInput: { profileId, slug, ...data }, ctx: { user } }) => {
      const profile = await prisma.userProfile.findFirst({
        where: { id: profileId, userId: user.id },
      });

      if (!profile) {
        throw new ApplicationError("Profil introuvable");
      }

      const existingSlug = await prisma.clientPortal.findFirst({
        where: {
          slug,
          NOT: { userId: user.id, profileId },
        },
      });

      if (existingSlug) {
        throw new ApplicationError("Ce slug est deja pris");
      }

      const portal = await prisma.clientPortal.upsert({
        where: {
          userId_profileId: { userId: user.id, profileId },
        },
        create: {
          userId: user.id,
          profileId,
          slug,
          ...data,
        },
        update: {
          slug,
          ...data,
        },
      });

      return portal;
    },
  );

export async function getPublicPortalBySlug(slug: string) {
  const portal = await prisma.clientPortal.findUnique({
    where: { slug },
    include: {
      profile: true,
      user: {
        select: { name: true, image: true },
      },
    },
  });

  return portal;
}
