"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  commitBillingClientsImportAction,
  parseBillingClientsImportAction,
} from "@/features/freelance/billing-import.action";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { BadgeCheck, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ClientImportPreviewItem = {
  type: "COMPANY" | "INDIVIDUAL";
  displayName: string;
  legalName?: string;
  siret?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  countryCode: string;
  notes?: string;
  contacts: {
    firstName?: string;
    lastName?: string;
    role?: string;
    email?: string;
    phone?: string;
    includeInEmail: boolean;
    isPrimary: boolean;
    notes?: string;
  }[];
  source: "CSV" | "PDF";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  warnings: string[];
};

type FreelanceClientsImportSheetProps = {
  onImported: () => Promise<void> | void;
};

export function FreelanceClientsImportSheet({
  onImported,
}: FreelanceClientsImportSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileType, setFileType] = useState<string | null>(null);
  const [mappedColumns, setMappedColumns] = useState<string[]>([]);
  const [items, setItems] = useState<ClientImportPreviewItem[]>([]);

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
        parseBillingClientsImportAction({
          formData,
        }),
      );

      setFileType(result.fileType);
      setMappedColumns(result.mappedColumns as string[]);
      setItems(result.items as ClientImportPreviewItem[]);
      toast.success(`${result.items.length} client(s) détecté(s)`);
    } catch (error) {
      setItems([]);
      toast.error(error instanceof Error ? error.message : "Analyse impossible");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (items.length === 0) {
      toast.error("Aucun client à importer");
      return;
    }

    setIsImporting(true);
    try {
      const result = await resolveActionResult(
        commitBillingClientsImportAction({
          items,
        }),
      );

      toast.success(
        `${result.createdCount} client(s) créés, ${result.updatedCount} enrichi(s), ${result.skippedCount} ignoré(s)`,
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
            <SheetTitle>Importer des clients</SheetTitle>
            <SheetDescription>
              Import CSV/PDF avec extraction intelligente et application guidée.
            </SheetDescription>
          </FreelanceSideSheetHeader>
          <FreelanceSideSheetBody>
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="client-import-file">Fichier d'import</Label>
              <Input
                id="client-import-file"
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
                  {isParsing ? <Loader2 className="size-4 animate-spin" /> : null}
                  Analyser le fichier
                </Button>
                {fileType ? <Badge variant="secondary">Type: {fileType}</Badge> : null}
              </div>
              {mappedColumns.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">
                    Colonnes reconnues
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mappedColumns.map((entry) => (
                      <Badge key={entry} variant="outline" className="font-normal">
                        {entry}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {items.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Clients détectés</p>
                  <p className="text-base font-semibold">{items.length}</p>
                </div>

                <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={`${item.displayName}-${index}`} className="rounded-lg border p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{item.displayName}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline">
                            {item.type === "COMPANY" ? "Professionnel" : "Particulier"}
                          </Badge>
                          <Badge variant="secondary">{item.confidence}</Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {item.addressLine1}, {item.postalCode} {item.city} ·{" "}
                        {item.countryCode}
                      </p>
                      <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                        <p>SIRET: {item.siret ?? "—"}</p>
                        <p>TVA: {item.vatNumber ?? "—"}</p>
                        <p>Email: {item.email ?? "—"}</p>
                        <p>Téléphone: {item.phone ?? "—"}</p>
                        <p>Contacts importés: {item.contacts.length}</p>
                      </div>
                      {item.contacts.length > 0 ? (
                        <div className="bg-muted mt-2 rounded-md border p-2 text-xs">
                          <p className="font-medium">Contact principal détecté</p>
                          <p>
                            {item.contacts.find((contact) => contact.isPrimary)?.firstName ??
                              item.contacts[0]?.firstName ??
                              ""}
                            {" "}
                            {item.contacts.find((contact) => contact.isPrimary)?.lastName ??
                              item.contacts[0]?.lastName ??
                              ""}
                          </p>
                          <p>
                            {item.contacts.find((contact) => contact.isPrimary)?.email ??
                              item.contacts[0]?.email ??
                              "Email non détecté"}
                          </p>
                        </div>
                      ) : null}
                      {item.warnings.length > 0 ? (
                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                          {item.warnings.join(" · ")}
                        </div>
                      ) : (
                        <div className="text-emerald-700 mt-2 inline-flex items-center gap-1 text-xs">
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
              Importer {items.length > 0 ? items.length : ""} client(s)
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>
    </>
  );
}
