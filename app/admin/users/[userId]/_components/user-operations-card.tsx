"use client";

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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import {
  adjustUserAiCreditsAction,
  cancelUserStripeSubscriptionAction,
  createAdminUserNoteAction,
  createUserStripePortalAction,
  refundUserStripeInvoiceAction,
  resendUserStripeInvoiceAction,
  resumeUserStripeSubscriptionAction,
  syncUserStripeSubscriptionAction,
  updateUserSubscriptionAction,
  voidUserStripeInvoiceAction,
} from "../../_actions/user-management.action";
import {
  CircleSlash,
  Download,
  ExternalLink,
  RefreshCw,
  Save,
  Sparkles,
  Undo2,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImpersonateUserButton } from "@app/admin/_components/impersonate-user-button";

type UserOperationsCardProps = {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  subscription: {
    plan: "free" | "pro" | "ultra";
    status: string | null;
    cancelAtPeriodEnd: boolean;
    periodEnd: Date | null;
  };
  aiQuota: {
    month: number;
    year: number;
    requestsUsed: number;
    requestsLimit: number;
  } | null;
  stripeSubscriptions: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: Date | string | null;
    currentPeriodEnd: Date | string | null;
  }[];
  invoices: {
    id: string;
    status: string | null;
    total: number;
    amountPaid: number;
    amountRemaining: number;
    currency: string;
    paymentIntentId: string | null;
    collectionMethod: string | null;
    hostedInvoiceUrl: string | null;
    createdAt: Date | string;
    paidAt: Date | string | null;
  }[];
  billingTimeline: {
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
  }[];
  notes: {
    id: string;
    content: string;
    createdAt: Date | string;
    author: {
      name: string;
      email: string;
    };
  }[];
};

