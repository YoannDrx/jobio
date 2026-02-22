import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { getAdminFeatureFlags, getCronJobRuns, getOpsIncidentSummary } from "../_actions/ops";
import { getSeoKpiSummary } from "../_actions/seo";
import {
  computeSeoSyncFreshness,
  formatSyncAge,
  getLatestSeoSyncRun,
  getLatestSeoSyncSuccessRun,
} from "@/features/admin/seo-sync-health";
import { FeatureFlagToggleButton } from "./_components/feature-flag-toggle-button";
import { SyncSeoMetricsButton } from "./_components/sync-seo-metrics-button";
import { SyncFeatureFlagsButton } from "./_components/sync-feature-flags-button";

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

const statusVariant = (
  status: "RUNNING" | "SUCCESS" | "FAILED" | "UNAUTHORIZED",
) => {
  if (status === "SUCCESS") return "secondary";
  if (status === "RUNNING") return "outline";
  return "destructive";
};

const seoChecklistVariant = (status: "ok" | "warning") =>
  status === "ok" ? "secondary" : "outline";

const searchMetricsVariant = (
  status: "configured" | "not_configured" | "invalid",
) => (status === "configured" ? "secondary" : "outline");

const formatDeltaPercent = (value: number | null) => {
  if (value === null) return "n/a";
  return `${value > 0 ? "+" : ""}${value}%`;
};

const formatCtr = (value: number | null) => {
  if (value === null) return "-";
  return `${value}%`;
};

const sourceLabel = (
  source: "env_json" | "redis_cache" | "endpoint" | "file" | "none",
) => {
  if (source === "env_json") return "ENV JSON";
  if (source === "redis_cache") return "Redis cache";
  if (source === "endpoint") return "Endpoint";
  if (source === "file") return "Fichier";
  return "Aucune";
};

const snapshotFreshnessVariant = (isStale: boolean) =>
  isStale ? "destructive" : "secondary";

const refreshFollowUpVariant = (status: "waiting" | "due" | "overdue") => {
  if (status === "waiting") return "outline";
  if (status === "due") return "secondary";
  return "destructive";
};

const refreshFollowUpLabel = (status: "waiting" | "due" | "overdue") => {
  if (status === "waiting") return "À venir";
  if (status === "due") return "À traiter";
  return "En retard";
};

const seoSyncFreshnessVariant = (status: "fresh" | "stale" | "missing") => {
  if (status === "fresh") return "secondary";
  if (status === "stale") return "destructive";
  return "outline";
};

const seoSyncFreshnessLabel = (status: "fresh" | "stale" | "missing") => {
  if (status === "fresh") return "Sync fraîche";
  if (status === "stale") return "Sync obsolète";
  return "Aucune sync";
};

