"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCreditNoteAction,
  getCreditNotesAction,
  getInvoicesAction,
} from "@/features/freelance/billing-documents.action";
import {
  buildFreelanceDocumentUrl,
  formatCents,
  formatDate,
} from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Eye, FileDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type InvoiceOption = {
  id: string;
  number: string | null;
  balanceCents: number;
  client: {
    displayName: string;
  };
};

type CreditNoteRow = {
  id: string;
  number: string | null;
  issueDate: Date | string;
  totalCents: number;
  status: string;
  reason: string | null;
  invoice: {
    number: string | null;
    client: {
      displayName: string;
    };
  };
};

export function FreelanceCreditNotesManager() {
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNoteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Correction commerciale");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [invoicesResult, creditNotesResult] = await Promise.all([
        resolveActionResult(
          getInvoicesAction({
            page: 1,
            pageSize: 200,
          }),
        ),
        resolveActionResult(
          getCreditNotesAction({
            page: 1,
            pageSize: 100,
          }),
        ),
      ]);

      const invoiceOptions = (
        invoicesResult.invoices as InvoiceOption[]
      ).filter((invoice) => invoice.balanceCents > 0);

      setInvoices(invoiceOptions);
      setCreditNotes(creditNotesResult.creditNotes as CreditNoteRow[]);

      if (!invoiceId && invoiceOptions.length > 0) {
        setInvoiceId(invoiceOptions[0]?.id ?? "");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les avoirs",
      );
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedInvoice = useMemo(() => {
    return invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  }, [invoiceId, invoices]);

  const handleCreateCreditNote = async () => {
    if (!invoiceId) {
      toast.error("Sélectionne une facture");
      return;
    }

    const amountCents =
      amount.trim().length > 0 ? Math.round(Number(amount) * 100) : undefined;

    if (
      amount.trim().length > 0 &&
      (!Number.isFinite(Number(amount)) || Number(amount) <= 0)
    ) {
      toast.error("Montant d’avoir invalide");
      return;
    }

    setIsCreating(true);
    try {
      await resolveActionResult(
        createCreditNoteAction({
          invoiceId,
          amountCents,
          reason,
        }),
      );

      toast.success("Avoir créé");
      setAmount("");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création impossible",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Créer un avoir</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Select value={invoiceId} onValueChange={setInvoiceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une facture" />
            </SelectTrigger>
            <SelectContent>
              {invoices.map((invoice) => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.number ?? "Sans numéro"} -{" "}
                  {invoice.client.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder={
              selectedInvoice
                ? `Montant max ${formatCents(selectedInvoice.balanceCents)}`
                : "Montant"
            }
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
            }}
          />
          <Input
            placeholder="Motif"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
          <div className="flex items-center">
            <Button
              type="button"
              onClick={handleCreateCreditNote}
              disabled={isCreating || !invoiceId}
            >
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
              Créer l’avoir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avoirs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des avoirs...
            </div>
          ) : creditNotes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun avoir généré.</p>
          ) : (
            <div className="space-y-2">
              {creditNotes.map((creditNote) => (
                <div
                  key={creditNote.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {creditNote.number ?? "Avoir"}
                      </span>
                      <Badge variant="outline">{creditNote.status}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Facture {creditNote.invoice.number ?? "-"} -{" "}
                      {creditNote.invoice.client.displayName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {creditNote.reason ?? "Sans motif"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCents(creditNote.totalCents)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(creditNote.issueDate)}
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Aperçu"
                        aria-label="Aperçu"
                        onClick={() => {
                          window.open(
                            buildFreelanceDocumentUrl({
                              type: "creditNote",
                              id: creditNote.id,
                              mode: "preview",
                            }),
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Télécharger PDF"
                        aria-label="Télécharger PDF"
                        onClick={() => {
                          window.open(
                            buildFreelanceDocumentUrl({
                              type: "creditNote",
                              id: creditNote.id,
                              mode: "pdf",
                              download: true,
                            }),
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                      >
                        <FileDown className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
