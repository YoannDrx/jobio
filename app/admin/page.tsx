import {
  LayoutActions,
  Layout,
  LayoutDescription,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  LineChart,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Prisma } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImpersonateUserButton } from "./_components/impersonate-user-button";
import { getRecentAdminAuditLogs } from "./_actions/admin-audit";

const formatInt = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value);

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

export default async function AdminPage() {
  await getRequiredAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isMissingSystemErrorTable = (error: unknown) =>
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021";

  const getSystemErrorCount = async (options?: {
    severity?: "CRITICAL";
  }): Promise<number> => {
    try {
      return await prisma.systemErrorLog.count({
        where: {
          resolvedAt: null,
          ...(options?.severity ? { severity: options.severity } : {}),
        },
      });
    } catch (error) {
      if (isMissingSystemErrorTable(error)) {
        return 0;
      }
      throw error;
    }
  };

  const [
    totalUsers,
    newUsersLast7Days,
    verifiedUsers,
    bannedUsers,
    activeSessions,
    impersonatedSessions,
    totalMissions,
    missionsLast7Days,
    totalContacts,
    pendingFollowUps,
    overdueFollowUps,
    totalNotificationsUnread,
    emailsLast30Days,
    openedEmailsLast30Days,
    totalFeedback,
    feedbackAverage,
    aiRequestsCurrentMonth,
    subscriptionsByPlan,
    subscriptionsByStatus,
    userGrowthRaw,
    recentUsers,
    usersForRanking,
    recentActivityEvents,
    recentFeedback,
    recentAdminAuditLogs,
    openSystemErrors,
    criticalSystemErrors,
    activeUsersFromEventsLast7Days,
    activeUsersFromSessionsLast7Days,
    dormantUsersCount,
    atRiskUsersCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.user.count({
      where: { emailVerified: true },
    }),
    prisma.user.count({
      where: { banned: true },
    }),
    prisma.session.count({
      where: {
        expiresAt: { gt: now },
      },
    }),
    prisma.session.count({
      where: {
        expiresAt: { gt: now },
        impersonatedBy: { not: null },
      },
    }),
    prisma.mission.count({
      where: { deletedAt: null },
    }),
    prisma.mission.count({
      where: {
        deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.contact.count({
      where: { deletedAt: null },
    }),
    prisma.followUp.count({
      where: {
        completedAt: null,
      },
    }),
    prisma.followUp.count({
      where: {
        completedAt: null,
        scheduledAt: { lt: now },
      },
    }),
    prisma.notification.count({
      where: { read: false },
    }),
    prisma.sentEmail.count({
      where: {
        isDraft: false,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.sentEmail.count({
      where: {
        isDraft: false,
        openedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.feedback.count(),
    prisma.feedback.aggregate({
      _avg: {
        review: true,
      },
    }),
    prisma.aIMonthlyQuota.aggregate({
      where: {
        month: currentMonth,
        year: currentYear,
      },
      _sum: {
        requestsUsed: true,
      },
    }),
    prisma.subscription.groupBy({
      by: ["plan"],
      _count: true,
      orderBy: {
        plan: "asc",
      },
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
      orderBy: {
        status: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        createdAt: { gte: eightWeeksAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.user.findMany({
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        banned: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      take: 200,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            missions: true,
            followUps: true,
            sentEmails: true,
            activityEvents: true,
          },
        },
      },
    }),
    prisma.activityEvent.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mission: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.feedback.findMany({
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        review: true,
        message: true,
        email: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    getRecentAdminAuditLogs(6),
    getSystemErrorCount(),
    getSystemErrorCount({ severity: "CRITICAL" }),
    prisma.activityEvent.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    prisma.session.groupBy({
      by: ["userId"],
      where: {
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          lt: fourteenDaysAgo,
        },
        missions: {
          none: {
            deletedAt: null,
          },
        },
        sessions: {
          none: {},
        },
      },
    }),
    prisma.user.count({
      where: {
        missions: {
          some: {
            deletedAt: null,
          },
        },
        activityEvents: {
          none: {
            createdAt: {
              gte: twentyOneDaysAgo,
            },
          },
        },
        sessions: {
          none: {
            updatedAt: {
              gte: twentyOneDaysAgo,
            },
          },
        },
      },
    }),
  ]);

  const paidUsers = subscriptionsByPlan.reduce(
    (sum, item) => sum + item._count,
    0,
  );
  const freeUsers = Math.max(0, totalUsers - paidUsers);
  const planDistribution = [
    { plan: "free", count: freeUsers },
    ...subscriptionsByPlan.map((item) => ({
      plan: item.plan,
      count: item._count,
    })),
  ].filter((item) => item.count > 0);

  const emailVerificationRate =
    totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
  const openRateLast30Days =
    emailsLast30Days > 0
      ? Math.round((openedEmailsLast30Days / emailsLast30Days) * 100)
      : 0;
  const activeUsersLast7Days = new Set([
    ...activeUsersFromEventsLast7Days.map((item) => item.userId),
    ...activeUsersFromSessionsLast7Days.map((item) => item.userId),
  ]).size;
  const activeUsersRate =
    totalUsers > 0 ? Math.round((activeUsersLast7Days / totalUsers) * 100) : 0;

  const weeks = Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(eightWeeksAgo);
    weekStart.setDate(weekStart.getDate() + index * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { weekStart, weekEnd };
  });

  const weeklyUserGrowth = weeks.map(({ weekStart, weekEnd }) => {
    const count = userGrowthRaw.filter(
      (item) => item.createdAt >= weekStart && item.createdAt <= weekEnd,
    ).length;
    return {
      label: formatDate(weekStart),
      count,
    };
  });

  const maxWeeklyCount = Math.max(
    ...weeklyUserGrowth.map((item) => item.count),
    1,
  );

  const topUsers = usersForRanking
    .map((user) => {
      const score =
        user._count.missions * 3 +
        user._count.followUps * 2 +
        user._count.sentEmails * 2 +
        user._count.activityEvents;
      return { ...user, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>Cockpit admin</LayoutTitle>
        <LayoutDescription>
          Vue consolidée du produit, des utilisateurs, de l&apos;activité et des
          signaux de santé système.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users">Gérer les utilisateurs</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/audit">Audit log</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/errors">Erreurs</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/ops">Ops</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/feedback">Voir les feedbacks</Link>
        </Button>
      </LayoutActions>

      <LayoutContent className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="bg-card/80 border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Utilisateurs
                <Users className="text-muted-foreground size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-semibold">
                {formatInt(totalUsers)}
              </div>
              <p className="text-muted-foreground text-xs">
                +{formatInt(newUsersLast7Days)} sur 7 jours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Sessions actives
                <UserCheck className="text-muted-foreground size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-semibold">
                {formatInt(activeSessions)}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatInt(impersonatedSessions)} en impersonation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Qualité compte
                <CheckCircle2 className="text-muted-foreground size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-semibold">
                {emailVerificationRate}%
              </div>
              <p className="text-muted-foreground text-xs">
                emails vérifiés · {formatInt(bannedUsers)} bannis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Volume produit
                <Activity className="text-muted-foreground size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-semibold">
                {formatInt(totalMissions)}
              </div>
              <p className="text-muted-foreground text-xs">
                missions · {formatInt(totalContacts)} contacts
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LineChart className="size-4" />
                Signaux de santé
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <MetricBadge
                label="Relances en retard"
                value={overdueFollowUps}
                tone={overdueFollowUps > 0 ? "danger" : "ok"}
              />
              <MetricBadge
                label="Relances en attente"
                value={pendingFollowUps}
                tone="neutral"
              />
              <MetricBadge
                label="Notifications non lues"
                value={totalNotificationsUnread}
                tone={totalNotificationsUnread > 50 ? "warning" : "neutral"}
              />
              <MetricBadge
                label="Missions créées (7j)"
                value={missionsLast7Days}
                tone="ok"
              />
              <MetricBadge
                label="Emails envoyés (30j)"
                value={emailsLast30Days}
                tone="neutral"
              />
              <MetricBadge
                label="Taux d'ouverture email (30j)"
                value={openRateLast30Days}
                suffix="%"
                tone={openRateLast30Days >= 35 ? "ok" : "warning"}
              />
              <MetricBadge
                label="Usage IA (mois en cours)"
                value={aiRequestsCurrentMonth._sum.requestsUsed ?? 0}
                tone="neutral"
              />
              <MetricBadge
                label="Score feedback moyen"
                value={Math.round((feedbackAverage._avg.review ?? 0) * 10) / 10}
                suffix="/5"
                tone={
                  (feedbackAverage._avg.review ?? 0) >= 4 ? "ok" : "warning"
                }
              />
              <MetricBadge
                label="Erreurs système ouvertes"
                value={openSystemErrors}
                tone={openSystemErrors > 0 ? "warning" : "ok"}
              />
              <MetricBadge
                label="Erreurs critiques ouvertes"
                value={criticalSystemErrors}
                tone={criticalSystemErrors > 0 ? "danger" : "ok"}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Santé utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">
                  Utilisateurs actifs (7 jours)
                </p>
                <p className="text-xl font-semibold">
                  {formatInt(activeUsersLast7Days)}{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    ({activeUsersRate}%)
                  </span>
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">
                  Utilisateurs à risque (inactifs &gt; 21 jours)
                </p>
                <p className="text-xl font-semibold">
                  {formatInt(atRiskUsersCount)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">
                  Comptes dormants (&gt; 14 jours, aucun usage)
                </p>
                <p className="text-xl font-semibold">
                  {formatInt(dormantUsersCount)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/users?status=active">Voir actifs</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/users?status=unverified">
                    Voir non vérifiés
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Répartition des plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {planDistribution.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucune donnée de plan disponible.
                </p>
              ) : (
                planDistribution.map((item) => {
                  const ratio =
                    totalUsers > 0
                      ? Math.round((item.count / totalUsers) * 100)
                      : 0;
                  return (
                    <div key={item.plan} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">
                          {item.plan}
                        </span>
                        <span className="text-muted-foreground">
                          {formatInt(item.count)} ({ratio}%)
                        </span>
                      </div>
                      <Progress value={ratio} className="h-2" />
                    </div>
                  );
                })
              )}
              <div className="pt-2">
                <p className="text-muted-foreground text-xs">
                  Statuts d&apos;abonnement:{" "}
                  {subscriptionsByStatus
                    .map(
                      (status) =>
                        `${status.status ?? "unknown"} (${status._count})`,
                    )
                    .join(" · ")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="size-4" />
                Croissance utilisateurs (8 semaines)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyUserGrowth.map((week) => {
                const width = Math.max(
                  5,
                  Math.round((week.count / maxWeeklyCount) * 100),
                );
                return (
                  <div key={week.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {week.label}
                      </span>
                      <span className="font-medium">
                        {formatInt(week.count)}
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4" />
                Derniers feedbacks ({formatInt(totalFeedback)})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentFeedback.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucun feedback pour le moment.
                </p>
              ) : (
                recentFeedback.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.user?.name ??
                            item.user?.email ??
                            item.email ??
                            "Anonyme"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">{item.review}/5</Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/80 border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Top utilisateurs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Score activité</TableHead>
                  <TableHead>Missions</TableHead>
                  <TableHead>Relances</TableHead>
                  <TableHead>Emails</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="hover:text-primary truncate font-medium transition-colors"
                        >
                          {user.name || user.email}
                        </Link>
                        <span className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatInt(user.score)}</TableCell>
                    <TableCell>{formatInt(user._count.missions)}</TableCell>
                    <TableCell>{formatInt(user._count.followUps)}</TableCell>
                    <TableCell>{formatInt(user._count.sentEmails)}</TableCell>
                    <TableCell className="flex gap-2">
                      <ImpersonateUserButton
                        userId={user.id}
                        userEmail={user.email}
                      />
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/users/${user.id}`}>Ouvrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Nouveaux utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.name || "Sans nom"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.role === "admin" && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                          {user.emailVerified ? (
                            <Badge variant="outline">Vérifié</Badge>
                          ) : (
                            <Badge variant="outline">Non vérifié</Badge>
                          )}
                          {user.banned ? (
                            <Badge variant="destructive">Banni</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="flex gap-2">
                        <ImpersonateUserButton
                          userId={user.id}
                          userEmail={user.email}
                        />
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/users/${user.id}`}>Détail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4" />
                Audit log récent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentAdminAuditLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucune action d&apos;audit récente.
                </p>
              ) : (
                recentAdminAuditLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[11px]">
                        {log.action}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-medium">
                      {log.actorEmail}
                    </p>
                    <p className="text-muted-foreground line-clamp-1 text-xs">
                      cible: {log.targetEmail ?? log.targetUserId ?? "-"}
                    </p>
                  </div>
                ))
              )}
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/admin/audit">Voir tout l&apos;audit log</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivityEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucune activité récente.
                </p>
              ) : (
                recentActivityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="hover:bg-muted/40 rounded-lg border p-3 transition-colors"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {event.user.name || event.user.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(event.createdAt)}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {event.description ?? event.type}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">
                        {event.type}
                      </Badge>
                      <Link
                        href={`/admin/users/${event.user.id}`}
                        className="text-primary text-xs hover:underline"
                      >
                        Voir l&apos;utilisateur
                      </Link>
                      <Link
                        href={`/app/pipeline?missionId=${event.mission.id}`}
                        className="text-primary text-xs hover:underline"
                      >
                        Mission: {event.mission.title}
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/80 border-border/70">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              {overdueFollowUps > 0 ? (
                <AlertTriangle className="size-4 text-amber-500" />
              ) : (
                <Sparkles className="size-4 text-emerald-500" />
              )}
              <p className="text-sm">
                {overdueFollowUps > 0
                  ? `${formatInt(overdueFollowUps)} relances en retard à surveiller.`
                  : "Aucune alerte critique sur les relances en cours."}
              </p>
            </div>
            {bannedUsers > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <ShieldAlert className="size-4 text-rose-500" />
                <span>{formatInt(bannedUsers)} compte(s) banni(s)</span>
              </div>
            ) : null}
            {openSystemErrors > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4 text-amber-500" />
                <Link href="/admin/errors" className="hover:underline">
                  {formatInt(openSystemErrors)} erreur(s) système ouverte(s)
                </Link>
              </div>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Dernière mise à jour: {formatDateTime(now)}
            </p>
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}

function MetricBadge({
  label,
  value,
  suffix,
  tone = "neutral",
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "ok" | "warning" | "danger" | "neutral";
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold">
        {formatInt(value)}
        {suffix ? ` ${suffix}` : ""}
      </p>
      <div className="mt-2">
        {tone === "ok" ? (
          <Badge variant="outline" className="text-emerald-600">
            OK
          </Badge>
        ) : null}
        {tone === "warning" ? (
          <Badge variant="outline" className="text-amber-600">
            À surveiller
          </Badge>
        ) : null}
        {tone === "danger" ? (
          <Badge variant="destructive">Critique</Badge>
        ) : null}
        {tone === "neutral" ? <Badge variant="secondary">Info</Badge> : null}
      </div>
    </div>
  );
}