export default async function AdminOpsPage() {
  await getRequiredAdmin();

  const [flags, cronRuns, incidentSummary, seoSummary] = await Promise.all([
    getAdminFeatureFlags(),
    getCronJobRuns(30),
    getOpsIncidentSummary(),
    getSeoKpiSummary(),
  ]);

  const runningJobs = cronRuns.filter((run) => run.status === "RUNNING").length;
  const failedJobs = cronRuns.filter((run) => run.status === "FAILED").length;
  const latestSeoSyncRun = getLatestSeoSyncRun(cronRuns);
  const latestSeoSyncSuccessRun = getLatestSeoSyncSuccessRun(cronRuns);
  const seoSyncFreshness = computeSeoSyncFreshness(
    latestSeoSyncSuccessRun?.startedAt ?? null,
  );
  const requiresSeoSyncCron =
    seoSummary.searchPerformance.source === "endpoint" ||
    seoSummary.searchPerformance.source === "redis_cache";

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>Ops & feature flags</LayoutTitle>
        <LayoutDescription>
          Monitoring opérationnel du produit: incidents ouverts, santé des cron jobs
          et pilotage progressif des fonctionnalités.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        <SyncSeoMetricsButton />
        <SyncFeatureFlagsButton />
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/errors">Voir les erreurs</Link>
        </Button>
      </LayoutActions>
      <LayoutContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Incidents ouverts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{incidentSummary.openErrors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Incidents critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {incidentSummary.criticalOpenErrors}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cron en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{runningJobs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cron en échec (historique)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{failedJobs}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SEO hebdo - KPI opérationnels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    URLs publiques sitemap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {seoSummary.sitemapPublicUrlsCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Couverture robots privées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {seoSummary.disallowCoveragePercent}%
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {seoSummary.blockedPrivateRoutesCount}/
                    {seoSummary.blockedPrivateRoutesCount +
                      seoSummary.missingPrivateDisallows.length} préfixes
                    bloqués
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Articles publiés (30j)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {seoSummary.blogPostsLast30Days}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Dernier article
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {seoSummary.daysSinceLatestBlogPost === null
                      ? "-"
                      : `${seoSummary.daysSinceLatestBlogPost} j`}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    depuis la dernière publication
                  </p>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Détail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seoSummary.checklist.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>
                      <Badge variant={seoChecklistVariant(item.status)}>
                        {item.status === "ok" ? "OK" : "Action"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  Acquisition Search Console / Bing
                </p>
                <Badge
                  variant={searchMetricsVariant(seoSummary.searchPerformance.status)}
                >
                  {seoSummary.searchPerformance.status === "configured"
                    ? "Configuré"
                    : seoSummary.searchPerformance.status === "invalid"
                      ? "Invalide"
                      : "Non configuré"}
                </Badge>
                {seoSummary.searchPerformance.periodLabel ? (
                  <Badge variant="outline">
                    {seoSummary.searchPerformance.periodLabel}
                  </Badge>
                ) : null}
                <Badge variant="outline">
                  Source: {sourceLabel(seoSummary.searchPerformance.source)}
                </Badge>
                {seoSummary.searchPerformance.snapshotAgeDays !== null ? (
                  <Badge
                    variant={snapshotFreshnessVariant(
                      seoSummary.searchPerformance.isSnapshotStale,
                    )}
                  >
                    {seoSummary.searchPerformance.isSnapshotStale
                      ? "Snapshot obsolete"
                      : "Snapshot frais"}{" "}
                    ({seoSummary.searchPerformance.snapshotAgeDays}j)
                  </Badge>
                ) : null}
                {seoSummary.searchPerformance.capturedAt ? (
                  <p className="text-muted-foreground text-xs">
                    Snapshot:{" "}
                    {formatDateTime(new Date(seoSummary.searchPerformance.capturedAt))}
                  </p>
                ) : null}
                {requiresSeoSyncCron ? (
                  <>
                    <Badge variant={seoSyncFreshnessVariant(seoSyncFreshness.status)}>
                      {seoSyncFreshnessLabel(seoSyncFreshness.status)}
                    </Badge>
                    <p className="text-muted-foreground text-xs">
                      Dernier succès sync:{" "}
                      {latestSeoSyncSuccessRun
                        ? `${formatDateTime(latestSeoSyncSuccessRun.startedAt)} (${formatSyncAge(seoSyncFreshness.ageHours)})`
                        : "aucun"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Dernier run sync:{" "}
                      {latestSeoSyncRun
                        ? `${formatDateTime(latestSeoSyncRun.startedAt)} (${latestSeoSyncRun.status})`
                        : "aucun"}
                    </p>
                  </>
                ) : (
                  <Badge variant="outline">Sync cron non requise</Badge>
                )}
              </div>

              {requiresSeoSyncCron && seoSyncFreshness.status !== "fresh" ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                  La collecte SEO automatique semble en retard. Lance
                  "Synchroniser SEO" puis vérifie le cron
                  <code className="mx-1 rounded bg-muted px-1 py-0.5">
                    /api/cron/seo-search-metrics-sync
                  </code>
                  .
                </div>
              ) : null}

              {seoSummary.searchPerformance.status === "configured" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Clics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-semibold">
                          {seoSummary.searchPerformance.clicks ?? "-"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          delta:{" "}
                          {formatDeltaPercent(
                            seoSummary.searchPerformance.clicksDeltaPercent,
                          )}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Impressions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-semibold">
                          {seoSummary.searchPerformance.impressions ?? "-"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          delta:{" "}
                          {formatDeltaPercent(
                            seoSummary.searchPerformance.impressionsDeltaPercent,
                          )}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">CTR moyen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-semibold">
                          {formatCtr(seoSummary.searchPerformance.ctr)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          delta:{" "}
                          {seoSummary.searchPerformance.ctrDeltaPoints === null
                            ? "n/a"
                            : `${seoSummary.searchPerformance.ctrDeltaPoints > 0 ? "+" : ""}${seoSummary.searchPerformance.ctrDeltaPoints} pt`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Position moyenne
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-semibold">
                          {seoSummary.searchPerformance.averagePosition ?? "-"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          source: {seoSummary.searchPerformance.provider}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {seoSummary.searchPerformance.topQueries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Top requête</TableHead>
                          <TableHead>Clics</TableHead>
                          <TableHead>Impressions</TableHead>
                          <TableHead>CTR</TableHead>
                          <TableHead>Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seoSummary.searchPerformance.topQueries.map((query) => (
                          <TableRow key={query.query}>
                            <TableCell className="max-w-[260px] truncate font-medium">
                              {query.query}
                            </TableCell>
                            <TableCell>{query.clicks}</TableCell>
                            <TableCell>{query.impressions}</TableCell>
                            <TableCell>{query.ctr}%</TableCell>
                            <TableCell>{query.position ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Aucune requête détaillée fournie dans la source externe.
                    </p>
                  )}

                  {seoSummary.searchPerformance.contentRefreshCandidates.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Candidats refresh contenu SEO
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Page</TableHead>
                            <TableHead>Impressions</TableHead>
                            <TableHead>Clics</TableHead>
                            <TableHead>CTR</TableHead>
                            <TableHead>Raison</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {seoSummary.searchPerformance.contentRefreshCandidates.map(
                            (candidate) => (
                              <TableRow key={candidate.path}>
                                <TableCell className="font-medium">
                                  {candidate.path}
                                </TableCell>
                                <TableCell>{candidate.impressions}</TableCell>
                                <TableCell>{candidate.clicks}</TableCell>
                                <TableCell>{candidate.ctr}%</TableCell>
                                <TableCell>{candidate.reason}</TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}

                  {seoSummary.searchPerformance.refreshFollowUps.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Suivi post-refresh contenu (J+14 / J+30 / J+60)
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Page</TableHead>
                            <TableHead>Refresh</TableHead>
                            <TableHead>Âge</TableHead>
                            <TableHead>Checkpoint</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>CTR</TableHead>
                            <TableHead>Impressions</TableHead>
                            <TableHead>Détail</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {seoSummary.searchPerformance.refreshFollowUps.map(
                            (followUp) => (
                              <TableRow key={followUp.path}>
                                <TableCell className="max-w-[260px] truncate font-medium">
                                  {followUp.path}
                                </TableCell>
                                <TableCell>{followUp.refreshedAt}</TableCell>
                                <TableCell>{followUp.ageDays}j</TableCell>
                                <TableCell>{followUp.milestone}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={refreshFollowUpVariant(
                                      followUp.status,
                                    )}
                                  >
                                    {refreshFollowUpLabel(followUp.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {followUp.ctr === null ? "-" : `${followUp.ctr}%`}
                                </TableCell>
                                <TableCell>{followUp.impressions ?? "-"}</TableCell>
                                <TableCell className="text-xs">{followUp.detail}</TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Configure{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    SEO_SEARCH_METRICS_JSON
                  </code>{" "}
                  ou{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    SEO_SEARCH_METRICS_ENDPOINT
                  </code>{" "}
                  ou{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    SEO_SEARCH_METRICS_FILE
                  </code>{" "}
                  pour injecter les snapshots GSC/Bing.
                </p>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">Actions recommandées</p>
              <ul className="space-y-1 text-sm">
                {seoSummary.recommendedActions.map((action) => (
                  <li key={action}>• {action}</li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-3 text-xs">
                Référence runbook: docs/seo/03-search-console-bing-runbook.md
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun feature flag disponible.
              </p>
            ) : (
              <div className="space-y-2">
                {flags.map((flag) => (
                  <div
                    key={flag.key}
                    className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{flag.label}</p>
                        <Badge variant="outline">{flag.scope}</Badge>
                        <Badge variant="outline">{flag.source}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {flag.description || "Aucune description"}
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {flag.key}
                      </p>
                    </div>
                    <FeatureFlagToggleButton flagKey={flag.key} enabled={flag.enabled} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Santé des cron jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Traités</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Erreur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-center">
                      Aucun run cron enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  cronRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm">{formatDateTime(run.startedAt)}</TableCell>
                      <TableCell className="font-medium">{run.jobName}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {run.durationMs !== null ? `${run.durationMs} ms` : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {run.processedCount ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{run.route}</TableCell>
                      <TableCell className="text-xs">
                        {run.errorMessage ? (
                          <span className="text-destructive line-clamp-2">
                            {run.errorMessage}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
