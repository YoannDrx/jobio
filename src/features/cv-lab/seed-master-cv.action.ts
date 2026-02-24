"use server";

import type { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import {
  SEED_CERTIFICATIONS,
  SEED_EDUCATION,
  SEED_EXPERIENCES,
  SEED_LANGUAGES,
  SEED_PERSONAL_INFO,
  SEED_PROJECTS,
  SEED_SKILLS,
  SEED_SOCIAL_LINKS,
} from "./seed-master-cv-data";

const toJson = (val: unknown): Prisma.InputJsonValue =>
  val as Prisma.InputJsonValue;

export const seedMasterCvAction = authAction.action(
  async ({ ctx: { user } }) => {
    if (user.email !== "yoann.andrieux@gmail.com" && user.role !== "admin") {
      throw new ApplicationError("Action reservee aux administrateurs");
    }

    const existing = await prisma.masterCv.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const data = {
      fullName: SEED_PERSONAL_INFO.fullName,
      headline: SEED_PERSONAL_INFO.headline,
      summary: SEED_PERSONAL_INFO.summary,
      email: SEED_PERSONAL_INFO.email,
      phone: SEED_PERSONAL_INFO.phone,
      city: SEED_PERSONAL_INFO.city,
      hobbies: toJson([...SEED_PERSONAL_INFO.hobbies]),
      driverLicenses: toJson([...SEED_PERSONAL_INFO.driverLicenses]),
      socialLinks: toJson(SEED_SOCIAL_LINKS),
      experiences: toJson(SEED_EXPERIENCES),
      skills: toJson(SEED_SKILLS),
      education: toJson(SEED_EDUCATION),
      projects: toJson(SEED_PROJECTS),
      languages: toJson(SEED_LANGUAGES),
      certifications: toJson(SEED_CERTIFICATIONS),
    };

    if (existing) {
      return prisma.masterCv.update({
        where: { userId: user.id },
        data,
      });
    }

    return prisma.masterCv.create({
      data: {
        userId: user.id,
        ...data,
      },
    });
  },
);
