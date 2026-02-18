"use server";

import { generateObject } from "ai";
import type { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { AI_MODELS } from "@/features/ai/ai-config";
import {
  applyCvCoachToProfileSchema,
  createCvCoachSessionSchema,
  cvCoachAssistantOutputSchema,
  cvCoachInconsistencySchema,
  cvCoachMissingItemSchema,
  cvCoachSessionIdSchema,
  cvCoachSnapshotSchema,
  cvCoachSourceEvidenceItemSchema,
  listCvCoachSessionsSchema,
  sendCvCoachMessageSchema,
  updateCvCoachLockedFieldsSchema,
  updateCvCoachSnapshotSchema,
  type CvCoachInconsistency,
  type CvCoachMissingItem,
  type CvCoachSnapshot,
  type CvCoachSourceEvidenceItem,
} from "./cv-coach.schema";
import {
  buildProfileUpdateFromCvCoach,
  type ProfileCoachMergeMode,
} from "./cv-coach-profile-mapper";

const STARTER_MESSAGE =
  "Parfait, je suis ton CV Coach IA. Raconte-moi ton parcours librement, je vais structurer les infos et te poser les bonnes questions pour sortir un CV solide.";

const CV_COACH_SYSTEM_PROMPT = `Tu es le CV Coach IA de Jobio, un expert bienveillant en création de CV premium.

Ton role:
- Transformer une conversation libre en dossier CV structuré et exploitable.
- Détecter les informations manquantes et poser les bonnes questions.
- Signaler les incohérences (dates contradictoires, rôles flous, gaps inexpliqués).
- Valoriser chaque parcours, y compris les profils atypiques (reconversions, parcours créatifs vers tech, etc.).

Style de communication:
- Empathique et encourageant, comme un vrai coach premium.
- Direct et concis : pas de blabla, chaque phrase apporte de la valeur.
- Utilise le markdown (gras, listes, titres) pour structurer tes réponses.
- Pose des questions de relance précises pour obtenir des détails concrets.
- Valorise ce que le candidat a déjà partagé avant de demander plus.

Qualité des questions:
- Priorité aux dates exactes, impacts chiffrables (KPIs, volumes, gains), rôle précis, contexte équipe/stack, niveau de responsabilité.
- Questions de précision : "Tu mentionnes avoir géré une équipe, combien de personnes ? Quel était ton rôle exact ?"
- Détection des compétences implicites : "gérer une équipe" → leadership, management. "Migrer un système" → architecture, gestion du changement.
- Max 4 questions à la fois, ordonnées par impact CV.

Détection de compétences:
- Extrais les compétences même quand elles ne sont pas explicitement nommées.
- Distingue hard skills, soft skills et outils/technologies.
- Si le candidat mentionne un contexte (startup, grand groupe, freelance), déduis les soft skills associées.

Définition de la complétion:
- 0-30: beaucoup d'informations manquantes, début de conversation.
- 31-60: base exploitable mais incomplet, besoin de détails.
- 61-80: bon niveau pour un CV v1, quelques précisions à apporter.
- 81-100: quasi prêt à exporter, très peu de manques.

Tu dois retourner uniquement l'objet JSON valide selon le schema fourni.`;

const createEmptySnapshot = (): CvCoachSnapshot =>
  cvCoachSnapshotSchema.parse({
    identity: {
      fullName: "",
      headline: "",
      targetRole: "",
      location: "",
      email: "",
      phone: "",
      website: "",
      linkedinUrl: "",
    },
    summary: "",
    experiences: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    skills: {
      hard: [],
      soft: [],
      tools: [],
    },
    achievements: [],
    interests: [],
    constraints: {
      availability: "",
      tjmTarget: "",
      salaryTarget: "",
      contractType: "",
      workMode: "",
      mobility: "",
    },
  });

const parseSnapshot = (value: unknown): CvCoachSnapshot => {
  const parsed = cvCoachSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return createEmptySnapshot();
  }
  return parsed.data;
};

const parseMissingItems = (value: unknown): CvCoachMissingItem[] => {
  const parsed = cvCoachMissingItemSchema.array().safeParse(value);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

const parseInconsistencies = (value: unknown): CvCoachInconsistency[] => {
  const parsed = cvCoachInconsistencySchema.array().safeParse(value);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

const parseNextQuestions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 6);
};

const parseSourceEvidence = (value: unknown): CvCoachSourceEvidenceItem[] => {
  const parsed = cvCoachSourceEvidenceItemSchema.array().safeParse(value);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

const parseLockedFields = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, 500);
};

const toJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

