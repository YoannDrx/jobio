"use server";

import type { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  masterCvCertificationSchema,
  masterCvEducationSchema,
  masterCvExperienceSchema,
  masterCvLanguageSchema,
  masterCvPersonalInfoSchema,
  masterCvProjectSchema,
  masterCvSectionSchema,
  masterCvSkillSchema,
} from "./cv-lab.schema";

const sectionItemSchemaMap = {
  experiences: masterCvExperienceSchema,
  skills: masterCvSkillSchema,
  education: masterCvEducationSchema,
  projects: masterCvProjectSchema,
  languages: masterCvLanguageSchema,
  certifications: masterCvCertificationSchema,
} as const;

const parseSectionItems = (
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown>[] => {
  if (!Array.isArray(value)) return [];
  return (value as unknown[]).filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === "object" && !Array.isArray(item),
  );
};

export const getMasterCvAction = authAction.action(
  async ({ ctx: { user } }) => {
    const masterCv = await prisma.masterCv.findUnique({
      where: { userId: user.id },
    });

    return masterCv;
  },
);

export const createMasterCvAction = authAction
  .inputSchema(masterCvPersonalInfoSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.masterCv.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (existing) {
      throw new ApplicationError(
        "Un CV Master existe deja pour cet utilisateur",
      );
    }

    const masterCv = await prisma.masterCv.create({
      data: {
        userId: user.id,
        fullName: parsedInput.fullName,
        headline: parsedInput.headline,
        summary: parsedInput.summary,
        email: parsedInput.email,
        phone: parsedInput.phone,
        city: parsedInput.city,
        photoUrl: parsedInput.photoUrl,
        hobbies: parsedInput.hobbies as Prisma.InputJsonValue,
        driverLicenses: parsedInput.driverLicenses as Prisma.InputJsonValue,
        socialLinks:
          parsedInput.socialLinks as unknown as Prisma.InputJsonValue,
      },
    });

    return masterCv;
  });

export const updateMasterCvAction = authAction
  .inputSchema(
    masterCvPersonalInfoSchema.partial().extend({
      experiences: z.array(masterCvExperienceSchema).optional(),
      skills: z.array(masterCvSkillSchema).optional(),
      education: z.array(masterCvEducationSchema).optional(),
      projects: z.array(masterCvProjectSchema).optional(),
      languages: z.array(masterCvLanguageSchema).optional(),
      certifications: z.array(masterCvCertificationSchema).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existing = await prisma.masterCv.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      throw new ApplicationError("CV Master introuvable");
    }

    const data: Record<string, unknown> = {};

    if (parsedInput.fullName !== undefined)
      data.fullName = parsedInput.fullName;
    if (parsedInput.headline !== undefined)
      data.headline = parsedInput.headline;
    if (parsedInput.summary !== undefined) data.summary = parsedInput.summary;
    if (parsedInput.email !== undefined) data.email = parsedInput.email;
    if (parsedInput.phone !== undefined) data.phone = parsedInput.phone;
    if (parsedInput.city !== undefined) data.city = parsedInput.city;
    if (parsedInput.photoUrl !== undefined)
      data.photoUrl = parsedInput.photoUrl;
    if (parsedInput.hobbies !== undefined)
      data.hobbies = parsedInput.hobbies as unknown as Prisma.InputJsonValue;
    if (parsedInput.driverLicenses !== undefined)
      data.driverLicenses =
        parsedInput.driverLicenses as unknown as Prisma.InputJsonValue;
    if (parsedInput.socialLinks !== undefined)
      data.socialLinks =
        parsedInput.socialLinks as unknown as Prisma.InputJsonValue;
    if (parsedInput.experiences !== undefined)
      data.experiences =
        parsedInput.experiences as unknown as Prisma.InputJsonValue;
    if (parsedInput.skills !== undefined)
      data.skills = parsedInput.skills as unknown as Prisma.InputJsonValue;
    if (parsedInput.education !== undefined)
      data.education =
        parsedInput.education as unknown as Prisma.InputJsonValue;
    if (parsedInput.projects !== undefined)
      data.projects = parsedInput.projects as unknown as Prisma.InputJsonValue;
    if (parsedInput.languages !== undefined)
      data.languages =
        parsedInput.languages as unknown as Prisma.InputJsonValue;
    if (parsedInput.certifications !== undefined)
      data.certifications =
        parsedInput.certifications as unknown as Prisma.InputJsonValue;

    const updated = await prisma.masterCv.update({
      where: { userId: user.id },
      data,
    });

    return updated;
  });

