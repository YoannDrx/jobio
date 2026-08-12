import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { getAdminAuditLogs } from "../_actions/admin-audit";
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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

const readSingleParam = (
  value: string | string[] | undefined,
  fallback: string,
) => {
  if (!value) return fallback;
  return Array.isArray(value) ? (value[0] ?? fallback) : value;
};

const readPageParam = (value: string | string[] | undefined) => {
  const raw = readSingleParam(value, "1");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
};

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  await getRequiredAdmin();

  const params = await searchParams;
  const page = readPageParam(params.page);
  const search = readSingleParam(params.search, "");
  const action = readSingleParam(params.action, "");

  const result = await getAdminAuditLogs({
    page,
    pageSize: 30,
    search: search || undefined,
    action: action || undefined,
  });

  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(result.totalPages || 1, page + 1);
  const hasPrevious = page > 1;
  const hasNext = page < result.totalPages;

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>Audit log admin</LayoutTitle>
        <LayoutDescription>
          Historique des actions administrateur (impersonation, ban, changement
          de rôle, export, etc.).
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent className="space-y-4">
        <form className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]">
          <Input
            name="search"
            placeholder="Recherche acteur, cible ou action..."
            defaultValue={search}
          />
          <Input
            name="action"
            placeholder="Filtre action (ex: USER_BANNED)"
            defaultValue={action}
          />
          <Button type="submit">Filtrer</Button>
        </form>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Acteur</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground text-center"
                  >
                    Aucun événement d&apos;audit trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                result.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span>{log.actorEmail}</span>
                        <span className="text-muted-foreground text-xs">
                          {log.actorUserId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.targetEmail ?? (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[340px] text-xs">
                      {log.metadata ? (
                        <pre className="text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
            Page {page} / {Math.max(1, result.totalPages)} · {result.total}{" "}
            événements
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" disabled={!hasPrevious}>
              <Link
                href={`/admin/audit?page=${previousPage}&search=${encodeURIComponent(search)}&action=${encodeURIComponent(action)}`}
              >
                Précédent
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={!hasNext}>
              <Link
                href={`/admin/audit?page=${nextPage}&search=${encodeURIComponent(search)}&action=${encodeURIComponent(action)}`}
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
