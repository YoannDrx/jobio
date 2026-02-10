import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
} from "@/features/page/layout";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { TodayContent } from "@/features/missions/components/today/today-content";

export default async function TodayPage() {
  const user = await getRequiredUser();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  // Calculate week boundaries (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
  const endOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    diffToMonday + 6,
    23,
    59,
    59,
    999,
  );

  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    recentMissions,
    statusCounts,
    overdueFollowUps,
    todayFollowUps,
    staleMissions,
    missionsAddedThisWeek,
    followUpsCompletedThisWeek,
  ] = await Promise.all([
    prisma.mission.findMany({
      where: { userId: user.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        score: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.mission.groupBy({
      by: ["status"],
      where: { userId: user.id, deletedAt: null },
      _count: true,
    }),
    prisma.followUp.findMany({
      where: {
        userId: user.id,
        scheduledAt: { lt: now },
        completedAt: null,
      },
      include: {
        mission: {
          select: {
            title: true,
            company: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.followUp.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        completedAt: null,
      },
      include: {
        mission: {
          select: {
            title: true,
            company: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.mission.findMany({
      where: {
        userId: user.id,
        status: {
          notIn: ["ACCEPTE", "REFUSE", "ARCHIVE"],
        },
        updatedAt: { lt: twoWeeksAgo },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.mission.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        deletedAt: null,
      },
    }),
    prisma.followUp.count({
      where: {
        userId: user.id,
        completedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    }),
  ]);

  const counters = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count]),
  );
  const totalMissions = statusCounts.reduce((acc, s) => acc + s._count, 0);

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const formattedDate = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>
          {greeting} {user.name.split(" ")[0]}
        </LayoutTitle>
        <LayoutDescription className="capitalize">
          {formattedDate}
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <TodayContent
          recentMissions={recentMissions.map((m) => ({
            id: m.id,
            title: m.title,
            company: m.company,
            status: m.status as
              | "A_POSTULER"
              | "POSTULE"
              | "ENTRETIEN"
              | "PROPOSITION"
              | "ACCEPTE"
              | "REFUSE"
              | "ARCHIVE",
            score: m.score,
            createdAt: m.createdAt.toISOString(),
          }))}
          counters={counters}
          totalMissions={totalMissions}
          overdueFollowUps={overdueFollowUps.map((f) => ({
            id: f.id,
            title: f.title,
            type: f.type,
            scheduledAt: f.scheduledAt.toISOString(),
            mission: {
              title: f.mission.title,
              company: f.mission.company,
              status: f.mission.status,
            },
          }))}
          todayFollowUps={todayFollowUps.map((f) => ({
            id: f.id,
            title: f.title,
            type: f.type,
            scheduledAt: f.scheduledAt.toISOString(),
            mission: {
              title: f.mission.title,
              company: f.mission.company,
              status: f.mission.status,
            },
          }))}
          staleMissions={staleMissions.map((m) => ({
            id: m.id,
            title: m.title,
            company: m.company,
            status: m.status,
            updatedAt: m.updatedAt.toISOString(),
          }))}
          weekStats={{
            missionsAdded: missionsAddedThisWeek,
            followUpsCompleted: followUpsCompletedThisWeek,
          }}
        />
      </LayoutContent>
    </Layout>
  );
}
