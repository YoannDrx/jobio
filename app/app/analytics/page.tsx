"use client";

import { Card } from "@/components/ui/card";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { ActivityGraph } from "@/features/analytics/components/activity-graph";
import { FunnelChart } from "@/features/analytics/components/funnel-chart";
import { PlatformPerformance } from "@/features/analytics/components/platform-performance";
import { TJMComparison } from "@/features/analytics/components/tjm-comparison";
import {
  getAnalyticsLimitsAction,
  getAverageTJMAction,
  getEarningsDataAction,
  getFunnelDataAction,
  getResponseRateByPlatformAction,
  getWeeklyActivityAction,
  getWinRateByPlatformAction,
  getRevenueForecastAction,
  getTimeToHireAction,
  getComparisonDataAction,
} from "@/features/analytics/analytics.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { BarChart3, Calendar, Euro, Info, TrendingUp } from "lucide-react";
import { EarningsDashboard } from "@/features/analytics/components/earnings-dashboard";
import { RevenueForecast } from "@/features/analytics/components/revenue-forecast";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/nowts/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { MISSION_STATUS_LABELS } from "@/features/missions/mission-status";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FunnelData = { status: string; count: number }[];
type PlatformData = {
  platform: string;
  total: number;
  responded: number;
  rate: number;
}[];
type TJMData = { status: string; avgTjm: number }[];
type ActivityData = { week: string; missions: number; followUps: number }[];
type EarningsData = {
  totalAccepted: number;
  avgTjm: number;
  totalEstimatedRevenue: number;
  monthlyProjection: number;
};
type WinRateByPlatformData = {
  platform: string;
  total: number;
  accepted: number;
  winRate: number;
  avgTjm: number;
}[];
type RevenueForecastData = {
  status: string;
  count: number;
  totalValue: number;
  probability: number;
  weightedValue: number;
}[];
type TimeToHireData = {
  avgDays: number;
  minDays: number;
  maxDays: number;
  count: number;
};
type ComparisonMetricsData = {
  totalMissions: number;
  conversionRate: number;
  avgTjm: number;
  followUpsCompleted: number;
};
type ComparisonData = {
  current: ComparisonMetricsData;
  previous: ComparisonMetricsData;
  deltas: {
    missions: number;
    conversionRate: number;
    avgTjm: number;
    followUps: number;
  };
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  ultra: "Ultra",
};

