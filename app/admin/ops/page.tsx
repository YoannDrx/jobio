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
import { FeatureFlagToggleButton } from "./_components/feature-flag-toggle-button";
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
