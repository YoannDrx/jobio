"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/nowts/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getAllSentEmailsAction } from "@/features/emails/emails.action";
import { dayjs } from "@/lib/dayjs";
import { ChevronLeft, ChevronRight, Mail, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { toast } from "sonner";

type SentEmail = {
  id: string;
  to: string;
  subject: string;
  status: string;
  isDraft: boolean;
  createdAt: Date;
  sentAt: Date | null;
  mission: { id: string; title: string; company: string | null } | null;
};

export default function EmailsPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize] = useState(20);
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getAllSentEmailsAction({
          page,
          pageSize,
          status: status as "all" | "sent" | "draft",
          search: search || undefined,
        }),
      );
      setEmails(result.emails);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, status, search]);

  useEffect(() => {
    void fetchEmails();
  }, [fetchEmails]);

  const handleSearchChange = (newSearch: string) => {
    void setSearch(newSearch);
    void setPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      void fetchEmails();
    }, 300);
  };

  const handleStatusChange = (newStatus: string) => {
    void setStatus(newStatus);
    void setPage(1);
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>
          Emails{" "}
          {total > 0 && (
            <span className="text-muted-foreground">({total})</span>
          )}
        </LayoutTitle>
      </LayoutHeader>

      <LayoutContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={status} onValueChange={handleStatusChange}>
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="sent">Envoyes</TabsTrigger>
              <TabsTrigger value="draft">Brouillons</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Aucun email"
            description="Les emails envoyes depuis tes missions apparaitront ici."
          />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Mission</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {dayjs(email.sentAt ?? email.createdAt).format(
                          "DD/MM/YYYY HH:mm",
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {email.to}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {email.subject}
                      </TableCell>
                      <TableCell>
                        {email.mission ? (
                          <Link
                            href={`/app/pipeline?missionId=${email.mission.id}`}
                            className="text-primary hover:underline"
                          >
                            {email.mission.title}
                            {email.mission.company &&
                              ` - ${email.mission.company}`}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {email.isDraft ? (
                          <Badge variant="secondary">Brouillon</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            Envoye
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => void setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Precedent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => void setPage(page + 1)}
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </LayoutContent>
    </Layout>
  );
}
