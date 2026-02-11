"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { LoadingButton } from "@/features/form/submit-button";
import { importContactsAction } from "@/features/contacts/import-contacts.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const CONTACT_FIELDS = [
  { key: "firstName", label: "Prenom" },
  { key: "lastName", label: "Nom" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telephone" },
  { key: "company", label: "Entreprise" },
  { key: "role", label: "Fonction" },
  { key: "linkedinUrl", label: "LinkedIn" },
  { key: "tags", label: "Tags" },
] as const;

type ContactFieldKey = (typeof CONTACT_FIELDS)[number]["key"];

const COLUMN_ALIASES: Record<ContactFieldKey, string[]> = {
  firstName: ["prenom", "prénom", "first_name", "first name", "firstname"],
  lastName: ["nom", "last_name", "last name", "lastname", "name"],
  email: ["e-mail", "mail", "email", "courriel"],
  phone: ["telephone", "téléphone", "tel", "phone", "mobile"],
  company: ["entreprise", "société", "societe", "company", "organization"],
  role: ["poste", "fonction", "title", "role", "job_title", "job title"],
  linkedinUrl: ["linkedin", "linkedin_url", "linkedin url", "linkedinurl"],
  tags: ["tags", "labels", "categories", "etiquettes"],
};

const IGNORE_VALUE = "__ignore__";

function autoMapColumn(header: string): ContactFieldKey | typeof IGNORE_VALUE {
  const normalized = header.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(normalized) || normalized === field.toLowerCase()) {
      return field as ContactFieldKey;
    }
  }
  return IGNORE_VALUE;
}

type ImportResult = {
  created: number;
  skipped: number;
  errors: { line: number; error: string }[];
};

type ImportContactsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ImportContactsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportContactsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<
    Record<number, ContactFieldKey | typeof IGNORE_VALUE>
  >({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Seuls les fichiers CSV sont acceptes");
      return;
    }

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (parsed) => {
        if (parsed.data.length < 2) {
          toast.error(
            "Le fichier CSV doit contenir au moins un en-tete et une ligne de donnees",
          );
          return;
        }

        const csvHeaders = parsed.data[0];
        const csvRows = parsed.data.slice(1);

        setHeaders(csvHeaders);
        setRows(csvRows);
        setResult(null);

        const autoMapping: Record<
          number,
          ContactFieldKey | typeof IGNORE_VALUE
        > = {};
        csvHeaders.forEach((header, index) => {
          autoMapping[index] = autoMapColumn(header);
        });
        setMapping(autoMapping);
      },
      error: () => {
        toast.error("Erreur lors de la lecture du fichier CSV");
      },
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0] as File | undefined;
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    const firstNameCol = Object.entries(mapping).find(
      ([, v]) => v === "firstName",
    );
    const lastNameCol = Object.entries(mapping).find(
      ([, v]) => v === "lastName",
    );

    if (!firstNameCol || !lastNameCol) {
      toast.error("Les colonnes Prenom et Nom sont obligatoires");
      return;
    }

    const contacts = rows
      .map((row) => {
        const contact: Record<string, string | string[] | null> = {};
        Object.entries(mapping).forEach(([colIndex, field]) => {
          if (field === IGNORE_VALUE) return;
          const value = row[Number(colIndex)]?.trim() ?? "";
          if (field === "tags") {
            contact[field] = value
              ? value
                  .split(/[,;]/)
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [];
          } else {
            contact[field] = value || null;
          }
        });
        return contact;
      })
      .filter(
        (c) =>
          c.firstName &&
          typeof c.firstName === "string" &&
          c.lastName &&
          typeof c.lastName === "string",
      )
      .map((c) => ({
        firstName: c.firstName as string,
        lastName: c.lastName as string,
        email: (c.email as string) || null,
        phone: (c.phone as string) || null,
        company: (c.company as string) || null,
        role: (c.role as string) || null,
        linkedinUrl: (c.linkedinUrl as string) || null,
        tags: Array.isArray(c.tags) ? c.tags : [],
      }));

    if (contacts.length === 0) {
      toast.error("Aucun contact valide trouve dans le fichier");
      return;
    }

    setIsImporting(true);
    try {
      const importResult = await resolveActionResult(
        importContactsAction({ contacts, skipDuplicates }),
      );
      setResult(importResult);
      if (importResult.created > 0) {
        toast.success(`${importResult.created} contact(s) importes`);
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const mappedFields = new Set(
    Object.values(mapping).filter((v) => v !== IGNORE_VALUE),
  );

  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer des contacts</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="text-success size-4" />
                <span>{result.created} contact(s) cree(s)</span>
              </div>
              {result.skipped > 0 && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <AlertCircle className="size-4" />
                  <span>{result.skipped} doublon(s) ignore(s)</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="size-4" />
                    <span>{result.errors.length} erreur(s)</span>
                  </div>
                  <div className="bg-muted max-h-32 overflow-y-auto rounded p-2 text-xs">
                    {result.errors.map((err) => (
                      <div key={err.line}>
                        Ligne {err.line}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Importer un autre fichier
              </Button>
              <Button onClick={() => handleClose(false)}>Fermer</Button>
            </div>
          </div>
        ) : headers.length === 0 ? (
          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="text-muted-foreground size-10" />
            <div className="text-center">
              <p className="text-sm font-medium">Glisse ton fichier CSV ici</p>
              <p className="text-muted-foreground text-xs">
                ou clique pour parcourir
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium">
                Mapping des colonnes ({rows.length} lignes detectees)
              </p>
              <p className="text-muted-foreground text-xs">
                Associe chaque colonne du CSV a un champ contact
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="min-w-[120px] justify-center"
                  >
                    {header}
                  </Badge>
                  <span className="text-muted-foreground text-xs">→</span>
                  <Select
                    value={mapping[index] ?? IGNORE_VALUE}
                    onValueChange={(value) => {
                      setMapping((prev) => ({
                        ...prev,
                        [index]: value as ContactFieldKey | typeof IGNORE_VALUE,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IGNORE_VALUE}>
                        -- Ignorer --
                      </SelectItem>
                      {CONTACT_FIELDS.map((field) => (
                        <SelectItem
                          key={field.key}
                          value={field.key}
                          disabled={
                            mappedFields.has(field.key) &&
                            mapping[index] !== field.key
                          }
                        >
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {previewRows.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Apercu ({Math.min(5, rows.length)} premieres lignes)
                </p>
                <div className="overflow-x-auto rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((h, i) => (
                          <TableHead key={i} className="text-xs">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, ri) => (
                        <TableRow key={ri}>
                          {row.map((cell, ci) => (
                            <TableCell key={ci} className="text-xs">
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="skipDuplicates"
                checked={skipDuplicates}
                onCheckedChange={(checked) =>
                  setSkipDuplicates(checked === true)
                }
              />
              <Label htmlFor="skipDuplicates" className="text-sm">
                Ignorer les doublons (meme email)
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Annuler
              </Button>
              <LoadingButton loading={isImporting} onClick={handleImport}>
                Importer {rows.length} contact(s)
              </LoadingButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
