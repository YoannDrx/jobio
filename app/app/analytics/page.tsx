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
} from "@/features/analytics/analytics.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { BarChart3, Calendar, Euro, Info, TrendingUp } from "lucide-react";
import { EarningsDashboard } from "@/features/analytics/components/earnings-dashboard";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/nowts/empty-state";
import { Button } from "@/components/ui/button";
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

const statusLabels: Record<string, string> = {
  A_POSTULER: "A postuler",
  POSTULE: "Postule",
  ENTRETIEN: "Entretien",
  PROPOSITION: "Proposition",
  ACCEPTE: "Accepte",
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
      const [funnel, platform, tjm, activity, earnings] = await Promise.all([
        resolveActionResult(getFunnelDataAction(params)),
        resolveActionResult(getResponseRateByPlatformAction(params)),
        resolveActionResult(getAverageTJMAction(params)),
        resolveActionResult(getWeeklyActivityAction(params)),
        resolveActionResult(getEarningsDataAction(params)),
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
          <div className="text-muted-foreground py-12 text-center text-sm">
            Chargement...
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
            title="Pas encore assez de donnees"
            description="Ajoutez des missions pour voir vos statistiques."
            action={{
              label: "Creer une mission",
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
                  : "Periode"}
              </span>
              <span className="sm:hidden">Periode</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Periode d'analyse</p>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Du</span>
                  <input
                    type="date"
                    value={startDate}
                    min={minDate}
                    max={endDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Au</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={maxDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
                  />
                </label>
              </div>
              {isLimitedPlan ? (
                <div className="bg-muted flex items-start gap-2 rounded-md p-2">
                  <Info className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    Historique limite a {historyDays} jours (plan{" "}
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
          <div className="text-muted-foreground py-12 text-center text-sm">
            Chargement...
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
                <p className="mt-1 text-2xl font-bold text-cyan-400">
                  {conversionRate}%
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  TJM moyen accepte
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
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold">Entonnoir de conversion</h3>
                </div>
                <FunnelChart
                  data={funnelData.map((item) => ({
                    ...item,
                    label: statusLabels[item.status] ?? item.status,
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
                    Aucune plateforme ajoutee
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold">TJM moyen</h3>
                </div>
                {tjmData.length > 0 ? (
                  <TJMComparison
                    data={tjmData.map((item) => ({
                      ...item,
                      label:
                        item.status === "PROPOSITION"
                          ? "Propose"
                          : item.status === "ACCEPTE"
                            ? "Accepte"
                            : item.status,
                    }))}
                  />
                ) : (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    Aucun TJM enregistre
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold">Activite hebdomadaire</h3>
                </div>
                {activityData.length > 0 ? (
                  <ActivityGraph data={activityData} />
                ) : (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    Aucune activite
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
          </>
        )}
      </LayoutContent>
    </Layout>
  );
}
