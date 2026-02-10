import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import TrialDay3Email from "@email/trial-day3.email";
import TrialReminderEmail from "@email/trial-reminder.email";
import TrialDay12Email from "@email/trial-day12.email";
import { NextResponse } from "next/server";

type DripConfig = {
  daysAgo: number;
  sendFn: (user: {
    email: string;
    name: string | null;
    id: string;
  }) => Promise<void>;
};

const DRIP_SCHEDULE: DripConfig[] = [
  {
    daysAgo: 3,
    sendFn: async (user) => {
      await sendEmail({
        to: user.email,
        subject: `3 astuces pour booster ta prospection ${SiteConfig.title}`,
        html: TrialDay3Email({ name: user.name ?? "Freelance" }),
      });
    },
  },
  {
    daysAgo: 7,
    sendFn: async (user) => {
      const [missionsCount, followUpsCount] = await Promise.all([
        prisma.mission.count({ where: { userId: user.id, deletedAt: null } }),
        prisma.followUp.count({
          where: { userId: user.id, completedAt: { not: null } },
        }),
      ]);
      await sendEmail({
        to: user.email,
        subject: `Une semaine avec ${SiteConfig.title} !`,
        html: TrialReminderEmail({
          name: user.name ?? "Freelance",
          missionsCount,
          followUpsCount,
        }),
      });
    },
  },
  {
    daysAgo: 12,
    sendFn: async (user) => {
      const missionsCount = await prisma.mission.count({
        where: { userId: user.id, deletedAt: null },
      });
      await sendEmail({
        to: user.email,
        subject: `Plus que 2 jours d'essai ${SiteConfig.title}`,
        html: TrialDay12Email({
          name: user.name ?? "Freelance",
          missionsCount,
        }),
      });
    },
  },
];

export const GET = route.handler(async (req) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.all(
    DRIP_SCHEDULE.map(async (config) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - config.daysAgo);

      const startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );
      const endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
        999,
      );

      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: "trialing",
          periodStart: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const users = await Promise.all(
        subscriptions.map(async (sub) =>
          prisma.user.findFirst({ where: { id: sub.referenceId } }),
        ),
      );

      const validUsers = users.filter(
        (user): user is Exclude<typeof user, null> => user !== null,
      );

      await Promise.all(validUsers.map(async (user) => config.sendFn(user)));
      return validUsers.length;
    }),
  );

  const totalSent = results.reduce((sum, count) => sum + count, 0);

  return NextResponse.json({ sent: totalSent });
});