export const addMasterCvItemAction = authAction
  .inputSchema(
    z.object({
      section: masterCvSectionSchema,
      item: z.record(z.string(), z.unknown()),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const masterCv = await prisma.masterCv.findUnique({
      where: { userId: user.id },
    });

    if (!masterCv) {
      throw new ApplicationError("CV Master introuvable");
    }

    const { section, item } = parsedInput;
    const schema = sectionItemSchemaMap[section];
    const itemWithId = { ...item, id: nanoid(11) };
    const validated = schema.parse(itemWithId);

    const currentItems = parseSectionItems(
      masterCv[section] as Prisma.JsonValue,
    );
    const updatedItems = [
      ...currentItems,
      validated,
    ] as unknown as Prisma.InputJsonValue;

    const updated = await prisma.masterCv.update({
      where: { userId: user.id },
      data: { [section]: updatedItems },
    });

    return { masterCv: updated, newItemId: validated.id };
  });

export const updateMasterCvItemAction = authAction
  .inputSchema(
    z.object({
      section: masterCvSectionSchema,
      itemId: z.string().min(1),
      patch: z.record(z.string(), z.unknown()),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const masterCv = await prisma.masterCv.findUnique({
      where: { userId: user.id },
    });

    if (!masterCv) {
      throw new ApplicationError("CV Master introuvable");
    }

    const { section, itemId, patch } = parsedInput;
    const schema = sectionItemSchemaMap[section];
    const currentItems = parseSectionItems(
      masterCv[section] as Prisma.JsonValue,
    );

    const itemIndex = currentItems.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new ApplicationError("Item introuvable");
    }

    const mergedItem = { ...currentItems[itemIndex], ...patch, id: itemId };
    const validated = schema.parse(mergedItem);

    currentItems[itemIndex] = validated;

    const updated = await prisma.masterCv.update({
      where: { userId: user.id },
      data: {
        [section]: currentItems as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  });

export const removeMasterCvItemAction = authAction
  .inputSchema(
    z.object({
      section: masterCvSectionSchema,
      itemId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const masterCv = await prisma.masterCv.findUnique({
      where: { userId: user.id },
    });

    if (!masterCv) {
      throw new ApplicationError("CV Master introuvable");
    }

    const { section, itemId } = parsedInput;
    const currentItems = parseSectionItems(
      masterCv[section] as Prisma.JsonValue,
    );

    const filtered = currentItems.filter((item) => item.id !== itemId);

    const updated = await prisma.masterCv.update({
      where: { userId: user.id },
      data: {
        [section]: filtered as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  });

export const reorderMasterCvItemsAction = authAction
  .inputSchema(
    z.object({
      section: masterCvSectionSchema,
      itemIds: z.array(z.string().min(1)),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const masterCv = await prisma.masterCv.findUnique({
      where: { userId: user.id },
    });

    if (!masterCv) {
      throw new ApplicationError("CV Master introuvable");
    }

    const { section, itemIds } = parsedInput;
    const currentItems = parseSectionItems(
      masterCv[section] as Prisma.JsonValue,
    );

    const itemMap = new Map(
      currentItems.map((item) => [item.id as string, item]),
    );

    const reordered = itemIds
      .map((id) => itemMap.get(id))
      .filter((item): item is Record<string, unknown> => item !== undefined);

    // Append any items not in the reorder list
    for (const item of currentItems) {
      if (!itemIds.includes(item.id as string)) {
        reordered.push(item);
      }
    }

    const updated = await prisma.masterCv.update({
      where: { userId: user.id },
      data: {
        [section]: reordered as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  });

export const importMasterCvFromProfileAction = authAction
  .inputSchema(z.object({ profileId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const profile = await prisma.userProfile.findFirst({
      where: { id: parsedInput.profileId, userId: user.id },
    });

    if (!profile) {
      throw new ApplicationError("Profil introuvable");
    }

    const mapWithIds = (items: unknown): Record<string, unknown>[] => {
      if (!Array.isArray(items)) return [];
      return items.map((item) => ({
        ...(typeof item === "object" && item !== null ? item : {}),
        id: nanoid(11),
      }));
    };

    const experiences = mapWithIds(profile.experiences);
    const skills = mapWithIds(profile.skills);
    const education = mapWithIds(profile.education);
    const projects = mapWithIds(profile.projects);
    const languages = mapWithIds(profile.languages);
    const certifications = mapWithIds(profile.certifications);

    const toJson = (val: unknown): Prisma.InputJsonValue =>
      val as Prisma.InputJsonValue;

    const existing = await prisma.masterCv.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (existing) {
      const updated = await prisma.masterCv.update({
        where: { userId: user.id },
        data: {
          fullName: profile.name,
          headline: profile.headline,
          summary: profile.bio,
          experiences: toJson(experiences),
          skills: toJson(skills),
          education: toJson(education),
          projects: toJson(projects),
          languages: toJson(languages),
          certifications: toJson(certifications),
        },
      });
      return updated;
    }

    const created = await prisma.masterCv.create({
      data: {
        userId: user.id,
        fullName: profile.name,
        headline: profile.headline,
        summary: profile.bio,
        experiences: toJson(experiences),
        skills: toJson(skills),
        education: toJson(education),
        projects: toJson(projects),
        languages: toJson(languages),
        certifications: toJson(certifications),
      },
    });

    return created;
  });