export default function AnalyticsPage() {
  const [funnelData, setFunnelData] = useState<FunnelData>([]);
  const [platformData, setPlatformData] = useState<PlatformData>([]);
  const [tjmData, setTJMData] = useState<TJMData>([]);
  const [activityData, setActivityData] = useState<ActivityData>([]);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [winRateData, setWinRateData] = useState<WinRateByPlatformData>([]);
  const [revenueForecastData, setRevenueForecastData] = useState<{
    byStatus: RevenueForecastData;
    totalPipeline: number;
    weightedPipeline: number;
  } | null>(null);
  const [timeToHireData, setTimeToHireData] = useState<TimeToHireData | null>(
    null,
  );
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null,
  );
  const [showComparison, setShowComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [historyDays, setHistoryDays] = useState(7);
  const [planName, setPlanName] = useState("free");
  const [limitsLoaded, setLimitsLoaded] = useState(false);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const limits = await resolveActionResult(getAnalyticsLimitsAction());
        setHistoryDays(limits.analyticsHistoryDays);
        setPlanName(limits.planName);

        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - limits.analyticsHistoryDays);

        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
        setLimitsLoaded(true);
      } catch {
        toast.error("Erreur lors du chargement des limites du plan");
        setIsLoading(false);
      }
    };

    void fetchLimits();
  }, []);

  const fetchAnalytics = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const params = { startDate: start, endDate: end };
      const [
        funnel,
        platform,
        tjm,
        activity,
        earnings,
        winRate,
        revenueForecast,
        timeToHire,
        comparison,
      ] = await Promise.all([
        resolveActionResult(getFunnelDataAction(params)),
        resolveActionResult(getResponseRateByPlatformAction(params)),
        resolveActionResult(getAverageTJMAction(params)),
        resolveActionResult(getWeeklyActivityAction(params)),
        resolveActionResult(getEarningsDataAction(params)),
        resolveActionResult(getWinRateByPlatformAction(params)),
        resolveActionResult(getRevenueForecastAction(params)),
        resolveActionResult(getTimeToHireAction(params)),
        resolveActionResult(
          getComparisonDataAction({ startDate: start, endDate: end }),
        ),
      ]);

      const totalMissions = (funnel as FunnelData).reduce(
        (sum, item) => sum + item.count,
        0,
      );
      if (totalMissions === 0) {
        setHasData(false);
      } else {
        setHasData(true);
        setFunnelData(funnel as FunnelData);
        setPlatformData(platform as PlatformData);
        setTJMData(tjm as TJMData);
        setActivityData(activity as ActivityData);
        setEarningsData(earnings as EarningsData);
        setWinRateData(winRate as WinRateByPlatformData);
        setRevenueForecastData(revenueForecast as typeof revenueForecastData);
        setTimeToHireData(timeToHire as TimeToHireData);
        setComparisonData(comparison as ComparisonData);
      }
    } catch {
      toast.error("Erreur lors du chargement des analytics");
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (limitsLoaded && startDate && endDate) {
      void fetchAnalytics(startDate, endDate);
    }
  }, [limitsLoaded, startDate, endDate, fetchAnalytics]);

  const minDate = formatDate(
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - historyDays);
      return d;
    })(),
  );
  const maxDate = formatDate(new Date());

  const handleStartDateChange = (value: string) => {
    if (value < minDate) {
      setStartDate(minDate);
    } else if (value > endDate) {
      setStartDate(endDate);
    } else {
      setStartDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    if (value > maxDate) {
      setEndDate(maxDate);
    } else if (value < startDate) {
      setEndDate(startDate);
    } else {
      setEndDate(value);
    }
  };

  const isLimitedPlan = historyDays < 999999;

  if (isLoading && !limitsLoaded) {
    return (
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Analytics</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </LayoutContent>
      </Layout>
    );
  }

  if (!hasData && !isLoading) {
    return (
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Analytics</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <EmptyState
            icon={BarChart3}
            title="Pas encore assez de données"
            description="Ajoutez des missions pour voir vos statistiques."
            action={{
              label: "Créer une mission",
              onClick: () => {
                window.location.href = "/app/pipeline";
              },
            }}
          />
        </LayoutContent>
      </Layout>
    );
  }

  const totalMissions = funnelData.reduce((sum, item) => sum + item.count, 0);
  const acceptedCount =
    funnelData.find((item) => item.status === "ACCEPTE")?.count ?? 0;
  const conversionRate =
    totalMissions > 0 ? Math.round((acceptedCount / totalMissions) * 100) : 0;
  const avgAcceptedTjm =
    tjmData.find((item) => item.status === "ACCEPTE")?.avgTjm ?? 0;
  const weeklyFollowUps =
    activityData.length > 0
      ? activityData[activityData.length - 1].followUps
      : 0;

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Analytics</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="size-4" />
              <span className="hidden sm:inline">
                {startDate && endDate
                  ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
                  : "Période"}
              </span>
              <span className="sm:hidden">Période</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Période d&apos;analyse</p>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Du</span>
                  <Input
                    type="date"
                    value={startDate}
                    min={minDate}
                    max={endDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="h-9"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Au</span>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={maxDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="h-9"
                  />
                </label>
              </div>
              {isLimitedPlan ? (
                <div className="bg-muted flex items-start gap-2 rounded-md p-2">
                  <Info className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    Historique limité à {historyDays} jours (plan{" "}
                    {PLAN_LABELS[planName] ?? planName}).{" "}
                    <Link
                      href="/app/account/billing"
                      className="text-primary underline"
                    >
                      Changer de plan
                    </Link>
                  </p>
                </div>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </LayoutActions>
      <LayoutContent>
        {isLoading ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* KPI Summary */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Total missions
                </p>
                <p className="mt-1 text-2xl font-bold">{totalMissions}</p>
              </Card>
              <Card className="p-4">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Taux de conversion
                </p>
                <p className="mt-1 text-2xl font-bold text-brand-cyan">
                  {conversionRate}%
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  TJM moyen accepté
                </p>
                <p className="mt-1 text-2xl font-bold">{avgAcceptedTjm}€/j</p>
              </Card>
              <Card className="p-4">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Relances cette semaine
                </p>
                <p className="mt-1 text-2xl font-bold">{weeklyFollowUps}</p>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-cyan" />
                  <h3 className="font-semibold">Entonnoir de conversion</h3>
                </div>
                <FunnelChart
                  data={funnelData.map((item) => ({
                    ...item,
                    label:
                      MISSION_STATUS_LABELS[
                        item.status as keyof typeof MISSION_STATUS_LABELS
                      ],
                  }))}
                />
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold">Performance par plateforme</h3>
                </div>
                {platformData.length > 0 ? (
                  <PlatformPerformance data={platformData} />
                ) : (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    Aucune plateforme ajoutée
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-cyan" />
                  <h3 className="font-semibold">TJM moyen</h3>
                </div>
                {tjmData.length > 0 ? (
                  <TJMComparison
                    data={tjmData.map((item) => ({
                      ...item,
                      label:
                        MISSION_STATUS_LABELS[
                          item.status as keyof typeof MISSION_STATUS_LABELS
                        ],
                    }))}
                  />
                ) : (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    Aucun TJM enregistré
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold">Activité hebdomadaire</h3>
                </div>
                {activityData.length > 0 ? (
                  <ActivityGraph data={activityData} />
                ) : (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    Aucune activité
                  </div>
                )}
              </Card>
            </div>

            {/* Earnings Section */}
            {earningsData && earningsData.totalAccepted > 0 && (
              <div className="mt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Euro className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold">Revenus</h3>
                </div>
                <EarningsDashboard data={earningsData} />
              </div>
            )}

            {/* Win Rate by Platform Section */}
            {winRateData.length > 0 && (
              <div className="mt-6">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold">
                    Performance par plateforme
                  </h3>
                </div>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-border bg-muted/30 border-b">
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Plateforme
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">
                            Missions
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">
                            Win rate
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">
                            TJM moyen
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {winRateData.map((row) => (
                          <tr
                            key={row.platform}
                            className="border-border border-b last:border-0"
                          >
                            <td className="px-4 py-3 text-sm font-medium">
                              {row.platform}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {row.total}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-brand-cyan">
                              {row.winRate}%
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {row.avgTjm}€/j
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Revenue Forecast Section */}
            {revenueForecastData && revenueForecastData.byStatus.length > 0 && (
              <div className="mt-6">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-cyan" />
                  <h3 className="text-lg font-semibold">
                    Revenue prévisionnelle
                  </h3>
                </div>
                <RevenueForecast
                  data={revenueForecastData.byStatus}
                  totalPipeline={revenueForecastData.totalPipeline}
                  weightedPipeline={revenueForecastData.weightedPipeline}
                />
              </div>
            )}

            {/* Time to Hire Section */}
            {timeToHireData && timeToHireData.count > 0 && (
              <div className="mt-6">
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-semibold">
                      Temps moyen d&apos;embauche
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Moyen
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {timeToHireData.avgDays}j
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Min
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {timeToHireData.minDays}j
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Max
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {timeToHireData.maxDays}j
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Comparison Section */}
            {comparisonData && (
              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Comparaison période</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Comparer avec période précédente
                    </span>
                    <Switch
                      checked={showComparison}
                      onCheckedChange={setShowComparison}
                    />
                  </div>
                </div>
                {showComparison && (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Total missions
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {comparisonData.current.totalMissions}
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          comparisonData.deltas.missions >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {comparisonData.deltas.missions > 0 ? "+" : ""}
                        {comparisonData.deltas.missions}%
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Taux de conversion
                      </p>
                      <p className="mt-1 text-2xl font-bold text-brand-cyan">
                        {comparisonData.current.conversionRate}%
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          comparisonData.deltas.conversionRate >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {comparisonData.deltas.conversionRate > 0 ? "+" : ""}
                        {comparisonData.deltas.conversionRate}%
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        TJM moyen accepté
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {comparisonData.current.avgTjm}€/j
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          comparisonData.deltas.avgTjm >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {comparisonData.deltas.avgTjm > 0 ? "+" : ""}
                        {comparisonData.deltas.avgTjm}%
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        Relances complétées
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {comparisonData.current.followUpsCompleted}
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          comparisonData.deltas.followUps >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {comparisonData.deltas.followUps > 0 ? "+" : ""}
                        {comparisonData.deltas.followUps}%
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </LayoutContent>
    </Layout>
  );
}
