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
import { getBillingClientsAction } from "@/features/freelance/billing-clients.action";
import {
  createRecurringInvoiceAction,
  deleteRecurringInvoiceAction,
  getRecurringInvoicesAction,
  updateRecurringInvoiceAction,
} from "@/features/freelance/billing-recurring.action";
import {
  formatCents,
  formatDate,
} from "@/features/freelance/billing-presenter";
import { computeLineAmounts } from "@/features/freelance/billing-math";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { Loader2, PencilLine, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ClientOption = {
  id: string;
  displayName: string;
};

type RecurringLineForm = {
  key: string;
  description: string;
  quantity: string;
  unitPriceCents: string;
  vatRatePercent: string;
  discountPercent: string;
};

type RecurringRow = {
  id: string;
  name: string;
  frequency: "MONTHLY" | "QUARTERLY" | "ANNUALLY";
  currency: string;
  notes: string | null;
  terms: string | null;
  documentTemplate: string | null;
  startDate: Date | string;
  nextInvoiceDate: Date | string;
  endDate: Date | string | null;
  isActive: boolean;
  lastGeneratedAt: Date | string | null;
  generatedCount: number;
  lines: unknown;
  client: {
    id: string;
    displayName: string;
  };
};

const frequencyLabel: Record<string, string> = {
  MONTHLY: "Mensuelle",
  QUARTERLY: "Trimestrielle",
  ANNUALLY: "Annuelle",
};

const createLineKey = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultLine = (): RecurringLineForm => ({
  key: createLineKey(),
  description: "",
  quantity: "1",
  unitPriceCents: "0",
  vatRatePercent: "0",
  discountPercent: "0",
});

const toDateInputValue = (value: Date | string | null) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const parseLineForm = (line: RecurringLineForm) => {
  const quantity = Number(line.quantity);
  const unitPriceCents = Math.round(Number(line.unitPriceCents) * 100);
  const vatRatePercent = Number(line.vatRatePercent);
  const discountPercent = Number(line.discountPercent);

  if (
    line.description.trim().length === 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(unitPriceCents) ||
    unitPriceCents < 0 ||
    !Number.isFinite(vatRatePercent) ||
    vatRatePercent < 0 ||
    vatRatePercent > 100 ||
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    return null;
  }

  return {
    description: line.description.trim(),
    quantity,
    unitPriceCents,
    discountPercent,
    vatRatePercent,
  };
};

const computeLinesTotalCents = (lines: RecurringLineForm[]) => {
  let total = 0;
  for (const line of lines) {
    const parsed = parseLineForm(line);
    if (!parsed) continue;
    const amounts = computeLineAmounts(parsed);
    total += amounts.totalCents;
  }
  return total;
};

export function FreelanceRecurringManager() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [recurrings, setRecurrings] = useState<RecurringRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formClientId, setFormClientId] = useState("");
  const [formName, setFormName] = useState("");
  const [formFrequency, setFormFrequency] = useState<
    "MONTHLY" | "QUARTERLY" | "ANNUALLY"
  >("MONTHLY");
  const [formStartDate, setFormStartDate] = useState(
    toDateInputValue(new Date()),
  );
  const [formEndDate, setFormEndDate] = useState("");
  const [formCurrency, setFormCurrency] = useState("EUR");
  const [formNotes, setFormNotes] = useState("");
  const [formTerms, setFormTerms] = useState("");
  const [formLines, setFormLines] = useState<RecurringLineForm[]>([
    createDefaultLine(),
  ]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [clientsResult, recurringResult] = await Promise.all([
        resolveActionResult(
          getBillingClientsAction({
            page: 1,
            pageSize: 100,
            sortBy: "displayName",
            sortOrder: "asc",
          }),
        ),
        resolveActionResult(
          getRecurringInvoicesAction({ page: 1, pageSize: 100 }),
        ),
      ]);

      const nextClients = clientsResult.clients.map((client) => ({
        id: client.id,
        displayName: client.displayName,
      }));

      setClients(nextClients);
      setRecurrings(recurringResult.items as RecurringRow[]);

      if (nextClients.length > 0) {
        setFormClientId((prev) => prev || (nextClients[0]?.id ?? ""));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les récurrences",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormFrequency("MONTHLY");
    setFormStartDate(toDateInputValue(new Date()));
    setFormEndDate("");
    setFormCurrency("EUR");
    setFormNotes("");
    setFormTerms("");
    setFormLines([createDefaultLine()]);
    if (clients.length > 0) {
      setFormClientId(clients[0]?.id ?? "");
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (recurring: RecurringRow) => {
    setEditingId(recurring.id);
    setFormClientId(recurring.client.id);
    setFormName(recurring.name);
    setFormFrequency(recurring.frequency);
    setFormStartDate(toDateInputValue(recurring.startDate));
    setFormEndDate(toDateInputValue(recurring.endDate));
    setFormCurrency(recurring.currency);
    setFormNotes(recurring.notes ?? "");
    setFormTerms(recurring.terms ?? "");

    const rawLines = recurring.lines as {
      description: string;
      quantity: number;
      unitPriceCents: number;
      vatRatePercent?: number;
      discountPercent?: number;
    }[];

    if (Array.isArray(rawLines) && rawLines.length > 0) {
      setFormLines(
        rawLines.map((line) => ({
          key: createLineKey(),
          description: line.description,
          quantity: String(line.quantity),
          unitPriceCents: (line.unitPriceCents / 100).toFixed(2),
          vatRatePercent: String(line.vatRatePercent ?? 0),
          discountPercent: String(line.discountPercent ?? 0),
        })),
      );
    } else {
      setFormLines([createDefaultLine()]);
    }

    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formClientId || !formName.trim() || !formStartDate) {
      toast.error("Remplis les champs obligatoires");
      return;
    }

    if (formEndDate && new Date(formEndDate) <= new Date(formStartDate)) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }

    const lines = formLines.map(parseLineForm);
    if (lines.some((l) => l === null) || lines.length === 0) {
      toast.error("Chaque ligne doit être valide");
      return;
    }

    const validLines = lines.filter(
      (l): l is NonNullable<typeof l> => l !== null,
    );

    setIsSaving(true);
    try {
      if (editingId) {
        await resolveActionResult(
          updateRecurringInvoiceAction({
            id: editingId,
            clientId: formClientId,
            name: formName.trim(),
            frequency: formFrequency,
            lines: validLines,
            currency: formCurrency,
            notes: formNotes || undefined,
            terms: formTerms || undefined,
            startDate: new Date(formStartDate),
            endDate: formEndDate ? new Date(formEndDate) : null,
          }),
        );
        toast.success("Récurrence mise à jour");
      } else {
        await resolveActionResult(
          createRecurringInvoiceAction({
            clientId: formClientId,
            name: formName.trim(),
            frequency: formFrequency,
            lines: validLines,
            currency: formCurrency,
            notes: formNotes || undefined,
            terms: formTerms || undefined,
            startDate: new Date(formStartDate),
            endDate: formEndDate ? new Date(formEndDate) : null,
          }),
        );
        toast.success("Récurrence créée");
      }

      setIsSheetOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Opération impossible",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (recurring: RecurringRow) => {
    try {
      await resolveActionResult(
        updateRecurringInvoiceAction({
          id: recurring.id,
          isActive: !recurring.isActive,
        }),
      );
      toast.success(
        recurring.isActive ? "Récurrence désactivée" : "Récurrence activée",
      );
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mise à jour impossible",
      );
    }
  };

  const handleDelete = async (recurring: RecurringRow) => {
    const confirmed = await dialogManager.confirm({
      title: "Supprimer la récurrence",
      description: `Supprimer définitivement "${recurring.name}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      action: { label: "Supprimer", variant: "destructive" },
      cancel: { label: "Annuler" },
    });

    if (!confirmed) return;

    try {
      await resolveActionResult(
        deleteRecurringInvoiceAction({ id: recurring.id }),
      );
      toast.success("Récurrence supprimée");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible",
      );
    }
  };

  const handleLineChange = (
    key: string,
    field: keyof Omit<RecurringLineForm, "key">,
    value: string,
  ) => {
    setFormLines((prev) =>
      prev.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
  };

  const handleAddLine = () => {
    setFormLines((prev) => [...prev, createDefaultLine()]);
  };

  const handleRemoveLine = (key: string) => {
    setFormLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((line) => line.key !== key);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Factures récurrentes</CardTitle>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-1 size-3.5" />
            Nouvelle récurrence
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement...
            </div>
          ) : recurrings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune facture récurrente pour le moment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Prochaine date</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Généré</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurrings.map((recurring) => {
                  const rawLines = recurring.lines as {
                    description: string;
                    quantity: number;
                    unitPriceCents: number;
                    vatRatePercent?: number;
                    discountPercent?: number;
                  }[];
                  let totalCents = 0;
                  if (Array.isArray(rawLines)) {
                    for (const line of rawLines) {
                      const amounts = computeLineAmounts(line);
                      totalCents += amounts.totalCents;
                    }
                  }

                  return (
                    <TableRow key={recurring.id}>
                      <TableCell className="font-medium">
                        {recurring.name}
                      </TableCell>
                      <TableCell>{recurring.client.displayName}</TableCell>
                      <TableCell>
                        {frequencyLabel[recurring.frequency] ??
                          recurring.frequency}
                      </TableCell>
                      <TableCell>
                        {formatDate(recurring.nextInvoiceDate)}
                      </TableCell>
                      <TableCell>{formatCents(totalCents)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{recurring.generatedCount}</span>
                          {recurring.lastGeneratedAt && (
                            <span className="text-muted-foreground text-xs">
                              {formatDate(recurring.lastGeneratedAt)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={recurring.isActive ? "default" : "outline"}
                        >
                          {recurring.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Switch
                            checked={recurring.isActive}
                            onCheckedChange={() => {
                              void handleToggleActive(recurring);
                            }}
                            aria-label="Activer/Désactiver"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            title="Éditer"
                            onClick={() => {
                              handleOpenEdit(recurring);
                            }}
                          >
                            <PencilLine className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Supprimer"
                            onClick={() => {
                              void handleDelete(recurring);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) resetForm();
        }}
      >
        <FreelanceSideSheetContent>
          <FreelanceSideSheetHeader>
            <SheetTitle>
              {editingId
                ? "Modifier la récurrence"
                : "Nouvelle facture récurrente"}
            </SheetTitle>
            <SheetDescription>
              {editingId
                ? "Modifie les paramètres de la récurrence."
                : "Configure une facture qui sera générée automatiquement."}
            </SheetDescription>
          </FreelanceSideSheetHeader>

          <FreelanceSideSheetBody className="grid gap-3">
            <Input
              placeholder="Nom de la récurrence"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />

            <Select value={formClientId} onValueChange={setFormClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formFrequency}
              onValueChange={(v) => {
                setFormFrequency(v as "MONTHLY" | "QUARTERLY" | "ANNUALLY");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                <SelectItem value="QUARTERLY">Trimestrielle</SelectItem>
                <SelectItem value="ANNUALLY">Annuelle</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Date de début</label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Date de fin (optionnel)
                </label>
                <Input
                  type="date"
                  value={formEndDate}
                  min={formStartDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Lignes de facture</p>
              {formLines.map((line, index) => (
                <div
                  key={line.key}
                  className="flex flex-col gap-2 rounded-md border p-3"
                >
                  <Input
                    placeholder={`Description ligne ${index + 1}`}
                    value={line.description}
                    onChange={(e) =>
                      handleLineChange(line.key, "description", e.target.value)
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Quantité"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(line.key, "quantity", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Prix unitaire (€)"
                      value={line.unitPriceCents}
                      onChange={(e) =>
                        handleLineChange(
                          line.key,
                          "unitPriceCents",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="TVA %"
                      value={line.vatRatePercent}
                      onChange={(e) =>
                        handleLineChange(
                          line.key,
                          "vatRatePercent",
                          e.target.value,
                        )
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="Remise %"
                      value={line.discountPercent}
                      onChange={(e) =>
                        handleLineChange(
                          line.key,
                          "discountPercent",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLine(line.key)}
                    disabled={formLines.length <= 1}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Supprimer
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
              >
                <Plus className="mr-1 size-3.5" />
                Ajouter une ligne
              </Button>
              <p className="text-muted-foreground text-xs">
                Total estimé : {formatCents(computeLinesTotalCents(formLines))}
              </p>
            </div>

            <Textarea
              rows={3}
              placeholder="Notes (optionnel)"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
            <Textarea
              rows={3}
              placeholder="Conditions (optionnel)"
              value={formTerms}
              onChange={(e) => setFormTerms(e.target.value)}
            />
          </FreelanceSideSheetBody>

          <FreelanceSideSheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSheetOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              {editingId ? "Enregistrer" : "Créer la récurrence"}
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>
    </div>
  );
}
