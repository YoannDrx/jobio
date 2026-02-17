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
import {
  Sheet,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { BillingExpenseStatus } from "@/generated/prisma";
import {
  createExpenseTripAction,
  deleteExpenseTripAction,
  exportExpenseRegisterCsvAction,
  getExpenseTripsAction,
  suggestExpenseMatchingAction,
  updateExpenseTripAction,
} from "@/features/freelance/billing-expenses.action";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import { formatCents, formatDate } from "@/features/freelance/billing-presenter";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ExpenseTripRow = {
  id: string;
  tripDate: Date | string;
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  roundTrip: boolean;
  vehiclePower: string | null;
  allowanceRateCentsPerKm: number;
  tollCents: number;
  parkingCents: number;
  totalCents: number;
  status: BillingExpenseStatus;
  isPaid: boolean;
  paidAt: Date | string | null;
  paymentReference: string | null;
  matchedRegisterRef: string | null;
  notes: string | null;
};

type ExpenseTripForm = {
  tripDate: string;
  fromAddress: string;
  toAddress: string;
  distanceKm: string;
  roundTrip: boolean;
  vehiclePower: string;
  allowanceRateEurPerKm: string;
  tollEur: string;
  parkingEur: string;
  totalEur: string;
  status: BillingExpenseStatus;
  isPaid: boolean;
  paidAt: string;
  paymentReference: string;
  matchedRegisterRef: string;
  notes: string;
};

const INITIAL_FORM: ExpenseTripForm = {
  tripDate: new Date().toISOString().slice(0, 10),
  fromAddress: "",
  toAddress: "",
  distanceKm: "0",
  roundTrip: false,
  vehiclePower: "",
  allowanceRateEurPerKm: "0.00",
  tollEur: "0.00",
  parkingEur: "0.00",
  totalEur: "0.00",
  status: BillingExpenseStatus.DRAFT,
  isPaid: false,
  paidAt: "",
  paymentReference: "",
  matchedRegisterRef: "",
  notes: "",
};

const toCents = (value: string) => Math.max(0, Math.round(Number(value || 0) * 100));
const toEur = (value: number) => (value / 100).toFixed(2);

const statusLabel: Record<BillingExpenseStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumis",
  APPROVED: "Validé",
  REJECTED: "Rejeté",
  ARCHIVED: "Archivé",
};

const statusVariant: Record<BillingExpenseStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  ARCHIVED: "secondary",
};