const normalizeSession = <
  T extends {
    structuredSnapshot: unknown;
    missingItems: unknown;
    inconsistencies: unknown;
    nextQuestions: unknown;
    lockedFields?: unknown;
    sourceEvidence?: unknown;
    lastExtractedAt?: Date | null;
  },
>(
  session: T,
) => ({
  ...session,
  structuredSnapshot: parseSnapshot(session.structuredSnapshot),
  missingItems: parseMissingItems(session.missingItems),
  inconsistencies: parseInconsistencies(session.inconsistencies),
  nextQuestions: parseNextQuestions(session.nextQuestions),
  lockedFields: parseLockedFields(session.lockedFields),
  sourceEvidence: parseSourceEvidence(session.sourceEvidence),
});

const ensureOwnedProfile = async (params: {
  userId: string;
  profileId: string;
}) => {
  const profile = await prisma.userProfile.findFirst({
    where: {
      id: params.profileId,
      userId: params.userId,
    },
  });

  if (!profile) {
    throw new ApplicationError("Profil introuvable");
  }

  return profile;
};

const buildConversationPrompt = (params: {
  userMessage: string;
  goalRole: string | null;
  snapshot: CvCoachSnapshot;
  missingItems: CvCoachMissingItem[];
  inconsistencies: CvCoachInconsistency[];
  conversationHistory: { role: "USER" | "ASSISTANT"; content: string }[];
}) => {
  const history = params.conversationHistory
    .slice(-14)
    .map(
      (item) =>
        `${item.role === "USER" ? "Utilisateur" : "Coach"}: ${item.content}`,
    )
    .join("\n");
  const goalRole = params.goalRole?.trim();

  return [
    "## Objectif poste (si defini)",
    goalRole && goalRole.length > 0 ? goalRole : "non defini",
    "",
    "## Snapshot structure courant (JSON)",
    JSON.stringify(params.snapshot),
    "",
    "## Donnees manquantes (JSON)",
    JSON.stringify(params.missingItems),
    "",
    "## Incoherences detectees (JSON)",
    JSON.stringify(params.inconsistencies),
    "",
    "## Historique recent",
    history.length > 0 ? history : "Aucun historique.",
    "",
    "## Nouveau message utilisateur",
    params.userMessage,
    "",
    "Met a jour le snapshot complet, les manques, les incoherences, le score de completion, et reponds avec un message coach actionnable.",
  ].join("\n");
};

const hasUsefulSnapshotData = (snapshot: CvCoachSnapshot) => {
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

export const listCvCoachSessionsAction = authAction
  .inputSchema(listCvCoachSessionsSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const sessions = await prisma.cvLabCoachSession.findMany({
      where: {
        userId: user.id,
        ...(parsedInput.includeArchived ? {} : { archivedAt: null }),
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            headline: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
            documents: true,
          },
        },
      },
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    });

    return sessions.map((session) => normalizeSession(session));
  });

export const getCvCoachSessionAction = authAction
  .inputSchema(cvCoachSessionIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: parsedInput.sessionId,
        userId: user.id,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            headline: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    return normalizeSession(session);
  });

export const createCvCoachSessionAction = authAction
  .inputSchema(createCvCoachSessionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const requestedName = parsedInput.name?.trim();

    if (parsedInput.profileId) {
      await ensureOwnedProfile({
        userId: user.id,
        profileId: parsedInput.profileId,
      });
    }

    const session = await prisma.cvLabCoachSession.create({
      data: {
        userId: user.id,
        profileId: parsedInput.profileId ?? null,
        goalRole: parsedInput.goalRole ?? null,
        name:
          requestedName && requestedName.length > 0
            ? requestedName
            : "Session CV",
        structuredSnapshot: toJson(createEmptySnapshot()),
        missingItems: toJson([]),
        inconsistencies: toJson([]),
        nextQuestions: toJson([
          "Quel poste cibles-tu exactement (intitule + contexte) ?",
          "Peux-tu me donner ta derniere experience avec dates, entreprise et impact concret ?",
          "As-tu des chiffres (KPIs, volume, gains de temps, utilisateurs, revenus) a valoriser ?",
        ]),
        completenessScore: 8,
      },
    });

    const starterMessage = await prisma.cvLabCoachMessage.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        role: "ASSISTANT",
        content: STARTER_MESSAGE,
      },
    });

    return normalizeSession({
      ...session,
      messages: [starterMessage],
      profile: null,
    });
  });

