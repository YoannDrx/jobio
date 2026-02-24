import { prisma } from "@/lib/prisma";
import { checkPlanFeature } from "@/lib/plan-limits";
import type { MissionStatus, FollowUpType } from "@/generated/prisma";

type SequenceStep = {
  delayDays: number;
  followUpType: FollowUpType;
  title: string;
  description?: string;
  templateId?: string;
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
  });

  if (!mission) return [];

  const now = new Date();

  const createdFollowUps = await Promise.all(
    rules.map(async (rule) => {
      const scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + rule.delayDays);

      const followUp = await prisma.followUp.create({
        data: {
          missionId,
          userId,
          type: rule.followUpType,
          title: `[Auto] ${rule.name}`,
          scheduledAt,
          templateId: rule.templateId,
        },
      });

      await prisma.activityEvent.create({
        data: {
          missionId,
          userId,
          type: "FOLLOW_UP_CREATED",
          description: `Relance auto "${rule.name}" planifiée (règle: ${rule.name})`,
        },
      });

      return followUp;
    }),
  );

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
  });

  if (!mission) return [];

  const steps = sequence.steps as SequenceStep[];
  if (!Array.isArray(steps) || steps.length === 0) return [];

  const now = new Date();

  const createdFollowUps = await Promise.all(
    steps.map(async (step) => {
      const scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + step.delayDays);

      const followUp = await prisma.followUp.create({
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

      await prisma.activityEvent.create({
        data: {
          missionId,
          userId,
          type: "FOLLOW_UP_CREATED",
          description: `Relance "${step.title}" planifiée (séquence: ${sequence.name})`,
        },
      });

      return followUp;
    }),
  );

  return createdFollowUps;
}
