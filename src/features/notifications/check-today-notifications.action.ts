"use server";

import { z } from "zod";
import { authAction } from "@/lib/actions/safe-actions";
import { createNotification } from "@/features/notifications/create-notification";

const overdueFollowUpSchema = z.object({
  id: z.string(),
  title: z.string(),
  missionId: z.string(),
  missionTitle: z.string(),
});

const staleMissionSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const dueSoonFollowUpSchema = z.object({
  id: z.string(),
  title: z.string(),
  missionId: z.string(),
  missionTitle: z.string(),
});

const inputSchema = z.object({
  overdueFollowUps: z.array(overdueFollowUpSchema),
  staleMissions: z.array(staleMissionSchema),
  dueSoonFollowUps: z.array(dueSoonFollowUpSchema),
});

export const checkTodayNotificationsAction = authAction
  .schema(inputSchema)
  .action(
    async ({
      parsedInput: { overdueFollowUps, staleMissions, dueSoonFollowUps },
      ctx: { user },
    }) => {
      await Promise.allSettled([
        ...overdueFollowUps.slice(0, 3).map(async (followUp) =>
          createNotification({
            userId: user.id,
            type: "FOLLOW_UP_OVERDUE",
            title: `Relance en retard: ${followUp.title}`,
            message: `Mission "${followUp.missionTitle}" nécessite une action immédiate`,
            link: `/app/pipeline?missionId=${followUp.missionId}`,
            metadata: {
              followUpId: followUp.id,
              missionId: followUp.missionId,
              missionTitle: followUp.missionTitle,
            },
            dedupeHours: 12,
          }),
        ),
        ...staleMissions.slice(0, 3).map(async (mission) =>
          createNotification({
            userId: user.id,
            type: "MISSION_STALE",
            title: `Mission stale: ${mission.title}`,
            message:
              "Aucune action récente. Planifie une relance ou archive la mission.",
            link: `/app/pipeline?missionId=${mission.id}`,
            metadata: { missionId: mission.id },
            dedupeHours: 24,
          }),
        ),
        ...dueSoonFollowUps.slice(0, 2).map(async (followUp) =>
          createNotification({
            userId: user.id,
            type: "FOLLOW_UP_DUE",
            title: `Relance à faire bientôt: ${followUp.title}`,
            message: `Prévue aujourd'hui sur "${followUp.missionTitle}"`,
            link: `/app/pipeline?missionId=${followUp.missionId}`,
            metadata: {
              followUpId: followUp.id,
              missionId: followUp.missionId,
              missionTitle: followUp.missionTitle,
            },
            dedupeHours: 6,
          }),
        ),
      ]);

      return { ok: true };
    },
  );
