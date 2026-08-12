"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { BillingExpenseStatus } from "@/features/freelance/billing-client-enums";
import {
  createExpenseInvoiceAction,
  deleteExpenseInvoiceAction,
  exportExpenseRegisterCsvAction,
  getExpenseInvoicesAction,
  suggestExpenseMatchingAction,
  updateExpenseInvoiceAction,
} from "@/features/freelance/billing-expenses.action";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import {
  formatCents,
  formatDate,
} from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { downloadCsv } from "@/lib/csv-export";
import { cn } from "@/lib/utils";
import {
  Download,
  Ellipsis,
  Loader2,
  PencilLine,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ExpenseInvoiceRow = {
  id: string;
  vendorName: string;
  vendorVatNumber: string | null;
  documentNumber: string | null;
  issueDate: Date | string;
  dueDate: Date | string | null;
  currency: string;
  category: string | null;
  status: BillingExpenseStatus;
  totalExclTaxCents: number;
  taxCents: number;
  totalInclTaxCents: number;
  deductibleTaxCents: number;
  isPaid: boolean;
  paidAt: Date | string | null;
  paymentReference: string | null;
  matchedRegisterRef: string | null;
  attachmentUrl: string | null;
  notes: string | null;
};

type ExpenseInvoiceForm = {
  vendorName: string;
  vendorVatNumber: string;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  category: string;
  status: BillingExpenseStatus;
  totalExclTaxEur: string;
  taxEur: string;
  totalInclTaxEur: string;
  deductibleTaxEur: string;
  isPaid: boolean;
  paidAt: string;
  paymentReference: string;
  matchedRegisterRef: string;
  attachmentUrl: string;
  notes: string;
};

const INITIAL_FORM: ExpenseInvoiceForm = {
  vendorName: "",
  vendorVatNumber: "",
  documentNumber: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  currency: "EUR",
  category: "",
  status: BillingExpenseStatus.DRAFT,
  totalExclTaxEur: "0.00",
  taxEur: "0.00",
  totalInclTaxEur: "0.00",
  deductibleTaxEur: "0.00",
  isPaid: false,
  paidAt: "",
  paymentReference: "",
  matchedRegisterRef: "",
  attachmentUrl: "",
  notes: "",
};

const toCents = (value: string) =>
  Math.max(0, Math.round(Number(value || 0) * 100));
const toEur = (value: number) => (value / 100).toFixed(2);

const expenseStatusLabel: Record<BillingExpenseStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumise",
  APPROVED: "Validée",
  REJECTED: "Rejetée",
  ARCHIVED: "Archivée",
};

const expenseStatusVariant: Record<
  BillingExpenseStatus,
  BadgeProps["variant"]
> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  ARCHIVED: "secondary",
};

