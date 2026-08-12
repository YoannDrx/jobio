import { Typography } from "@/components/nowts/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Activity, Target, TrendingUp, Users } from "lucide-react";

const percent = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

export async function AnalyticsDashboard() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    activatedUsers,
    weeklyActiveRows,
    monthlyActiveRows,
    activeSubscriptions,
    missions,
    followUps,
    contacts,
    cvDocuments,
    invoices,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.mission.groupBy({
      by: ["userId"],
      where: { deletedAt: null },
    }),
    prisma.activityEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.activityEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.subscription.count({
      where: { status: { in: ["active", "trialing"] } },
    }),
    prisma.mission.count({ where: { deletedAt: null } }),
    prisma.followUp.count(),
    prisma.contact.count({ where: { deletedAt: null } }),
    prisma.cvLabDocument.count({ where: { archivedAt: null } }),
    prisma.billingInvoice.count({ where: { deletedAt: null } }),
  ]);

  const metrics = {
    newUsers7d,
    newUsers30d,
    activationRate: percent(activatedUsers.length, totalUsers),
    wau: weeklyActiveRows.length,
    mau: monthlyActiveRows.length,
    paidShare: percent(activeSubscriptions, totalUsers),
    topFeatures: [
      { name: "Missions actives ou archivées", count: missions },
      { name: "Relances créées", count: followUps },
      { name: "Contacts actifs", count: contacts },
      { name: "Documents CV actifs", count: cvDocuments },
      { name: "Factures non supprimées", count: invoices },
    ].sort((a, b) => b.count - a.count),
  };
  const topCount = Math.max(metrics.topFeatures[0]?.count ?? 0, 1);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Typography variant="h2">Analytics Produit</Typography>
        <Typography variant="muted">
          Comptages issus de PostgreSQL, calculés au chargement de la page.
        </Typography>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Nouveaux utilisateurs (7j)"
          value={metrics.newUsers7d}
          detail={`${metrics.newUsers30d} sur 30 jours`}
          icon={Users}
        />
        <MetricCard
          label="Activation observée"
          value={`${metrics.activationRate}%`}
          detail="Utilisateurs avec au moins une mission"
          icon={Target}
        />
        <MetricCard
          label="WAU / MAU observés"
          value={`${metrics.wau} / ${metrics.mau}`}
          detail={`${percent(metrics.wau, metrics.mau)}% des actifs mensuels`}
          icon={Activity}
        />
        <MetricCard
          label="Part actuellement payante"
          value={`${metrics.paidShare}%`}
          detail="Abonnements actifs ou en essai / comptes"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volumes métier</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {metrics.topFeatures.map((feature, index) => (
            <div key={feature.name} className="flex items-center gap-4">
              <Typography variant="muted" className="w-8">
                #{index + 1}
              </Typography>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span>{feature.name}</span>
                  <span className="font-medium">{feature.count}</span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(feature.count / topCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="text-muted-foreground size-4" aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <Typography variant="h3">{value}</Typography>
        <Typography variant="muted">{detail}</Typography>
      </CardContent>
    </Card>
  );
}
