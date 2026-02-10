import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import TrialEndingEmail from "@email/trial-ending.email";
import { NextResponse } from "next/server";

export const GET = route.handler(async (req) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Trouver les subscriptions dont le trial expire dans ~24h
  // periodStart + 14 jours (trial) = expiration
  // On cherche les subs dont periodStart date d'il y a 13 jours
  const thirteenDaysAgo = new Date();
  thirteenDaysAgo.setDate(thirteenDaysAgo.getDate() - 13);

  const startOfDay = new Date(
    thirteenDaysAgo.getFullYear(),
    thirteenDaysAgo.getMonth(),
    thirteenDaysAgo.getDate(),
  );
  const endOfDay = new Date(
    thirteenDaysAgo.getFullYear(),
    thirteenDaysAgo.getMonth(),
    thirteenDaysAgo.getDate(),
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

  const results = await Promise.all(
    validUsers.map(async (user) =>
      sendEmail({
        to: user.email,
        subject: `Ton essai ${SiteConfig.title} se termine demain`,
        html: TrialEndingEmail({
          name: user.name || "Freelance",
          daysLeft: 1,
        }),
      }),
    ),
  );

  return NextResponse.json({ sent: results.length });
});