export function FreelanceExpenseTripsManager() {
  const [items, setItems] = useState<ExpenseTripRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isSuggestingMatch, setIsSuggestingMatch] = useState(false);
  const [form, setForm] = useState<ExpenseTripForm>(INITIAL_FORM);

  const isEditing = editingId !== null;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getExpenseTripsAction({
          page: 1,
          pageSize: 100,
          search,
        }),
      );
      setItems(result.items as ExpenseTripRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalAmount = useMemo(() => {
    return items.reduce((accumulator, item) => accumulator + item.totalCents, 0);
  }, [items]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (item: ExpenseTripRow) => {
    setEditingId(item.id);
    setForm({
      tripDate: new Date(item.tripDate).toISOString().slice(0, 10),
      fromAddress: item.fromAddress,
      toAddress: item.toAddress,
      distanceKm: String(item.distanceKm),
      roundTrip: item.roundTrip,
      vehiclePower: item.vehiclePower ?? "",
      allowanceRateEurPerKm: toEur(item.allowanceRateCentsPerKm),
      tollEur: toEur(item.tollCents),
      parkingEur: toEur(item.parkingCents),
      totalEur: toEur(item.totalCents),
      status: item.status,
      isPaid: item.isPaid,
      paidAt: item.paidAt ? new Date(item.paidAt).toISOString().slice(0, 10) : "",
      paymentReference: item.paymentReference ?? "",
      matchedRegisterRef: item.matchedRegisterRef ?? "",
      notes: item.notes ?? "",
    });
    setSheetOpen(true);
  };

  const setField = <K extends keyof ExpenseTripForm>(key: K, value: ExpenseTripForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const canSave = form.fromAddress.trim().length > 0 && form.toAddress.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Renseigne l'adresse de départ et d'arrivée.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        tripDate: new Date(form.tripDate),
        fromAddress: form.fromAddress,
        toAddress: form.toAddress,
        distanceKm: Number(form.distanceKm),
        roundTrip: form.roundTrip,
        vehiclePower: form.vehiclePower,
        allowanceRateCentsPerKm: toCents(form.allowanceRateEurPerKm),
        tollCents: toCents(form.tollEur),
        parkingCents: toCents(form.parkingEur),
        totalCents: toCents(form.totalEur),
        status: form.status,
        isPaid: form.isPaid,
        paidAt: form.paidAt ? new Date(form.paidAt) : null,
        paymentReference: form.paymentReference,
        matchedRegisterRef: form.matchedRegisterRef,
        notes: form.notes,
      };

      if (isEditing && editingId) {
        await resolveActionResult(updateExpenseTripAction({ id: editingId, ...payload }));
        toast.success("Trajet mis à jour");
      } else {
        await resolveActionResult(createExpenseTripAction(payload));
        toast.success("Trajet ajouté");
      }

      setSheetOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await resolveActionResult(deleteExpenseTripAction({ id }));
      toast.success("Trajet supprimé");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const result = await resolveActionResult(
        exportExpenseRegisterCsvAction({ kind: "TRIPS" }),
      );
      downloadCsv(result.csv, result.filename);
      toast.success("Export CSV des trajets téléchargé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export CSV impossible");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleSuggestMatching = async () => {
    setIsSuggestingMatch(true);
    try {
      const result = await resolveActionResult(
        suggestExpenseMatchingAction({
          entityType: "EXPENSE_TRIP",
          expenseId: editingId ?? undefined,
          amountCents: toCents(form.totalEur),
          date: form.tripDate ? new Date(form.tripDate) : undefined,
          referenceHint: `${form.fromAddress} ${form.toAddress}`,
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
      toast.error(error instanceof Error ? error.message : "Suggestion impossible");
    } finally {
      setIsSuggestingMatch(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Trajets professionnels</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Ajouter un trajet
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
              {isExportingCsv ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              placeholder="Rechercher départ, arrivée..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
            />
            <div className="rounded-md border px-3 py-2 text-sm">
              Total: <strong>{formatCents(totalAmount)}</strong>
            </div>
          </div>

          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des trajets...
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun trajet enregistré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.tripDate)}</TableCell>
                    <TableCell className="max-w-[420px] truncate">
                      {item.fromAddress}
                      {" -> "}
                      {item.toAddress}
                    </TableCell>
                    <TableCell>
                      {item.distanceKm} km{item.roundTrip ? " (AR)" : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status]}>{statusLabel[item.status]}</Badge>
                    </TableCell>
                    <TableCell>{formatCents(item.totalCents)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => openEdit(item)}>
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
                              {deletingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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
            <SheetTitle>{isEditing ? "Éditer le trajet" : "Nouveau trajet"}</SheetTitle>
            <SheetDescription>Saisie kilométrique, barèmes, frais et suivi de remboursement.</SheetDescription>
          </FreelanceSideSheetHeader>
          <FreelanceSideSheetBody className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={form.tripDate} onChange={(event) => setField("tripDate", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(value) => setField("status", value as BillingExpenseStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabel) as BillingExpenseStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Adresse de départ</Label>
                <Input value={form.fromAddress} onChange={(event) => setField("fromAddress", event.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Adresse d'arrivée</Label>
                <Input value={form.toAddress} onChange={(event) => setField("toAddress", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Distance (km)</Label>
                <Input type="number" min="0" step="0.1" value={form.distanceKm} onChange={(event) => setField("distanceKm", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Puissance véhicule</Label>
                <Input value={form.vehiclePower} onChange={(event) => setField("vehiclePower", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Barème (€/km)</Label>
                <Input type="number" min="0" step="0.01" value={form.allowanceRateEurPerKm} onChange={(event) => setField("allowanceRateEurPerKm", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Péages (€)</Label>
                <Input type="number" min="0" step="0.01" value={form.tollEur} onChange={(event) => setField("tollEur", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Parking (€)</Label>
                <Input type="number" min="0" step="0.01" value={form.parkingEur} onChange={(event) => setField("parkingEur", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Total (€)</Label>
                <Input type="number" min="0" step="0.01" value={form.totalEur} onChange={(event) => setField("totalEur", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Réf. paiement</Label>
                <Input value={form.paymentReference} onChange={(event) => setField("paymentReference", event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Matching registre</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.matchedRegisterRef}
                    onChange={(event) => setField("matchedRegisterRef", event.target.value)}
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
                <Label>Date de paiement</Label>
                <Input type="date" value={form.paidAt} onChange={(event) => setField("paidAt", event.target.value)} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-md border px-3 py-2">
                <Label htmlFor="trip-round-trip">Aller-retour</Label>
                <Switch id="trip-round-trip" checked={form.roundTrip} onCheckedChange={(checked) => setField("roundTrip", checked)} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-md border px-3 py-2">
                <Label htmlFor="trip-paid">Marquer comme payé</Label>
                <Switch id="trip-paid" checked={form.isPaid} onCheckedChange={(checked) => setField("isPaid", checked)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={4} value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
              </div>
            </div>
          </FreelanceSideSheetBody>
          <FreelanceSideSheetFooter>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={isSaving || !canSave} onClick={() => void handleSave()}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>
    </div>
  );
}