const toDateInputValue = (value: Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function UserOperationsCard({
  userId,
  userEmail,
  stripeCustomerId,
  subscription,
  aiQuota,
  stripeSubscriptions,
  invoices,
  billingTimeline,
  notes,
}: UserOperationsCardProps) {
  const [plan, setPlan] = useState<"free" | "pro" | "ultra">(subscription.plan);
  const [status, setStatus] = useState<
    | "trialing"
    | "active"
    | "canceled"
    | "past_due"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired"
  >(
    (subscription.status as
      | "trialing"
      | "active"
      | "canceled"
      | "past_due"
      | "unpaid"
      | "incomplete"
      | "incomplete_expired"
      | null) ?? "active",
  );
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(
    subscription.cancelAtPeriodEnd,
  );
  const [periodEnd, setPeriodEnd] = useState(toDateInputValue(subscription.periodEnd));

  const now = new Date();
  const [creditMode, setCreditMode] = useState<"add" | "set">("add");
  const [creditAmount, setCreditAmount] = useState("20");
  const [creditMonth, setCreditMonth] = useState(aiQuota?.month ?? now.getMonth() + 1);
  const [creditYear, setCreditYear] = useState(aiQuota?.year ?? now.getFullYear());
  const [requestsUsed, setRequestsUsed] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [selectedStripeSubscriptionId, setSelectedStripeSubscriptionId] = useState(
    stripeSubscriptions[0]?.id ?? "",
  );
  const [stripeActionReason, setStripeActionReason] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id ?? "");
  const [invoiceActionReason, setInvoiceActionReason] = useState("");
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [partialRefundAmount, setPartialRefundAmount] = useState("");
  const [refundStripeReason, setRefundStripeReason] = useState<
    "duplicate" | "fraudulent" | "requested_by_customer"
  >("requested_by_customer");

  const [note, setNote] = useState("");

  const quotaSubtitle = useMemo(() => {
    if (!aiQuota) return "Aucun quota défini ce mois-ci";
    return `${aiQuota.requestsUsed}/${aiQuota.requestsLimit} crédits utilisés (${aiQuota.month}/${aiQuota.year})`;
  }, [aiQuota]);

  const selectedStripeSubscription = useMemo(
    () =>
      stripeSubscriptions.find(
        (subscriptionItem) => subscriptionItem.id === selectedStripeSubscriptionId,
      ) ?? null,
    [selectedStripeSubscriptionId, stripeSubscriptions],
  );
  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [selectedInvoiceId, invoices],
  );

  const requestStrongConfirmation = (label: string) =>
    window.prompt(
      `Action sensible: ${label}\nTape CONFIRMER pour continuer.`,
    ) === "CONFIRMER";

  const exportBillingTimelineCsv = () => {
    if (billingTimeline.length === 0) {
      toast.error("Aucun événement de facturation à exporter");
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

    const rows = billingTimeline.map((item) => [
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
    link.download = `billing-timeline-${userId}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Export CSV généré");
  };

  const updateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await resolveActionResult(
        updateUserSubscriptionAction({
          userId,
          plan,
          status,
          cancelAtPeriodEnd,
          periodEnd: periodEnd
            ? new Date(`${periodEnd}T23:59:59.999Z`).toISOString()
            : undefined,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Abonnement mis à jour");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const syncStripeMutation = useMutation({
    mutationFn: async () => {
      await resolveActionResult(syncUserStripeSubscriptionAction({ userId }));
    },
    onSuccess: () => {
      toast.success("Synchronisation Stripe terminée");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openStripePortalMutation = useMutation({
    mutationFn: async () => {
      const result = await resolveActionResult(
        createUserStripePortalAction({ userId }),
      );
      window.open(result.url, "_blank", "noopener,noreferrer");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const cancelStripeSubscriptionMutation = useMutation({
    mutationFn: async (mode: "period_end" | "immediate") => {
      if (!selectedStripeSubscriptionId) {
        throw new Error("Sélectionne d'abord un abonnement Stripe");
      }
      const reason = stripeActionReason.trim();
      if (reason.length < 6) {
        throw new Error("Renseigne une raison (6 caractères minimum)");
      }
      if (mode === "immediate" && !requestStrongConfirmation("Annulation immédiate")) {
        throw new Error("Confirmation annulée");
      }

      await resolveActionResult(
        cancelUserStripeSubscriptionAction({
          userId,
          subscriptionId: selectedStripeSubscriptionId,
          mode,
          adminReason: reason,
        }),
      );
    },
    onSuccess: (_data, mode) => {
      toast.success(
        mode === "immediate"
          ? "Abonnement Stripe annulé immédiatement"
          : "Abonnement Stripe annulé en fin de période",
      );
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resumeStripeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStripeSubscriptionId) {
        throw new Error("Sélectionne d'abord un abonnement Stripe");
      }
      const reason = stripeActionReason.trim();
      if (reason.length < 6) {
        throw new Error("Renseigne une raison (6 caractères minimum)");
      }

      await resolveActionResult(
        resumeUserStripeSubscriptionAction({
          userId,
          subscriptionId: selectedStripeSubscriptionId,
          adminReason: reason,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Renouvellement Stripe réactivé");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(creditAmount);
      const parsedRequestsUsed = requestsUsed ? Number(requestsUsed) : undefined;
      const reason = creditReason.trim();

      if (!Number.isInteger(amount) || amount < 0) {
        throw new Error("Montant de crédits invalide");
      }
      if (creditMode === "add" && amount <= 0) {
        throw new Error("Le montant à ajouter doit être supérieur à 0");
      }
      if (!Number.isInteger(creditMonth) || creditMonth < 1 || creditMonth > 12) {
        throw new Error("Mois invalide");
      }
      if (!Number.isInteger(creditYear) || creditYear < 2020 || creditYear > 2100) {
        throw new Error("Année invalide");
      }
      if (
        parsedRequestsUsed !== undefined &&
        (!Number.isInteger(parsedRequestsUsed) || parsedRequestsUsed < 0)
      ) {
        throw new Error("Requests used invalide");
      }
      if (reason.length < 6) {
        throw new Error("Renseigne une raison (6 caractères minimum)");
      }

      await resolveActionResult(
        adjustUserAiCreditsAction({
          userId,
          month: creditMonth,
          year: creditYear,
          mode: creditMode,
          amount,
          requestsUsed: parsedRequestsUsed,
          reason,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Crédits IA mis à jour");
      setCreditReason("");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const refundInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoiceId) {
        throw new Error("Sélectionne une facture");
      }
      const reason = invoiceActionReason.trim();
      if (reason.length < 6) {
        throw new Error("Renseigne une raison support (6 caractères minimum)");
      }

      const partialAmount = Number.parseInt(partialRefundAmount || "0", 10);
      const amount = refundType === "partial" ? partialAmount : undefined;

      if (
        refundType === "partial" &&
        (!Number.isInteger(partialAmount) || partialAmount <= 0)
      ) {
        throw new Error("Montant de remboursement partiel invalide");
      }

      if (!requestStrongConfirmation("Remboursement facture Stripe")) {
        throw new Error("Confirmation annulée");
      }

      await resolveActionResult(
        refundUserStripeInvoiceAction({
          userId,
          invoiceId: selectedInvoiceId,
          mode: refundType,
          amount,
          stripeReason: refundStripeReason,
          adminReason: reason,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Remboursement Stripe effectué");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const voidInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoiceId) {
        throw new Error("Sélectionne une facture");
      }
      const reason = invoiceActionReason.trim();
      if (reason.length < 6) {
        throw new Error("Renseigne une raison support (6 caractères minimum)");
      }
      if (!requestStrongConfirmation("Void facture Stripe")) {
        throw new Error("Confirmation annulée");
      }

      await resolveActionResult(
        voidUserStripeInvoiceAction({
          userId,
          invoiceId: selectedInvoiceId,
          adminReason: reason,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Facture Stripe void");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resendInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoiceId) {
        throw new Error("Sélectionne une facture");
      }
      const reason = invoiceActionReason.trim();
      if (reason.length < 6) {
        throw new Error("Renseigne une raison support (6 caractères minimum)");
      }

      await resolveActionResult(
        resendUserStripeInvoiceAction({
          userId,
          invoiceId: selectedInvoiceId,
          adminReason: reason,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Facture Stripe renvoyée");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!note.trim()) {
        throw new Error("Le commentaire est vide");
      }
      await resolveActionResult(
        createAdminUserNoteAction({
          userId,
          content: note.trim(),
        }),
      );
    },
    onSuccess: () => {
      toast.success("Note ajoutée");
      setNote("");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Card data-testid="admin-user-operations-card">
      <CardHeader>
        <CardTitle>Opérations Admin 360</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4" />
            <h3 className="text-sm font-semibold">Plan et facturation</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Plan</Label>
              <Select
                value={plan}
                onValueChange={(value) =>
                  setPlan(value as "free" | "pro" | "ultra")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">free</SelectItem>
                  <SelectItem value="pro">pro</SelectItem>
                  <SelectItem value="ultra">ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut abonnement</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(
                    value as
                      | "trialing"
                      | "active"
                      | "canceled"
                      | "past_due"
                      | "unpaid"
                      | "incomplete"
                      | "incomplete_expired",
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trialing">trialing</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="canceled">canceled</SelectItem>
                  <SelectItem value="past_due">past_due</SelectItem>
                  <SelectItem value="unpaid">unpaid</SelectItem>
                  <SelectItem value="incomplete">incomplete</SelectItem>
                  <SelectItem value="incomplete_expired">
                    incomplete_expired
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="block">Annulation en fin de période</Label>
              <div className="flex h-9 items-center">
                <Switch
                  checked={cancelAtPeriodEnd}
                  onCheckedChange={setCancelAtPeriodEnd}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => updateSubscriptionMutation.mutate()}
              disabled={updateSubscriptionMutation.isPending}
            >
              <Save className="mr-2 size-4" />
              Enregistrer plan
            </Button>
            <Button
              variant="outline"
              onClick={() => syncStripeMutation.mutate()}
              disabled={syncStripeMutation.isPending}
            >
              <RefreshCw className="mr-2 size-4" />
              Sync Stripe
            </Button>
            <Button
              variant="outline"
              onClick={() => openStripePortalMutation.mutate()}
              disabled={openStripePortalMutation.isPending || !stripeCustomerId}
            >
              <ExternalLink className="mr-2 size-4" />
              Portail Stripe
            </Button>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <h4 className="text-sm font-medium">Contrôle abonnement Stripe</h4>
            {stripeSubscriptions.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Aucun abonnement Stripe détecté sur ce client.
              </p>
            ) : (
              <>
                <Select
                  value={selectedStripeSubscriptionId}
                  onValueChange={setSelectedStripeSubscriptionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stripeSubscriptions.map((stripeSubscription) => (
                      <SelectItem key={stripeSubscription.id} value={stripeSubscription.id}>
                        {stripeSubscription.id} · {stripeSubscription.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStripeSubscription ? (
                  <p className="text-muted-foreground text-xs">
                    Statut: {selectedStripeSubscription.status} · Annulation en fin
                    de période: {selectedStripeSubscription.cancelAtPeriodEnd ? "oui" : "non"}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      cancelStripeSubscriptionMutation.mutate("period_end")
                    }
                    disabled={
                      cancelStripeSubscriptionMutation.isPending ||
                      !selectedStripeSubscriptionId
                    }
                  >
                    <CircleSlash className="mr-2 size-4" />
                    Annuler fin de période
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      cancelStripeSubscriptionMutation.mutate("immediate")
                    }
                    disabled={
                      cancelStripeSubscriptionMutation.isPending ||
                      !selectedStripeSubscriptionId
                    }
                  >
                    <CircleSlash className="mr-2 size-4" />
                    Annuler immédiatement
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => resumeStripeSubscriptionMutation.mutate()}
                    disabled={
                      resumeStripeSubscriptionMutation.isPending ||
                      !selectedStripeSubscriptionId ||
                      !selectedStripeSubscription?.cancelAtPeriodEnd
                    }
                  >
                    <Undo2 className="mr-2 size-4" />
                    Reprendre renouvellement
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label>Raison (obligatoire)</Label>
                  <Textarea
                    rows={2}
                    value={stripeActionReason}
                    placeholder="Ex: demande client validée, incident de facturation, geste commercial..."
                    onChange={(event) => setStripeActionReason(event.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <h3 className="text-sm font-semibold">Crédits IA</h3>
          </div>
          <p className="text-muted-foreground text-xs">{quotaSubtitle}</p>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-1">
              <Label>Mode</Label>
              <Select
                value={creditMode}
                onValueChange={(value) => setCreditMode(value as "add" | "set")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Ajouter</SelectItem>
                  <SelectItem value="set">Remplacer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Montant</Label>
              <Input
                type="number"
                min={creditMode === "set" ? 0 : 1}
                value={creditAmount}
                onChange={(event) => setCreditAmount(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Mois</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={creditMonth}
                onChange={(event) =>
                  setCreditMonth(Number.parseInt(event.target.value || "0", 10))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Année</Label>
              <Input
                type="number"
                min={2020}
                max={2100}
                value={creditYear}
                onChange={(event) =>
                  setCreditYear(Number.parseInt(event.target.value || "0", 10))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Requests used (optionnel)</Label>
              <Input
                type="number"
                min={0}
                value={requestsUsed}
                onChange={(event) => setRequestsUsed(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Raison de l'ajustement (obligatoire)</Label>
            <Textarea
              rows={2}
              value={creditReason}
              placeholder="Ex: geste commercial 50 crédits suite incident API"
              onChange={(event) => setCreditReason(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => adjustCreditsMutation.mutate()}
            disabled={adjustCreditsMutation.isPending}
          >
            Mettre à jour les crédits IA
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Support facturation</h3>
            <Button variant="outline" size="sm" onClick={exportBillingTimelineCsv}>
              <Download className="mr-2 size-4" />
              Export timeline CSV
            </Button>
          </div>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune facture Stripe disponible.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Facture</Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.id} · {invoice.status ?? "n/a"} ·{" "}
                        {(invoice.total / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedInvoice ? (
                <p className="text-muted-foreground text-xs">
                  Payé: {(selectedInvoice.amountPaid / 100).toFixed(2)}{" "}
                  {selectedInvoice.currency.toUpperCase()} · Reste:{" "}
                  {(selectedInvoice.amountRemaining / 100).toFixed(2)}{" "}
                  {selectedInvoice.currency.toUpperCase()} · PI:{" "}
                  {selectedInvoice.paymentIntentId ?? "none"}
                </p>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Type remboursement</Label>
                  <Select
                    value={refundType}
                    onValueChange={(value) => setRefundType(value as "full" | "partial")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Total</SelectItem>
                      <SelectItem value="partial">Partiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Montant partiel (centimes)</Label>
                  <Input
                    type="number"
                    min={1}
                    disabled={refundType !== "partial"}
                    value={partialRefundAmount}
                    onChange={(event) => setPartialRefundAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Motif Stripe</Label>
                  <Select
                    value={refundStripeReason}
                    onValueChange={(value) =>
                      setRefundStripeReason(
                        value as "duplicate" | "fraudulent" | "requested_by_customer",
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested_by_customer">
                        requested_by_customer
                      </SelectItem>
                      <SelectItem value="duplicate">duplicate</SelectItem>
                      <SelectItem value="fraudulent">fraudulent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Raison support (obligatoire)</Label>
                <Textarea
                  rows={2}
                  value={invoiceActionReason}
                  placeholder="Ex: remboursement demandé par le client, erreur de facturation..."
                  onChange={(event) => setInvoiceActionReason(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => refundInvoiceMutation.mutate()}
                  disabled={refundInvoiceMutation.isPending || !selectedInvoiceId}
                >
                  Rembourser
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resendInvoiceMutation.mutate()}
                  disabled={resendInvoiceMutation.isPending || !selectedInvoiceId}
                >
                  Renvoyer facture
                </Button>
                <Button
                  variant="outline"
                  onClick={() => voidInvoiceMutation.mutate()}
                  disabled={voidInvoiceMutation.isPending || !selectedInvoiceId}
                >
                  Void facture
                </Button>
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Impersonation</h3>
          <p className="text-muted-foreground text-xs">
            Ouvre une session en tant qu&apos;utilisateur pour reproduire un bug ou
            valider un parcours.
          </p>
          <ImpersonateUserButton userId={userId} userEmail={userEmail} />
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Notes support internes</h3>
          <Textarea
            rows={4}
            value={note}
            placeholder="Ajouter un contexte de support, incident, remboursement, décision..."
            onChange={(event) => setNote(event.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => createNoteMutation.mutate()}
            disabled={createNoteMutation.isPending}
          >
            Ajouter la note
          </Button>
          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune note interne.
              </p>
            ) : (
              notes.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {new Date(item.createdAt).toLocaleString("fr-FR")} ·{" "}
                    {item.author.name} ({item.author.email})
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
