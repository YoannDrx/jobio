"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMemo, useState } from "react";

type MonitoringMetric = {
  label: string;
  value: string;
};

type TimelineItem = {
  id: string;
  type: string;
  description: string | null;
  createdAt: Date | string;
};

type BillingSnapshot = {
  stripeCustomerId: string | null;
  localSubscription: {
    plan: string;
    status: string | null;
    periodEnd: Date | null;
    cancelAtPeriodEnd: boolean | null;
  } | null;
  invoices: {
    id: string;
    status: string | null;
    total: number;
    currency: string;
    hostedInvoiceUrl: string | null;
    createdAt: Date;
    paidAt: Date | null;
  }[];
  stripeSubscriptions: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  }[];
  stripeError: string | null;
};

type BillingTimelineItem = {
  id: string;
  source: "stripe" | "admin_audit";
  eventType: string;
  title: string;
  description: string | null;
  occurredAt: Date | string;
  amount: number | null;
  currency: string | null;
  status: string | null;
  referenceId: string | null;
};

type BillingHealthSeverity = "critical" | "warning" | "info";

type BillingHealthAlert = {
  id: string;
  severity: BillingHealthSeverity;
  title: string;
  details: string;
};

type BillingPlaybookPriority = "high" | "medium" | "low";

type BillingPlaybookItem = {
  id: string;
  priority: BillingPlaybookPriority;
  title: string;
  details: string;
  actionLabel?: string;
  runAction?: () => void;
};

type AdminAuditLogItem = {
  id: string;
  action: string;
  actorEmail: string;
  metadata: unknown;
  createdAt: Date | string;
};

type AiCreditAdjustmentItem = {
  id: string;
  month: number;
  year: number;
  mode: string;
  amount: number;
  previousRequestsLimit: number;
  nextRequestsLimit: number;
  previousRequestsUsed: number;
  nextRequestsUsed: number;
  reason: string;
  createdAt: Date | string;
  actor: {
    name: string;
    email: string;
  };
};

type UserMonitoringCardProps = {
  metrics: MonitoringMetric[];
  timeline: TimelineItem[];
  billing: BillingSnapshot;
  billingTimeline: BillingTimelineItem[];
  aiCreditAdjustments: AiCreditAdjustmentItem[];
  auditLogs: AdminAuditLogItem[];
};

