"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  commitBillingInvoicesImportAction,
  parseBillingInvoicesImportAction,
} from "@/features/freelance/billing-import.action";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import {
  formatCents,
  formatDate,
  invoiceStatusLabel,
} from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { BadgeCheck, Loader2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type InvoiceImportPreviewItem = {
  number?: string;
  clientDisplayName: string;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  status:
    | "DRAFT"
    | "ISSUED"
    | "PARTIALLY_PAID"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  notes?: string;
  lineDescription?: string;
  source: "CSV" | "PDF";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  warnings: string[];
};

type FreelanceInvoicesImportSheetProps = {
  onImported: () => Promise<void> | void;
};

export function FreelanceInvoicesImportSheet({
  onImported,
}: FreelanceInvoicesImportSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileType, setFileType] = useState<string | null>(null);
  const [mappedColumns, setMappedColumns] = useState<string[]>([]);
  const [items, setItems] = useState<InvoiceImportPreviewItem[]>([]);

  const summary = useMemo(() => {
    return items.reduce(
      (accumulator, item) => {
        return {
          total: accumulator.total + item.totalCents,
          paid: accumulator.paid + item.paidCents,
        };
      },
      { total: 0, paid: 0 },
    );
  }, [items]);

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Sélectionne un fichier CSV ou PDF");
      return;
    }

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);

      const result = await resolveActionResult(
        parseBillingInvoicesImportAction({
          formData,
        }),
      );

      setFileType(result.fileType);
      setMappedColumns(result.mappedColumns as string[]);
      setItems(result.items as InvoiceImportPreviewItem[]);
      toast.success(`${result.items.length} facture(s) détectée(s)`);
    } catch (error) {
      setItems([]);
      toast.error(
        error instanceof Error ? error.message : "Analyse impossible",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (items.length === 0) {
      toast.error("Aucune facture à importer");
      return;
    }

    setIsImporting(true);
    try {
      const result = await resolveActionResult(
        commitBillingInvoicesImportAction({
          items,
        }),
      );

      const warningCount = (result.warnings as string[]).length;
      toast.success(
        `${result.createdCount} facture(s) importée(s), ${result.createdClientsCount} client(s) créé(s), ${result.skippedCount} ignorée(s)${
          warningCount > 0 ? ` (${warningCount} alerte(s))` : ""
        }`,
      );

      setItems([]);
      setMappedColumns([]);
      setFileType(null);
      setFile(null);
      setIsOpen(false);
      await onImported();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Upload className="size-4" />
        Importer CSV/PDF
      </Button>

      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setItems([]);
            setMappedColumns([]);
            setFileType(null);
            setFile(null);
          }
        }}
      >
        <FreelanceSideSheetContent>
          <FreelanceSideSheetHeader>
            <SheetTitle>Importer des factures historiques</SheetTitle>
            <SheetDescription>
              CSV ou PDF. Analyse intelligente puis application en base avec
              logs d’audit.
            </SheetDescription>
          </FreelanceSideSheetHeader>
          <FreelanceSideSheetBody>
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="invoice-import-file">Fichier d'import</Label>
              <Input
                id="invoice-import-file"
                type="file"
                accept=".csv,application/pdf,.pdf,text/csv"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFile(nextFile);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isParsing || !file}
                  onClick={() => {
                    void handleAnalyze();
                  }}
                >
                  {isParsing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Analyser le fichier
                </Button>
                {fileType ? (
                  <Badge variant="secondary">Type: {fileType}</Badge>
                ) : null}
              </div>
              {mappedColumns.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">
                    Colonnes reconnues
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mappedColumns.map((entry) => (
                      <Badge
                        key={entry}
                        variant="outline"
                        className="font-normal"
                      >
                        {entry}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {items.length > 0 ? (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">
                      Factures détectées
                    </p>
                    <p className="text-base font-semibold">{items.length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">
                      Montant total
                    </p>
                    <p className="text-base font-semibold">
                      {formatCents(summary.total)}
                    </p>
                  </div>
                </div>
                <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div
                      key={`${item.number ?? "draft"}-${index}`}
                      className="rounded-lg border p-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {item.number
                            ? `Facture ${item.number}`
                            : `Facture importée #${index + 1}`}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline">
                            {invoiceStatusLabel[item.status]}
                          </Badge>
                          <Badge variant="secondary">{item.confidence}</Badge>
                        </div>
                      </div>
                      <p className="text-sm">{item.clientDisplayName}</p>
                      <p className="text-muted-foreground text-xs">
                        Émission: {formatDate(item.issueDate)} · Échéance:{" "}
                        {item.dueDate ? formatDate(item.dueDate) : "—"} ·{" "}
                        {item.currency}
                      </p>
                      <div className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
                        <p>Total HT: {formatCents(item.subtotalCents)}</p>
                        <p>Total TTC: {formatCents(item.totalCents)}</p>
                        <p>Payé: {formatCents(item.paidCents)}</p>
                      </div>
                      {item.warnings.length > 0 ? (
                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                          {item.warnings.join(" · ")}
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700">
                          <BadgeCheck className="size-3.5" />
                          Prêt à importer
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </FreelanceSideSheetBody>
          <FreelanceSideSheetFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isImporting || items.length === 0}
              onClick={() => {
                void handleImport();
              }}
            >
              {isImporting ? <Loader2 className="size-4 animate-spin" /> : null}
              Importer {items.length > 0 ? items.length : ""} facture(s)
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>
    </>
  );
}
