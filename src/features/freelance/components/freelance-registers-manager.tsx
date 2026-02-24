"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  exportBillingCompliancePackageAction,
  getBillingDashboardSnapshotAction,
  getBillingPaymentsAction,
  getCreditNotesAction,
  getInvoicesAction,
} from "@/features/freelance/billing-documents.action";
import { formatCents } from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { downloadCsv, generateCsv } from "@/lib/csv-export";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type InvoiceRegisterRow = {
  number: string | null;
  status: string;
  issueDate: Date | string;
  dueDate: Date | string | null;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  client: {
    displayName: string;
  };
  lines: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    vatRatePercent: number;
  }[];
};

type PaymentRegisterRow = {
  amountCents: number;
  method: string;
  status: string;
  paidAt: Date | string;
  client: {
    displayName: string;
  };
  allocations: {
    invoice: {
      number: string | null;
    };
  }[];
};

type CreditNoteRegisterRow = {
  number: string | null;
  issueDate: Date | string;
  totalCents: number;
  taxCents: number;
  status: string;
  reason: string | null;
  invoice: {
    number: string | null;
    client: {
      displayName: string;
    };
  };
};

type DeclarationRegisterRow = {
  id: string;
  periodKey: string;
  dueDate: Date | string;
  type: string;
  invoicedCents: number;
  collectedCents: number;
  socialChargesCents: number;
};

type FreelanceRegistersManagerProps = {
  canUseAdvancedExports?: boolean;
};