const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function UserMonitoringCard({
  metrics,
  timeline,
  billing,
  billingTimeline,
  aiCreditAdjustments,
  auditLogs,
}: UserMonitoringCardProps) {
  const [billingSourceFilter, setBillingSourceFilter] = useState<
    "all" | "stripe" | "admin_audit"
  >("all");
  const [billingEventTypeFilter, setBillingEventTypeFilter] = useState("all");
  const [billingReferenceFilter, setBillingReferenceFilter] = useState("");
  const [billingFromDateFilter, setBillingFromDateFilter] = useState("");
  const [billingToDateFilter, setBillingToDateFilter] = useState("");
  const [auditSearchFilter, setAuditSearchFilter] = useState("");
  const [highlightedAuditLogId, setHighlightedAuditLogId] = useState<string | null>(
    null,
  );

  const billingEventTypes = useMemo(
    () =>
      Array.from(new Set(billingTimeline.map((item) => item.eventType))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [billingTimeline],
  );

  const filteredBillingTimeline = useMemo(() => {
    const referenceQuery = billingReferenceFilter.trim().toLowerCase();
    const fromTimestamp = billingFromDateFilter
      ? new Date(`${billingFromDateFilter}T00:00:00.000Z`).getTime()
      : null;
    const toTimestamp = billingToDateFilter
      ? new Date(`${billingToDateFilter}T23:59:59.999Z`).getTime()
      : null;

    return billingTimeline.filter((item) => {
      if (billingSourceFilter !== "all" && item.source !== billingSourceFilter) {
        return false;
      }

      if (
        billingEventTypeFilter !== "all" &&
        item.eventType !== billingEventTypeFilter
      ) {
        return false;
      }

      if (referenceQuery.length > 0) {
        const referenceId = (item.referenceId ?? "").toLowerCase();
        if (!referenceId.includes(referenceQuery)) {
          return false;
        }
      }

      const occurredAtTimestamp = new Date(item.occurredAt).getTime();
      if (Number.isNaN(occurredAtTimestamp)) {
        return false;
      }

      if (fromTimestamp !== null && occurredAtTimestamp < fromTimestamp) {
        return false;
      }

      if (toTimestamp !== null && occurredAtTimestamp > toTimestamp) {
        return false;
      }

      return true;
    });
  }, [
    billingEventTypeFilter,
    billingFromDateFilter,
    billingReferenceFilter,
    billingSourceFilter,
    billingTimeline,
    billingToDateFilter,
  ]);

  const invoiceHostedUrlById = useMemo(() => {
    const entries = billing.invoices
      .filter((invoice) => Boolean(invoice.hostedInvoiceUrl))
      .map((invoice) => [invoice.id, invoice.hostedInvoiceUrl] as const);
    return new Map(entries);
  }, [billing.invoices]);

  const billingHealthAlerts = useMemo(() => {
    const alerts: BillingHealthAlert[] = [];
    const now = Date.now();

    if (billing.stripeError) {
      alerts.push({
        id: "stripe_error",
        severity: "critical",
        title: "Erreur Stripe active",
        details: billing.stripeError,
      });
    }

    if (
      billing.localSubscription &&
      billing.localSubscription.plan !== "free" &&
      !billing.stripeCustomerId
    ) {
      alerts.push({
        id: "missing_stripe_customer",
        severity: "critical",
        title: "Plan payant sans customer Stripe",
        details:
          "Le plan local est payant mais aucun customer Stripe n'est lié au compte.",
      });
    }

    if (
      billing.localSubscription?.status &&
      ["past_due", "unpaid", "incomplete", "incomplete_expired"].includes(
        billing.localSubscription.status,
      )
    ) {
      alerts.push({
        id: "subscription_collection_issue",
        severity: "warning",
        title: `Abonnement en statut ${billing.localSubscription.status}`,
        details:
          "Le recouvrement est en anomalie, une action support/facturation est recommandée.",
      });
    }

    const overdueOpenInvoices = billing.invoices.filter((invoice) => {
      if (invoice.status !== "open") return false;
      const ageMs = now - new Date(invoice.createdAt).getTime();
      return ageMs > 7 * 24 * 60 * 60 * 1000;
    });

    if (overdueOpenInvoices.length > 0) {
      alerts.push({
        id: "open_invoices_overdue",
        severity: "warning",
        title: "Factures ouvertes depuis plus de 7 jours",
        details: `${overdueOpenInvoices.length} facture(s) nécessitent un suivi de paiement.`,
      });
    }

    const recentRefundCount = billingTimeline.filter((item) => {
      if (item.eventType !== "USER_STRIPE_INVOICE_REFUNDED") return false;
      const ageMs = now - new Date(item.occurredAt).getTime();
      return ageMs <= 30 * 24 * 60 * 60 * 1000;
    }).length;

    if (recentRefundCount >= 2) {
      alerts.push({
        id: "multiple_refunds_30d",
        severity: "warning",
        title: "Remboursements répétés (30 jours)",
        details: `${recentRefundCount} remboursements ont été effectués sur les 30 derniers jours.`,
      });
    }

    if (
      billing.localSubscription?.cancelAtPeriodEnd &&
      billing.localSubscription.periodEnd
    ) {
      const periodEndMs = new Date(billing.localSubscription.periodEnd).getTime();
      const remainingMs = periodEndMs - now;
      if (remainingMs > 0 && remainingMs <= 7 * 24 * 60 * 60 * 1000) {
        alerts.push({
          id: "cancel_at_period_end_soon",
          severity: "info",
          title: "Annulation en fin de période imminente",
          details: `Fin prévue le ${new Date(
            billing.localSubscription.periodEnd,
          ).toLocaleDateString("fr-FR")}.`,
        });
      }
    }

    return alerts;
  }, [billing, billingTimeline]);

  const billingRiskScore = useMemo(() => {
    let score = 0;
    for (const alert of billingHealthAlerts) {
      if (alert.severity === "critical") {
        score += 35;
      } else if (alert.severity === "warning") {
        score += 15;
      } else {
        score += 5;
      }
    }

    if (score > 100) return 100;
    return score;
  }, [billingHealthAlerts]);

  const billingRiskLevel = useMemo(() => {
    if (billingRiskScore >= 70) return "Élevé";
    if (billingRiskScore >= 35) return "Modéré";
    return "Faible";
  }, [billingRiskScore]);

  const billingPlaybook = useMemo(() => {
    const items: BillingPlaybookItem[] = [];
    const openInvoiceIds = billing.invoices
      .filter((invoice) => invoice.status === "open")
      .map((invoice) => invoice.id);

    const hasCollectionIssue =
      billing.localSubscription?.status &&
      ["past_due", "unpaid", "incomplete", "incomplete_expired"].includes(
        billing.localSubscription.status,
      );

    if (billing.stripeError) {
      items.push({
        id: "playbook_stripe_error",
        priority: "high",
        title: "Résoudre l'erreur Stripe",
        details:
          "Relancer une synchronisation Stripe puis vérifier la connectivité et les credentials.",
        actionLabel: "Filtrer erreurs Stripe",
        runAction: () => {
          setBillingEventTypeFilter("STRIPE_TIMELINE_ERROR");
          setBillingSourceFilter("stripe");
        },
      });
    }

    if (hasCollectionIssue) {
      items.push({
        id: "playbook_collection_issue",
        priority: "high",
        title: "Traiter le recouvrement de l'abonnement",
        details:
          "Analyser les derniers événements d'abonnement et contacter le client si nécessaire.",
        actionLabel: "Filtrer événements abonnement",
        runAction: () => {
          setBillingSourceFilter("all");
          setBillingEventTypeFilter("SUBSCRIPTION_STATUS");
        },
      });
    }

    if (openInvoiceIds.length > 0) {
      items.push({
        id: "playbook_open_invoices",
        priority: "medium",
        title: "Relancer les factures ouvertes",
        details: `${openInvoiceIds.length} facture(s) sont ouvertes. Prioriser les relances/re-envois.`,
        actionLabel: "Filtrer factures",
        runAction: () => {
          setBillingSourceFilter("stripe");
          setBillingEventTypeFilter("INVOICE_CREATED");
        },
      });
    }

    const recentRefundCount = billingTimeline.filter((item) => {
      if (item.eventType !== "USER_STRIPE_INVOICE_REFUNDED") return false;
      const ageMs = Date.now() - new Date(item.occurredAt).getTime();
      return ageMs <= 30 * 24 * 60 * 60 * 1000;
    }).length;

    if (recentRefundCount >= 2) {
      items.push({
        id: "playbook_refund_review",
        priority: "medium",
        title: "Analyser la cause des remboursements",
        details:
          "Des remboursements répétés indiquent un risque churn/support. Vérifier les motifs et tendances.",
        actionLabel: "Filtrer remboursements",
        runAction: () => {
          setBillingSourceFilter("admin_audit");
          setBillingEventTypeFilter("USER_STRIPE_INVOICE_REFUNDED");
        },
      });
    }

    if (
      billing.localSubscription?.cancelAtPeriodEnd &&
      billing.localSubscription.periodEnd
    ) {
      items.push({
        id: "playbook_cancel_at_period_end",
        priority: "low",
        title: "Préparer la rétention avant fin de période",
        details:
          "Le compte est en annulation planifiée. Vérifier l'usage récent et préparer une action de rétention.",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "playbook_no_action",
        priority: "low",
        title: "Aucune action urgente",
        details:
          "Continuer le monitoring standard et vérifier périodiquement les événements Stripe.",
      });
    }

    return items;
  }, [billing, billingTimeline]);

  const filteredAuditLogs = useMemo(() => {
    const query = auditSearchFilter.trim().toLowerCase();
    if (!query) return auditLogs;

    return auditLogs.filter((log) => {
      const metadata = log.metadata ? JSON.stringify(log.metadata) : "";
      return (
        log.action.toLowerCase().includes(query) ||
        log.actorEmail.toLowerCase().includes(query) ||
        metadata.toLowerCase().includes(query)
      );
    });
  }, [auditLogs, auditSearchFilter]);

  const resetBillingFilters = () => {
    setBillingSourceFilter("all");
    setBillingEventTypeFilter("all");
    setBillingReferenceFilter("");
    setBillingFromDateFilter("");
    setBillingToDateFilter("");
  };

  const exportFilteredBillingTimelineCsv = () => {
    if (filteredBillingTimeline.length === 0) {
      return;
    }

    const headers = [
      "Date",
      "Source",
      "Type",
      "Titre",
      "Description",
      "Montant",
      "Devise",
      "Statut",
      "Reference",
    ];

    const rows = filteredBillingTimeline.map((item) => [
      new Date(item.occurredAt).toISOString(),
      item.source,
      item.eventType,
      item.title,
      item.description ?? "",
      item.amount ?? "",
      item.currency ?? "",
      item.status ?? "",
      item.referenceId ?? "",
    ]);

    const csv = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "billing-timeline-filtered.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const jumpToAuditLog = (auditLogId: string) => {
    setAuditSearchFilter("");
    setHighlightedAuditLogId(auditLogId);

    window.setTimeout(() => {
      const target = document.getElementById(`audit-log-${auditLogId}`);
      if (!target) return;
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  };

  return (
    <Card data-testid="admin-user-monitoring-card">
      <CardHeader>
        <CardTitle>Monitoring 360</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">{metric.label}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Timeline récente</h3>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune activité récente.</p>
          ) : (
            <div className="space-y-2">
              {timeline.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(item.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="mt-2 text-sm">{item.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Facturation Stripe</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-md border p-3 text-sm">
              <p className="text-muted-foreground text-xs">Customer ID</p>
              <p className="mt-1 break-all font-medium">
                {billing.stripeCustomerId ?? "Non lié"}
              </p>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="text-muted-foreground text-xs">Abonnement local</p>
              {billing.localSubscription ? (
                <p className="mt-1 font-medium">
                  {billing.localSubscription.plan} ·{" "}
                  {billing.localSubscription.status ?? "n/a"}
                </p>
              ) : (
                <p className="mt-1 font-medium">Aucun</p>
              )}
            </div>
          </div>

          {billing.stripeError ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Erreur Stripe: {billing.stripeError}
            </div>
          ) : null}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Créée</TableHead>
                  <TableHead>Payée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Aucune facture Stripe.
                    </TableCell>
                  </TableRow>
                ) : (
                  billing.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {invoice.hostedInvoiceUrl ? (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {invoice.id}
                          </a>
                        ) : (
                          invoice.id
                        )}
                      </TableCell>
                      <TableCell>{invoice.status ?? "n/a"}</TableCell>
                      <TableCell>
                        {(invoice.total / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        {invoice.paidAt
                          ? new Date(invoice.paidAt).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Cancel fin période</TableHead>
                  <TableHead>Période</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.stripeSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Aucun abonnement Stripe.
                    </TableCell>
                  </TableRow>
                ) : (
                  billing.stripeSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-mono text-xs">
                        {subscription.id}
                      </TableCell>
                      <TableCell>{subscription.status}</TableCell>
                      <TableCell>
                        {subscription.cancelAtPeriodEnd ? "oui" : "non"}
                      </TableCell>
                      <TableCell>
                        {subscription.currentPeriodStart
                          ? new Date(subscription.currentPeriodStart).toLocaleDateString(
                              "fr-FR",
                            )
                          : "-"}{" "}
                        -{" "}
                        {subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString(
                              "fr-FR",
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Santé facturation</h3>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">Score de risque facturation</p>
              <p className="text-lg font-semibold">{billingRiskScore}/100</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">Niveau de risque</p>
              <p className="text-lg font-semibold">{billingRiskLevel}</p>
            </div>
          </div>
          {billingHealthAlerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun signal d&apos;anomalie détecté.
            </p>
          ) : (
            <div className="space-y-2">
              {billingHealthAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-md border p-3"
                  data-severity={alert.severity}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        alert.severity === "critical"
                          ? "destructive"
                          : alert.severity === "warning"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <p className="text-sm font-medium">{alert.title}</p>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {alert.details}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Playbook support facturation</h3>
          <div className="space-y-2">
            {billingPlaybook.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      item.priority === "high"
                        ? "destructive"
                        : item.priority === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {item.priority}
                  </Badge>
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{item.details}</p>
                {item.actionLabel && item.runAction ? (
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={item.runAction}>
                      {item.actionLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Timeline facturation</h3>
          <div className="mb-3 space-y-2 rounded-md border p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1">
                <Label>Source</Label>
                <Select
                  value={billingSourceFilter}
                  onValueChange={(value) =>
                    setBillingSourceFilter(
                      value as "all" | "stripe" | "admin_audit",
                    )
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    data-testid="billing-timeline-source-filter"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="admin_audit">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Type d&apos;événement</Label>
                <Select
                  value={billingEventTypeFilter}
                  onValueChange={setBillingEventTypeFilter}
                >
                  <SelectTrigger
                    className="w-full"
                    data-testid="billing-timeline-event-type-filter"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {billingEventTypes.map((eventType) => (
                      <SelectItem key={eventType} value={eventType}>
                        {eventType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="billing-timeline-reference-filter">
                  Référence invoice/subscription
                </Label>
                <Input
                  id="billing-timeline-reference-filter"
                  value={billingReferenceFilter}
                  placeholder="Ex: in_123 ou sub_123"
                  onChange={(event) => setBillingReferenceFilter(event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="billing-timeline-from-date">Du</Label>
                <Input
                  id="billing-timeline-from-date"
                  type="date"
                  value={billingFromDateFilter}
                  onChange={(event) => setBillingFromDateFilter(event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="billing-timeline-to-date">Au</Label>
                <Input
                  id="billing-timeline-to-date"
                  type="date"
                  value={billingToDateFilter}
                  onChange={(event) => setBillingToDateFilter(event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">
                {filteredBillingTimeline.length}/{billingTimeline.length} événements
                affichés
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filteredBillingTimeline.length === 0}
                  data-testid="billing-timeline-export-filtered"
                  onClick={exportFilteredBillingTimelineCsv}
                >
                  Export CSV filtré
                </Button>
                <Button variant="ghost" size="sm" onClick={resetBillingFilters}>
                  Réinitialiser filtres
                </Button>
              </div>
            </div>
          </div>

          {billingTimeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun événement de facturation disponible.
            </p>
          ) : filteredBillingTimeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun événement ne correspond aux filtres.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredBillingTimeline.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.eventType}</Badge>
                    <Badge variant="secondary">
                      {item.source === "stripe" ? "stripe" : "admin"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(item.occurredAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.description}
                    </p>
                  ) : null}
                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
                    {item.amount !== null && item.currency ? (
                      <span>
                        {(item.amount / 100).toFixed(2)} {item.currency.toUpperCase()}
                      </span>
                    ) : null}
                    {item.status ? <span>statut: {item.status}</span> : null}
                    {item.referenceId ? <span>ref: {item.referenceId}</span> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.referenceId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBillingReferenceFilter(item.referenceId ?? "")}
                      >
                        Filtrer cette référence
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBillingEventTypeFilter(item.eventType)}
                    >
                      Filtrer ce type
                    </Button>
                    {item.referenceId &&
                    item.referenceId.startsWith("in_") &&
                    invoiceHostedUrlById.get(item.referenceId) ? (
                      <Button size="sm" variant="outline" asChild>
                          <a
                            href={invoiceHostedUrlById.get(item.referenceId) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                          Ouvrir facture Stripe
                        </a>
                      </Button>
                    ) : null}
                    {item.source === "admin_audit" && item.id.startsWith("audit:") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => jumpToAuditLog(item.id.replace("audit:", ""))}
                      >
                        Voir audit lié
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Historique crédits IA</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Acteur</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Opération</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Utilisé</TableHead>
                  <TableHead>Raison</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiCreditAdjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      Aucun ajustement de crédits IA.
                    </TableCell>
                  </TableRow>
                ) : (
                  aiCreditAdjustments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{item.actor.name}</p>
                        <p className="text-muted-foreground text-xs">{item.actor.email}</p>
                      </TableCell>
                      <TableCell>
                        {String(item.month).padStart(2, "0")}/{item.year}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.mode === "set" ? "set" : "add"} {item.amount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.previousRequestsLimit} → {item.nextRequestsLimit}
                      </TableCell>
                      <TableCell>
                        {item.previousRequestsUsed} → {item.nextRequestsUsed}
                      </TableCell>
                      <TableCell className="max-w-[280px] whitespace-pre-wrap text-sm">
                        {item.reason}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Audit admin ciblé utilisateur</h3>
          <div className="mb-3 space-y-2 rounded-md border p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[240px] flex-1 space-y-1">
                <Label htmlFor="audit-log-search-filter">
                  Rechercher (action, acteur, metadata)
                </Label>
                <Input
                  id="audit-log-search-filter"
                  value={auditSearchFilter}
                  placeholder="Ex: USER_STRIPE_INVOICE_REFUNDED, in_123..."
                  disabled={auditLogs.length === 0}
                  onChange={(event) => {
                    setAuditSearchFilter(event.target.value);
                    setHighlightedAuditLogId(null);
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={auditLogs.length === 0}
                onClick={() => {
                  setAuditSearchFilter("");
                  setHighlightedAuditLogId(null);
                }}
              >
                Réinitialiser
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {filteredAuditLogs.length}/{auditLogs.length} entrées affichées
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune action admin récente sur ce compte.
            </p>
          ) : filteredAuditLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun log d&apos;audit ne correspond au filtre.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredAuditLogs.map((log) => (
                <div
                  key={log.id}
                  id={`audit-log-${log.id}`}
                  className={`rounded-md border p-3 ${
                    highlightedAuditLogId === log.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(log.createdAt).toLocaleString("fr-FR")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      par {log.actorEmail}
                    </span>
                  </div>
                  {log.metadata ? (
                    <pre className="text-muted-foreground mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
