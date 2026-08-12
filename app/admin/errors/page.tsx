import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { getSystemErrorLogs } from "../_actions/system-errors";
import { ResolveErrorButton } from "./_components/resolve-error-button";

type ErrorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const readSingleParam = (
  value: string | string[] | undefined,
  fallback: string,
) => {
  if (!value) return fallback;
  return Array.isArray(value) ? (value[0] ?? fallback) : value;
};

const readPageParam = (value: string | string[] | undefined) => {
  const parsed = Number(readSingleParam(value, "1"));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
};

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

const severityVariant = (
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL",
) => {
  if (severity === "INFO") return "secondary";
  if (severity === "WARNING") return "outline";
  if (severity === "CRITICAL") return "destructive";
  return "default";
};

export default async function AdminErrorsPage({
  searchParams,
}: ErrorPageProps) {
  await getRequiredAdmin();

  const params = await searchParams;
  const page = readPageParam(params.page);
  const search = readSingleParam(params.search, "");
  const severity = readSingleParam(params.severity, "all") as
    | "all"
    | "INFO"
    | "WARNING"
    | "ERROR"
    | "CRITICAL";
  const status = readSingleParam(params.status, "all") as
    | "all"
    | "open"
    | "resolved";

  const result = await getSystemErrorLogs({
    page,
    pageSize: 30,
    search: search || undefined,
    severity,
    status,
  });

  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(result.totalPages || 1, page + 1);
  const hasPrevious = page > 1;
  const hasNext = page < result.totalPages;

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>Monitoring erreurs</LayoutTitle>
        <LayoutDescription>
          Logs d&apos;erreurs techniques centralisés (safe-actions, boundaries
          client/global, incidents remontés côté app).
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent className="space-y-4">
        <form className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_220px_220px_auto]">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Source, message, route, email..."
          />
          <Input
            name="severity"
            defaultValue={severity}
            placeholder="all | INFO | WARNING | ERROR | CRITICAL"
          />
          <Input
            name="status"
            defaultValue={status}
            placeholder="all | open | resolved"
          />
          <Button type="submit">Filtrer</Button>
        </form>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.errors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground text-center"
                  >
                    Aucun log d&apos;erreur trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                result.errors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(error.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(error.severity)}>
                        {error.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{error.source}</TableCell>
                    <TableCell className="max-w-[360px]">
                      <p className="line-clamp-2 text-sm">{error.message}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {error.route ?? (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {error.userEmail ?? (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {error.resolvedAt ? (
                        <Badge variant="secondary">Résolue</Badge>
                      ) : (
                        <Badge variant="outline">Ouverte</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {error.resolvedAt ? (
                        <span className="text-muted-foreground text-xs">
                          {formatDateTime(error.resolvedAt)}
                        </span>
                      ) : (
                        <ResolveErrorButton id={error.id} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} / {Math.max(1, result.totalPages)} · {result.total} logs
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" disabled={!hasPrevious}>
              <Link
                href={`/admin/errors?page=${previousPage}&search=${encodeURIComponent(search)}&severity=${encodeURIComponent(severity)}&status=${encodeURIComponent(status)}`}
              >
                Précédent
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={!hasNext}>
              <Link
                href={`/admin/errors?page=${nextPage}&search=${encodeURIComponent(search)}&severity=${encodeURIComponent(severity)}&status=${encodeURIComponent(status)}`}
              >
                Suivant
              </Link>
            </Button>
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
}
