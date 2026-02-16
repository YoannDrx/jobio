"use server";

import type { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  buildProfileUpdateFromCvCoach,
  type ProfileCoachMergeMode,
} from "./cv-coach-profile-mapper";
import { parseSnapshot, toJson } from "./cv-coach.utils";

const createCvCoachVariantSchema = z.object({
  sessionId: z.string().min(1),
  profileId: z.string().min(1),
});

const hasUsefulSnapshotData = (snapshot: ReturnType<typeof parseSnapshot>) => {
  const hasIdentity = Object.values(snapshot.identity).some(
    (value) => value.trim().length > 0,
  );
  const hasSummary = snapshot.summary.trim().length > 0;
  const hasExperiences = snapshot.experiences.length > 0;
  const hasSkills =
    snapshot.skills.hard.length > 0 ||
    snapshot.skills.tools.length > 0 ||
    snapshot.skills.soft.length > 0;
  const hasProjects = snapshot.projects.length > 0;
  const hasEducation = snapshot.education.length > 0;

  return (
    hasIdentity ||
    hasSummary ||
    hasExperiences ||
    hasSkills ||
    hasProjects ||
    hasEducation
  );
};

export const createCvCoachVariantAction = authAction
  .inputSchema(createCvCoachVariantSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const [session, profile] = await Promise.all([
      prisma.cvLabCoachSession.findFirst({
        where: {
          id: parsedInput.sessionId,
          userId: user.id,
        },
      }),
      prisma.userProfile.findFirst({
        where: {
          id: parsedInput.profileId,
          userId: user.id,
        },
      }),
    ]);

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    if (!profile) {
      throw new ApplicationError("Profil introuvable");
    }

    const snapshot = parseSnapshot(session.structuredSnapshot);

    if (!hasUsefulSnapshotData(snapshot)) {
      throw new ApplicationError(
        "Le dossier CV est vide. Continue d'abord la conversation avant de créer un variant.",
      );
    }

    const updatePayload = buildProfileUpdateFromCvCoach({
      snapshot,
      mode: "MERGE" as ProfileCoachMergeMode,
      currentProfile: profile,
    });

    await prisma.userProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        headline: updatePayload.headline,
        bio: updatePayload.bio,
        skills: updatePayload.skills,
        experiences: updatePayload.experiences,
        education: updatePayload.education,
        certifications: updatePayload.certifications,
        languages: updatePayload.languages,
        projects: updatePayload.projects,
        zone: updatePayload.zone,
      },
    });

    const document = await prisma.cvLabDocument.create({
      data: {
        userId: user.id,
        profileId: parsedInput.profileId,
        name: `CV - ${session.goalRole ?? "Sans titre"}`,
        targetRole: session.goalRole,
        template: "CLASSIC",
        theme: "MODERN",
        pageSize: "A4",
        accentColor: "#0f172a",
        fontFamily: "Inter",
        sectionOrder: toJson([
          "summary",
          "experiences",
          "skills",
          "projects",
          "education",
          "languages",
          "certifications",
        ]) as Prisma.InputJsonValue,
        hiddenSections: toJson([]) as Prisma.InputJsonValue,
      },
    });

    return {
      document,
      profileId: parsedInput.profileId,
    };
  });