export function FreelanceExpenseInvoicesManager() {
  const [items, setItems] = useState<ExpenseInvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isSuggestingMatch, setIsSuggestingMatch] = useState(false);
  const [form, setForm] = useState<ExpenseInvoiceForm>(INITIAL_FORM);

  const isEditing = editingId !== null;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getExpenseInvoicesAction({
          page: 1,
          pageSize: 100,
          search,
        }),
      );
      setItems(result.items as ExpenseInvoiceRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Chargement impossible",
      );
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalAmount = useMemo(() => {
    return items.reduce(
      (accumulator, item) => accumulator + item.totalInclTaxCents,
      0,
    );
  }, [items]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (item: ExpenseInvoiceRow) => {
    setEditingId(item.id);
    setForm({
      vendorName: item.vendorName,
      vendorVatNumber: item.vendorVatNumber ?? "",
      documentNumber: item.documentNumber ?? "",
      issueDate: new Date(item.issueDate).toISOString().slice(0, 10),
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().slice(0, 10)
        : "",
      currency: item.currency,
      category: item.category ?? "",
      status: item.status,
      totalExclTaxEur: toEur(item.totalExclTaxCents),
      taxEur: toEur(item.taxCents),
      totalInclTaxEur: toEur(item.totalInclTaxCents),
      deductibleTaxEur: toEur(item.deductibleTaxCents),
      isPaid: item.isPaid,
      paidAt: item.paidAt
        ? new Date(item.paidAt).toISOString().slice(0, 10)
        : "",
      paymentReference: item.paymentReference ?? "",
      matchedRegisterRef: item.matchedRegisterRef ?? "",
      attachmentUrl: item.attachmentUrl ?? "",
      notes: item.notes ?? "",
    });
    setSheetOpen(true);
  };

  const setField = <K extends keyof ExpenseInvoiceForm>(
    key: K,
    value: ExpenseInvoiceForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const canSave =
    form.vendorName.trim().length > 0 && form.issueDate.length > 0;

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Renseigne au minimum le fournisseur et la date.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        vendorName: form.vendorName,
        vendorVatNumber: form.vendorVatNumber,
        documentNumber: form.documentNumber,
        issueDate: new Date(form.issueDate),
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        currency: form.currency.toUpperCase(),
        category: form.category,
        status: form.status,
        totalExclTaxCents: toCents(form.totalExclTaxEur),
        taxCents: toCents(form.taxEur),
        totalInclTaxCents: toCents(form.totalInclTaxEur),
        deductibleTaxCents: toCents(form.deductibleTaxEur),
        isPaid: form.isPaid,
        paidAt: form.paidAt ? new Date(form.paidAt) : null,
        paymentReference: form.paymentReference,
        matchedRegisterRef: form.matchedRegisterRef,
        attachmentUrl: form.attachmentUrl,
        notes: form.notes,
      };

      if (isEditing && editingId) {
        await resolveActionResult(
          updateExpenseInvoiceAction({ id: editingId, ...payload }),
        );
        toast.success("Dépense facture mise à jour");
      } else {
        await resolveActionResult(createExpenseInvoiceAction(payload));
        toast.success("Dépense facture créée");
      }

      setSheetOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await resolveActionResult(deleteExpenseInvoiceAction({ id }));
      toast.success("Dépense facture supprimée");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const result = await resolveActionResult(
        exportExpenseRegisterCsvAction({ kind: "INVOICES" }),
      );
      downloadCsv(result.csv, result.filename);
      toast.success("Export CSV des dépenses fournisseurs téléchargé");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export CSV impossible",
      );
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleSuggestMatching = async () => {
    setIsSuggestingMatch(true);
    try {
      const result = await resolveActionResult(
        suggestExpenseMatchingAction({
          entityType: "EXPENSE_INVOICE",
          expenseId: editingId ?? undefined,
          amountCents: toCents(form.totalInclTaxEur),
          date: form.issueDate ? new Date(form.issueDate) : undefined,
          referenceHint: `${form.documentNumber} ${form.vendorName}`,
        }),
      );

      if (result.suggestions.length === 0) {
        toast.info("Aucune suggestion pertinente trouvée");
        return;
      }
      const recommended = result.suggestions[0];

      setForm((previous) => ({
        ...previous,
        matchedRegisterRef: recommended.registerRef,
        paymentReference:
          previous.paymentReference.trim().length > 0
            ? previous.paymentReference
            : (recommended.reference ?? previous.paymentReference),
      }));
      toast.success(
        `Matching suggéré: ${recommended.registerRef} (${recommended.score} pts)`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suggestion impossible",
      );
    } finally {
      setIsSuggestingMatch(false);
    }
  };

  const renderActions = (item: ExpenseInvoiceRow, compact = false) => (
    <div className={cn("flex gap-2", compact ? "" : "justify-end")}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Éditer"
        onClick={() => {
          openEdit(item);
        }}
      >
        <PencilLine className="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Plus d'actions"
          >
            <Ellipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              openEdit(item);
            }}
          >
            <PencilLine className="size-4" />
            Éditer
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              void handleDelete(item.id);
            }}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Dépenses fournisseurs</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => {
                setViewMode("table");
              }}
            >
              Vue tableau
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "cards" ? "default" : "outline"}
              onClick={() => {
                setViewMode("cards");
              }}
            >
              Vue cards
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Ajouter une dépense
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isExportingCsv}
              onClick={() => {
                void handleExportCsv();
              }}
            >
              {isExportingCsv ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              placeholder="Rechercher fournisseur, numéro..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
            />
            <div className="rounded-md border px-3 py-2 text-sm">
              Total TTC: <strong>{formatCents(totalAmount)}</strong>
            </div>
          </div>

          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des dépenses...
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune dépense facture pour le moment.
            </p>
          ) : viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Émission</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Payée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.vendorName}</TableCell>
                    <TableCell>{item.documentNumber ?? "—"}</TableCell>
                    <TableCell>{formatDate(item.issueDate)}</TableCell>
                    <TableCell>{formatCents(item.totalInclTaxCents)}</TableCell>
                    <TableCell>
                      <Badge variant={expenseStatusVariant[item.status]}>
                        {expenseStatusLabel[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.isPaid ? "Oui" : "Non"}</TableCell>
                    <TableCell>{renderActions(item)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="text-muted-foreground size-4" />
                        <CardTitle className="text-base">
                          {item.vendorName}
                        </CardTitle>
                      </div>
                      <Badge variant={expenseStatusVariant[item.status]}>
                        {expenseStatusLabel[item.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Document</span>
                      <span>{item.documentNumber ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{formatDate(item.issueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">TTC</span>
                      <span className="font-medium">
                        {formatCents(item.totalInclTaxCents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Payée</span>
                      <span>{item.isPaid ? "Oui" : "Non"}</span>
                    </div>
                    <div className="pt-2">{renderActions(item, true)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <FreelanceSideSheetContent>
          <FreelanceSideSheetHeader>
            <SheetTitle>
              {isEditing
                ? "Éditer la dépense facture"
                : "Nouvelle dépense facture"}
            </SheetTitle>
            <SheetDescription>
              Centralise tes factures fournisseurs, statuts, pièces et matching
              registre.
            </SheetDescription>
          </FreelanceSideSheetHeader>
          <FreelanceSideSheetBody className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label>Fournisseur</Label>
                <Input
                  value={form.vendorName}
                  onChange={(event) => {
                    setField("vendorName", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Numéro document</Label>
                <Input
                  value={form.documentNumber}
                  onChange={(event) => {
                    setField("documentNumber", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>TVA fournisseur</Label>
                <Input
                  value={form.vendorVatNumber}
                  onChange={(event) => {
                    setField("vendorVatNumber", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Date d'émission</Label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => {
                    setField("issueDate", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Date d'échéance</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => {
                    setField("dueDate", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Devise</Label>
                <Input
                  maxLength={3}
                  value={form.currency}
                  onChange={(event) => {
                    setField("currency", event.target.value.toUpperCase());
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Catégorie</Label>
                <Input
                  value={form.category}
                  onChange={(event) => {
                    setField("category", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => {
                    setField("status", value as BillingExpenseStatus);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(expenseStatusLabel) as BillingExpenseStatus[]
                    ).map((status) => (
                      <SelectItem key={status} value={status}>
                        {expenseStatusLabel[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Montant HT (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalExclTaxEur}
                  onChange={(event) => {
                    setField("totalExclTaxEur", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>TVA (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxEur}
                  onChange={(event) => {
                    setField("taxEur", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Montant TTC (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalInclTaxEur}
                  onChange={(event) => {
                    setField("totalInclTaxEur", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>TVA déductible (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deductibleTaxEur}
                  onChange={(event) => {
                    setField("deductibleTaxEur", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Réf. paiement</Label>
                <Input
                  value={form.paymentReference}
                  onChange={(event) => {
                    setField("paymentReference", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Matching registre</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.matchedRegisterRef}
                    onChange={(event) => {
                      setField("matchedRegisterRef", event.target.value);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Suggérer un matching"
                    disabled={isSuggestingMatch}
                    onClick={() => {
                      void handleSuggestMatching();
                    }}
                  >
                    {isSuggestingMatch ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Lien pièce jointe</Label>
                <Input
                  value={form.attachmentUrl}
                  onChange={(event) => {
                    setField("attachmentUrl", event.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Date de paiement</Label>
                <Input
                  type="date"
                  value={form.paidAt}
                  onChange={(event) => {
                    setField("paidAt", event.target.value);
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
                <Label htmlFor="expense-is-paid">Marquer comme payée</Label>
                <Switch
                  id="expense-is-paid"
                  checked={form.isPaid}
                  onCheckedChange={(checked) => {
                    setField("isPaid", checked);
                  }}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => {
                    setField("notes", event.target.value);
                  }}
                />
              </div>
            </div>
          </FreelanceSideSheetBody>
          <FreelanceSideSheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSheetOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isSaving || !canSave}
              onClick={() => void handleSave()}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>
    </div>
  );
}
