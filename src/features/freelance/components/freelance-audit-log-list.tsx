"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BillingEntityType } from "@/generated/prisma";
import { getBillingAuditEventsAction } from "@/features/freelance/billing-documents.action";
import {
  auditEventLabel,
  entityLabel,
  formatDate,
} from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  entityType: BillingEntityType;
  entityId: string;
  eventType: keyof typeof auditEventLabel;
  message: string | null;
  createdAt: Date | string;
};

const ENTITY_FILTERS: { label: string; value: BillingEntityType | "ALL" }[] = [
  { label: "Tous", value: "ALL" },
  { label: "Profil", value: BillingEntityType.PROFILE },
  { label: "Clients", value: BillingEntityType.CLIENT },
  { label: "Devis", value: BillingEntityType.QUOTE },
  { label: "Factures", value: BillingEntityType.INVOICE },
  { label: "Paiements", value: BillingEntityType.PAYMENT },
  { label: "Dépenses factures", value: BillingEntityType.EXPENSE_INVOICE },
  { label: "Notes de frais", value: BillingEntityType.EXPENSE_NOTE },
  { label: "Trajets", value: BillingEntityType.EXPENSE_TRIP },
];

export function FreelanceAuditLogList() {
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityType, setEntityType] = useState<BillingEntityType | "ALL">("ALL");

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getBillingAuditEventsAction({
          page: 1,
          pageSize: 100,
          ...(entityType === "ALL" ? {} : { entityType }),
        }),
      );

      setEvents(result.events as AuditRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible de charger les logs",
      );
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Journal d’activité</CardTitle>
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value as BillingEntityType | "ALL");
          }}
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Chargement des logs...
          </div>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun événement trouvé.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{formatDate(event.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entityLabel[event.entityType]}</Badge>
                  </TableCell>
                  <TableCell>{auditEventLabel[event.eventType]}</TableCell>
                  <TableCell className="max-w-[420px] truncate">
                    {event.message ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{event.entityId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