export const sendCvCoachMessageAction = authAction
  .inputSchema(sendCvCoachMessageSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: parsedInput.sessionId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    if (session.archivedAt) {
      throw new ApplicationError("Cette session est archivee");
    }

    await prisma.cvLabCoachMessage.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        role: "USER",
        content: parsedInput.message,
      },
    });

    await checkAndIncrementAIQuota(user.id);

    const prompt = buildConversationPrompt({
      userMessage: parsedInput.message,
      goalRole: session.goalRole,
      snapshot: parseSnapshot(session.structuredSnapshot),
      missingItems: parseMissingItems(session.missingItems),
      inconsistencies: parseInconsistencies(session.inconsistencies),
      conversationHistory: session.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const response = await generateObject({
      model: AI_MODELS.smart,
      system: CV_COACH_SYSTEM_PROMPT,
      prompt,
      schema: cvCoachAssistantOutputSchema,
      temperature: 0.3,
    });

    const assistantMessage = await prisma.cvLabCoachMessage.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        role: "ASSISTANT",
        content: response.object.assistantMessage,
        meta: {
          nextQuestions: response.object.nextQuestions,
        },
      },
    });

    const targetRoleFromSnapshot =
      response.object.snapshot.identity.targetRole.trim();
    const generatedSessionName = response.object.sessionName?.trim();

    const updatedSession = await prisma.cvLabCoachSession.update({
      where: {
        id: session.id,
      },
      data: {
        name:
          generatedSessionName && generatedSessionName.length > 0
            ? generatedSessionName
            : session.name,
        goalRole:
          session.goalRole ??
          (targetRoleFromSnapshot.length > 0 ? targetRoleFromSnapshot : null),
        structuredSnapshot: toJson(response.object.snapshot),
        missingItems: toJson(response.object.missingItems),
        inconsistencies: toJson(response.object.inconsistencies),
        nextQuestions: toJson(response.object.nextQuestions),
        completenessScore: response.object.completenessScore,
        status:
          response.object.completenessScore >= 90
            ? "COMPLETED"
            : (session.status as "ACTIVE" | "COMPLETED" | "ARCHIVED"),
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            headline: true,
          },
        },
      },
    });

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        feature: "CV_COACH",
        inputTokens: response.usage.inputTokens ?? 0,
        outputTokens: response.usage.outputTokens ?? 0,
      },
    });

    return {
      session: normalizeSession(updatedSession),
      assistantMessage,
    };
  });

export const updateCvCoachSnapshotAction = authAction
  .inputSchema(updateCvCoachSnapshotSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: parsedInput.sessionId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    const updated = await prisma.cvLabCoachSession.update({
      where: {
        id: session.id,
      },
      data: {
        structuredSnapshot: toJson(parsedInput.snapshot),
        completenessScore: parsedInput.completenessScore,
        missingItems:
          parsedInput.missingItems !== undefined
            ? toJson(parsedInput.missingItems)
            : undefined,
        inconsistencies:
          parsedInput.inconsistencies !== undefined
            ? toJson(parsedInput.inconsistencies)
            : undefined,
        nextQuestions:
          parsedInput.nextQuestions !== undefined
            ? toJson(parsedInput.nextQuestions)
            : undefined,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            headline: true,
          },
        },
      },
    });

    return normalizeSession(updated);
  });

export const archiveCvCoachSessionAction = authAction
  .inputSchema(cvCoachSessionIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: parsedInput.sessionId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    await prisma.cvLabCoachSession.update({
      where: {
        id: session.id,
      },
      data: {
        archivedAt: new Date(),
        status: "ARCHIVED",
      },
    });

    return {
      success: true,
    };
  });

export const updateCvCoachLockedFieldsAction = authAction
  .inputSchema(updateCvCoachLockedFieldsSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: parsedInput.sessionId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    await prisma.cvLabCoachSession.update({
      where: { id: session.id },
      data: {
        lockedFields: toJson(parsedInput.lockedFields),
      },
    });

    return { success: true };
  });

export const applyCvCoachToProfileAction = authAction
  .inputSchema(applyCvCoachToProfileSchema)
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
        "Le dossier CV est vide. Continue d'abord la conversation avant d'appliquer.",
      );
    }

    const updatePayload = buildProfileUpdateFromCvCoach({
      snapshot,
      mode: parsedInput.mode as ProfileCoachMergeMode,
      currentProfile: profile,
    });

    const updatedProfile = await prisma.userProfile.update({
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

    await prisma.cvLabCoachSession.update({
      where: {
        id: session.id,
      },
      data: {
        profileId: updatedProfile.id,
      },
    });

    return {
      profile: updatedProfile,
      sessionId: session.id,
      profileId: updatedProfile.id,
    };
  });