export function FreelanceRegistersManager({
  canUseAdvancedExports = true,
}: FreelanceRegistersManagerProps) {
  const [invoices, setInvoices] = useState<InvoiceRegisterRow[]>([]);
  const [payments, setPayments] = useState<PaymentRegisterRow[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNoteRegisterRow[]>([]);
  const [declarations, setDeclarations] = useState<DeclarationRegisterRow[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingCompliance, setIsExportingCompliance] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [firstInvoices, firstPayments, firstCreditNotes, snapshotResult] =
        await Promise.all([
          resolveActionResult(getInvoicesAction({ page: 1, pageSize: 100 })),
          resolveActionResult(
            getBillingPaymentsAction({ page: 1, pageSize: 100 }),
          ),
          resolveActionResult(getCreditNotesAction({ page: 1, pageSize: 100 })),
          resolveActionResult(getBillingDashboardSnapshotAction({})),
        ]);

      const remainingPages: Promise<void>[] = [];
      const allInvoices = [...(firstInvoices.invoices as InvoiceRegisterRow[])];
      const allPayments = [...(firstPayments.payments as PaymentRegisterRow[])];
      const allCreditNotes = [
        ...(firstCreditNotes.creditNotes as CreditNoteRegisterRow[]),
      ];

      for (let p = 2; p <= firstInvoices.totalPages; p++) {
        const page = p;
        remainingPages.push(
          resolveActionResult(getInvoicesAction({ page, pageSize: 100 })).then(
            (r) => {
              allInvoices.push(...(r.invoices as InvoiceRegisterRow[]));
            },
          ),
        );
      }

      for (let p = 2; p <= firstPayments.totalPages; p++) {
        const page = p;
        remainingPages.push(
          resolveActionResult(
            getBillingPaymentsAction({ page, pageSize: 100 }),
          ).then((r) => {
            allPayments.push(...(r.payments as PaymentRegisterRow[]));
          }),
        );
      }

      for (let p = 2; p <= firstCreditNotes.totalPages; p++) {
        const page = p;
        remainingPages.push(
          resolveActionResult(
            getCreditNotesAction({ page, pageSize: 100 }),
          ).then((r) => {
            allCreditNotes.push(...(r.creditNotes as CreditNoteRegisterRow[]));
          }),
        );
      }

      await Promise.all(remainingPages);

      setInvoices(allInvoices);
      setPayments(allPayments);
      setCreditNotes(allCreditNotes);
      setDeclarations(snapshotResult.declarations as DeclarationRegisterRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les registres",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalInvoicedCents = useMemo(() => {
    return invoices.reduce((acc, invoice) => acc + invoice.totalCents, 0);
  }, [invoices]);

  const totalCollectedCents = useMemo(() => {
    return payments.reduce((acc, payment) => acc + payment.amountCents, 0);
  }, [payments]);

  const totalCreditedCents = useMemo(() => {
    return creditNotes.reduce(
      (acc, creditNote) => acc + creditNote.totalCents,
      0,
    );
  }, [creditNotes]);

  const exportInvoices = () => {
    const csv = generateCsv(
      invoices.map((invoice) => ({
        numero: invoice.number ?? "",
        client: invoice.client.displayName,
        statut: invoice.status,
        date_emission: new Date(invoice.issueDate).toISOString().slice(0, 10),
        date_echeance: invoice.dueDate
          ? new Date(invoice.dueDate).toISOString().slice(0, 10)
          : "",
        total_eur: (invoice.totalCents / 100).toFixed(2),
        encaisse_eur: (invoice.paidCents / 100).toFixed(2),
        reste_du_eur: (invoice.balanceCents / 100).toFixed(2),
      })),
      [
        { key: "numero", header: "Numero" },
        { key: "client", header: "Client" },
        { key: "statut", header: "Statut" },
        { key: "date_emission", header: "Date emission" },
        { key: "date_echeance", header: "Date echeance" },
        { key: "total_eur", header: "Total EUR" },
        { key: "encaisse_eur", header: "Encaisse EUR" },
        { key: "reste_du_eur", header: "Reste du EUR" },
      ],
    );

    downloadCsv(csv, "jobio-register-factures.csv");
    toast.success("Export factures généré");
  };

  const exportInvoiceLines = () => {
    const csv = generateCsv(
      invoices.flatMap((invoice) =>
        invoice.lines.map((line, lineIndex) => ({
          facture: invoice.number ?? "",
          ligne: lineIndex + 1,
          client: invoice.client.displayName,
          date_emission: new Date(invoice.issueDate).toISOString().slice(0, 10),
          description: line.description,
          quantite: line.quantity,
          pu_ht_eur: (line.unitPriceCents / 100).toFixed(2),
          taux_tva_percent: line.vatRatePercent.toFixed(2),
          total_ht_eur: (line.subtotalCents / 100).toFixed(2),
          total_tva_eur: (line.taxCents / 100).toFixed(2),
          total_ttc_eur: (line.totalCents / 100).toFixed(2),
        })),
      ),
      [
        { key: "facture", header: "Facture" },
        { key: "ligne", header: "Ligne" },
        { key: "client", header: "Client" },
        { key: "date_emission", header: "Date emission" },
        { key: "description", header: "Description" },
        { key: "quantite", header: "Quantite" },
        { key: "pu_ht_eur", header: "PU HT EUR" },
        { key: "taux_tva_percent", header: "Taux TVA %" },
        { key: "total_ht_eur", header: "Total HT EUR" },
        { key: "total_tva_eur", header: "Total TVA EUR" },
        { key: "total_ttc_eur", header: "Total TTC EUR" },
      ],
    );

    downloadCsv(csv, "jobio-register-ventes-lignes.csv");
    toast.success("Export journal de ventes généré");
  };

  const exportPayments = () => {
    const csv = generateCsv(
      payments.map((payment) => ({
        client: payment.client.displayName,
        facture: payment.allocations.at(0)?.invoice.number ?? "",
        statut: payment.status,
        methode: payment.method,
        date_paiement: new Date(payment.paidAt).toISOString().slice(0, 10),
        montant_eur: (payment.amountCents / 100).toFixed(2),
      })),
      [
        { key: "client", header: "Client" },
        { key: "facture", header: "Facture" },
        { key: "statut", header: "Statut" },
        { key: "methode", header: "Methode" },
        { key: "date_paiement", header: "Date paiement" },
        { key: "montant_eur", header: "Montant EUR" },
      ],
    );

    downloadCsv(csv, "jobio-register-paiements.csv");
    toast.success("Export paiements généré");
  };

  const exportCreditNotes = () => {
    const csv = generateCsv(
      creditNotes.map((creditNote) => ({
        numero_avoir: creditNote.number ?? "",
        facture_source: creditNote.invoice.number ?? "",
        client: creditNote.invoice.client.displayName,
        statut: creditNote.status,
        date_emission: new Date(creditNote.issueDate)
          .toISOString()
          .slice(0, 10),
        montant_ttc_eur: (creditNote.totalCents / 100).toFixed(2),
        montant_tva_eur: (creditNote.taxCents / 100).toFixed(2),
        motif: creditNote.reason ?? "",
      })),
      [
        { key: "numero_avoir", header: "Numero avoir" },
        { key: "facture_source", header: "Facture source" },
        { key: "client", header: "Client" },
        { key: "statut", header: "Statut" },
        { key: "date_emission", header: "Date emission" },
        { key: "montant_ttc_eur", header: "Montant TTC EUR" },
        { key: "montant_tva_eur", header: "Montant TVA EUR" },
        { key: "motif", header: "Motif" },
      ],
    );

    downloadCsv(csv, "jobio-register-avoirs.csv");
    toast.success("Export avoirs généré");
  };

  const exportDeclarations = () => {
    const csv = generateCsv(
      declarations.map((period) => ({
        periode: period.periodKey,
        type: period.type,
        date_echeance: new Date(period.dueDate).toISOString().slice(0, 10),
        ca_facture_eur: (period.invoicedCents / 100).toFixed(2),
        ca_encaisse_eur: (period.collectedCents / 100).toFixed(2),
        charges_urssaf_estimees_eur: (period.socialChargesCents / 100).toFixed(
          2,
        ),
      })),
      [
        { key: "periode", header: "Periode" },
        { key: "type", header: "Type" },
        { key: "date_echeance", header: "Date echeance" },
        { key: "ca_facture_eur", header: "CA facture EUR" },
        { key: "ca_encaisse_eur", header: "CA encaisse EUR" },
        {
          key: "charges_urssaf_estimees_eur",
          header: "Charges URSSAF estimees EUR",
        },
      ],
    );

    downloadCsv(csv, "jobio-register-declarations-urssaf.csv");
    toast.success("Export déclarations généré");
  };

  const exportCompliancePackage = async () => {
    setIsExportingCompliance(true);
    try {
      const result = await resolveActionResult(
        exportBillingCompliancePackageAction({
          includeExpenses: true,
        }),
      );

      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const blob = new Blob([bytes], {
        type: result.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Package conformité téléchargé");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Export package conformité impossible",
      );
    } finally {
      setIsExportingCompliance(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registres comptables</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Chargement des registres...
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Total facturé</p>
                <p className="text-xl font-semibold">
                  {formatCents(totalInvoicedCents)}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">Total encaissé</p>
                <p className="text-xl font-semibold">
                  {formatCents(totalCollectedCents)}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-xs">
                  Total des avoirs
                </p>
                <p className="text-xl font-semibold">
                  {formatCents(totalCreditedCents)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={exportInvoices}>
                <Download className="size-4" />
                Export factures CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportInvoiceLines}
                disabled={!canUseAdvancedExports}
              >
                <Download className="size-4" />
                Export journal ventes (lignes)
              </Button>
              <Button type="button" variant="outline" onClick={exportPayments}>
                <Download className="size-4" />
                Export paiements CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportCreditNotes}
                disabled={!canUseAdvancedExports}
              >
                <Download className="size-4" />
                Export avoirs CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportDeclarations}
                disabled={!canUseAdvancedExports}
              >
                <Download className="size-4" />
                Export déclarations URSSAF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void exportCompliancePackage();
                }}
                disabled={isExportingCompliance}
              >
                {isExportingCompliance ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Package conformité (ZIP)
              </Button>
            </div>
            {!canUseAdvancedExports && (
              <p className="text-muted-foreground text-xs">
                Les exports avancés (journal détaillé, avoirs, déclarations
                URSSAF) sont disponibles à partir du plan Pro.{" "}
                <Link href="/account/billing" className="underline">
                  Mettre à niveau
                </Link>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
