import { prisma } from "@/lib/prisma";
import { checkPlanFeature } from "@/lib/plan-limits";
import type { FollowUp, FollowUpType, MissionStatus } from "@/generated/prisma";
import {
  evaluateFollowUpPolicy,
  type FollowUpPolicyReason,
} from "./follow-up-policy";

type SequenceStep = {
  delayDays: number;
  followUpType: FollowUpType;
  title: string;
  description?: string;
  templateId?: string;
};

type AutomatedMissionContext = {
  id: string;
  status: MissionStatus;
  contactId: string | null;
  contact: { tags: string[]; deletedAt: Date | null } | null;
};

const getAutomatedFollowUpBlockReason = async (params: {
  userId: string;
  mission: AutomatedMissionContext;
  scheduledAt: Date;
}): Promise<FollowUpPolicyReason | null> => {
  const windowStart = new Date(
    params.scheduledAt.getTime() - 24 * 60 * 60 * 1000,
  );
  const windowEnd = new Date(
    params.scheduledAt.getTime() + 24 * 60 * 60 * 1000,
  );
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [pendingNearTarget, recentSentEmails, recentCompletedFollowUps] =
    await Promise.all([
      prisma.followUp.count({
        where: {
          userId: params.userId,
          missionId: params.mission.id,
          completedAt: null,
          scheduledAt: { gte: windowStart, lte: windowEnd },
        },
      }),
      params.mission.contactId
        ? prisma.sentEmail.count({
            where: {
              userId: params.userId,
              contactId: params.mission.contactId,
              isDraft: false,
              OR: [
                { sentAt: { gte: sevenDaysAgo } },
                { sentAt: null, createdAt: { gte: sevenDaysAgo } },
              ],
            },
          })
        : Promise.resolve(0),
      params.mission.contactId
        ? prisma.followUp.count({
            where: {
              userId: params.userId,
              completedAt: { gte: sevenDaysAgo },
              mission: { contactId: params.mission.contactId },
            },
          })
        : Promise.resolve(0),
    ]);

  return evaluateFollowUpPolicy({
    missionStatus: params.mission.status,
    isAutomated: true,
    contactTags:
      params.mission.contact?.deletedAt === null
        ? params.mission.contact.tags
        : params.mission.contact
          ? ["do-not-contact"]
          : [],
    pendingNearTarget,
    recentContactTouches: recentSentEmails + recentCompletedFollowUps,
  });
};

export async function executeFollowUpRules(
  userId: string,
  missionId: string,
  newStatus: MissionStatus,
) {
  const hasAutoFollowUps = await checkPlanFeature(userId, "autoFollowUps");
  if (!hasAutoFollowUps) return [];

  const rules = await prisma.followUpRule.findMany({
    where: {
      userId,
      missionStatus: newStatus,
      isActive: true,
    },
    include: {
      template: { select: { id: true, name: true } },
    },
  });

  if (rules.length === 0) return [];

  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId, deletedAt: null },
    include: {
      contact: { select: { tags: true, deletedAt: true } },
    },
  });

  if (!mission) return [];

  const now = new Date();

  const createdFollowUps: FollowUp[] = [];
  for (const rule of rules) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + rule.delayDays);
    // Sequential by design: each created follow-up must affect the next policy check.
    // eslint-disable-next-line no-await-in-loop
    const blockReason = await getAutomatedFollowUpBlockReason({
      userId,
      mission,
      scheduledAt,
    });
    if (blockReason) continue;

    // eslint-disable-next-line no-await-in-loop
    const followUp = await prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          missionId,
          userId,
          type: rule.followUpType,
          title: `[Auto] ${rule.name}`,
          scheduledAt,
          templateId: rule.templateId,
        },
      });

      await tx.activityEvent.create({
        data: {
          missionId,
          userId,
          type: "FOLLOW_UP_CREATED",
          description: `Relance auto "${rule.name}" planifiée (règle: ${rule.name})`,
        },
      });
      return created;
    });
    createdFollowUps.push(followUp);
  }

  return createdFollowUps;
}

export async function executeSequence(
  userId: string,
  missionId: string,
  sequenceId: string,
) {
  const sequence = await prisma.sequence.findFirst({
    where: { id: sequenceId, userId },
  });

  if (!sequence) return [];

  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId, deletedAt: null },
    include: {
      contact: { select: { tags: true, deletedAt: true } },
    },
  });

  if (!mission) return [];

  const steps = sequence.steps as SequenceStep[];
  if (!Array.isArray(steps) || steps.length === 0) return [];

  const now = new Date();

  const createdFollowUps: FollowUp[] = [];
  for (const step of steps) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + step.delayDays);
    // Sequential by design: each created follow-up must affect the next policy check.
    // eslint-disable-next-line no-await-in-loop
    const blockReason = await getAutomatedFollowUpBlockReason({
      userId,
      mission,
      scheduledAt,
    });
    if (blockReason) continue;

    // eslint-disable-next-line no-await-in-loop
    const followUp = await prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          missionId,
          userId,
          type: step.followUpType,
          title: step.title,
          description: step.description,
          scheduledAt,
          templateId: step.templateId,
        },
      });

      await tx.activityEvent.create({
        data: {
          missionId,
          userId,
          type: "FOLLOW_UP_CREATED",
          description: `Relance "${step.title}" planifiée (séquence: ${sequence.name})`,
        },
      });
      return created;
    });
    createdFollowUps.push(followUp);
  }

  return createdFollowUps;
}
