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
  createExpenseNoteAction,
  deleteExpenseNoteAction,
  exportExpenseRegisterCsvAction,
  getExpenseNotesAction,
  suggestExpenseMatchingAction,
  updateExpenseNoteAction,
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
import {
  Download,
  Ellipsis,
  Loader2,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ExpenseNoteRow = {
  id: string;
  label: string;
  category: string | null;
  expenseDate: Date | string;
  currency: string;
  status: BillingExpenseStatus;
  amountExclTaxCents: number;
  taxCents: number;
  amountInclTaxCents: number;
  deductibleTaxCents: number;
  isReimbursable: boolean;
  isPaid: boolean;
  paidAt: Date | string | null;
  paymentReference: string | null;
  matchedRegisterRef: string | null;
  attachmentUrl: string | null;
  notes: string | null;
};

type ExpenseNoteForm = {
  label: string;
  category: string;
  expenseDate: string;
  currency: string;
  status: BillingExpenseStatus;
  amountExclTaxEur: string;
  taxEur: string;
  amountInclTaxEur: string;
  deductibleTaxEur: string;
  isReimbursable: boolean;
  isPaid: boolean;
  paidAt: string;
  paymentReference: string;
  matchedRegisterRef: string;
  attachmentUrl: string;
  notes: string;
};

const INITIAL_FORM: ExpenseNoteForm = {
  label: "",
  category: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  currency: "EUR",
  status: BillingExpenseStatus.DRAFT,
  amountExclTaxEur: "0.00",
  taxEur: "0.00",
  amountInclTaxEur: "0.00",
  deductibleTaxEur: "0.00",
  isReimbursable: true,
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

const statusLabel: Record<BillingExpenseStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumise",
  APPROVED: "Validée",
  REJECTED: "Rejetée",
  ARCHIVED: "Archivée",
};

const statusVariant: Record<BillingExpenseStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  ARCHIVED: "secondary",
};

export function FreelanceExpenseNotesManager() {
  const [items, setItems] = useState<ExpenseNoteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isSuggestingMatch, setIsSuggestingMatch] = useState(false);
  const [form, setForm] = useState<ExpenseNoteForm>(INITIAL_FORM);

  const isEditing = editingId !== null;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getExpenseNotesAction({
          page: 1,
          pageSize: 100,
          search,
        }),
      );
      setItems(result.items as ExpenseNoteRow[]);
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

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (item: ExpenseNoteRow) => {
    setEditingId(item.id);
    setForm({
      label: item.label,
      category: item.category ?? "",
      expenseDate: new Date(item.expenseDate).toISOString().slice(0, 10),
      currency: item.currency,
      status: item.status,
      amountExclTaxEur: toEur(item.amountExclTaxCents),
      taxEur: toEur(item.taxCents),
      amountInclTaxEur: toEur(item.amountInclTaxCents),
      deductibleTaxEur: toEur(item.deductibleTaxCents),
      isReimbursable: item.isReimbursable,
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

  const setField = <K extends keyof ExpenseNoteForm>(
    key: K,
    value: ExpenseNoteForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const canSave = form.label.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Renseigne l'intitulé de la note.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        label: form.label,
        category: form.category,
        expenseDate: new Date(form.expenseDate),
        currency: form.currency.toUpperCase(),
        status: form.status,
        amountExclTaxCents: toCents(form.amountExclTaxEur),
        taxCents: toCents(form.taxEur),
        amountInclTaxCents: toCents(form.amountInclTaxEur),
        deductibleTaxCents: toCents(form.deductibleTaxEur),
        isReimbursable: form.isReimbursable,
        isPaid: form.isPaid,
        paidAt: form.paidAt ? new Date(form.paidAt) : null,
        paymentReference: form.paymentReference,
        matchedRegisterRef: form.matchedRegisterRef,
        attachmentUrl: form.attachmentUrl,
        notes: form.notes,
      };

      if (isEditing && editingId) {
        await resolveActionResult(
          updateExpenseNoteAction({ id: editingId, ...payload }),
        );
        toast.success("Note de frais mise à jour");
      } else {
        await resolveActionResult(createExpenseNoteAction(payload));
        toast.success("Note de frais créée");
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
      await resolveActionResult(deleteExpenseNoteAction({ id }));
      toast.success("Note de frais supprimée");
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
        exportExpenseRegisterCsvAction({ kind: "NOTES" }),
      );
      downloadCsv(result.csv, result.filename);
      toast.success("Export CSV des notes de frais téléchargé");
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
          entityType: "EXPENSE_NOTE",
          expenseId: editingId ?? undefined,
          amountCents: toCents(form.amountInclTaxEur),
          date: form.expenseDate ? new Date(form.expenseDate) : undefined,
          referenceHint: form.label,
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Notes de frais</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Ajouter une note
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
          <Input
            placeholder="Rechercher note, catégorie..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />

          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des notes...
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune note de frais.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Payée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>{formatDate(item.expenseDate)}</TableCell>
                    <TableCell>{item.category ?? "—"}</TableCell>
                    <TableCell>
                      {formatCents(item.amountInclTaxCents)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status]}>
                        {statusLabel[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.isPaid ? "Oui" : "Non"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(item)}
                        >
                          <PencilLine className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="icon">
                              <Ellipsis className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              {isEditing ? "Éditer la note de frais" : "Nouvelle note de frais"}
            </SheetTitle>
            <SheetDescription>
              Renseigne et catégorise les dépenses opérationnelles.
            </SheetDescription>
          </FreelanceSideSheetHeader>
          <FreelanceSideSheetBody className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label>Libellé</Label>
                <Input
                  value={form.label}
                  onChange={(event) => setField("label", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Catégorie</Label>
                <Input
                  value={form.category}
                  onChange={(event) => setField("category", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.expenseDate}
                  onChange={(event) =>
                    setField("expenseDate", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Devise</Label>
                <Input
                  maxLength={3}
                  value={form.currency}
                  onChange={(event) =>
                    setField("currency", event.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setField("status", value as BillingExpenseStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabel) as BillingExpenseStatus[]).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabel[status]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Montant HT (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amountExclTaxEur}
                  onChange={(event) =>
                    setField("amountExclTaxEur", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>TVA (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxEur}
                  onChange={(event) => setField("taxEur", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Montant TTC (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amountInclTaxEur}
                  onChange={(event) =>
                    setField("amountInclTaxEur", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>TVA déductible (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deductibleTaxEur}
                  onChange={(event) =>
                    setField("deductibleTaxEur", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Réf. paiement</Label>
                <Input
                  value={form.paymentReference}
                  onChange={(event) =>
                    setField("paymentReference", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Matching registre</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.matchedRegisterRef}
                    onChange={(event) =>
                      setField("matchedRegisterRef", event.target.value)
                    }
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
                <Label>Pièce jointe URL</Label>
                <Input
                  value={form.attachmentUrl}
                  onChange={(event) =>
                    setField("attachmentUrl", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Date de paiement</Label>
                <Input
                  type="date"
                  value={form.paidAt}
                  onChange={(event) => setField("paidAt", event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
                <Label htmlFor="expense-note-reimbursable">Remboursable</Label>
                <Switch
                  id="expense-note-reimbursable"
                  checked={form.isReimbursable}
                  onCheckedChange={(checked) =>
                    setField("isReimbursable", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
                <Label htmlFor="expense-note-paid">Marquer comme payée</Label>
                <Switch
                  id="expense-note-paid"
                  checked={form.isPaid}
                  onCheckedChange={(checked) => setField("isPaid", checked)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                />
              </div>
            </div>
          </FreelanceSideSheetBody>
          <FreelanceSideSheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
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
