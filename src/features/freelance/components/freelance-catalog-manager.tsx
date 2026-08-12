"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCatalogItemAction,
  deleteCatalogItemAction,
  getCatalogItemsAction,
  updateCatalogItemAction,
} from "@/features/freelance/billing-catalog.action";
import { formatCents } from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type CatalogRow = {
  id: string;
  name: string;
  unitLabel: string;
  unitPriceCents: number;
  vatRatePercent: number;
  isActive: boolean;
  description: string | null;
};

export function FreelanceCatalogManager() {
  const [items, setItems] = useState<CatalogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitLabel, setUnitLabel] = useState("jour");
  const [unitPrice, setUnitPrice] = useState("450");
  const [vatRate, setVatRate] = useState("20");

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getCatalogItemsAction({
          page: 1,
          pageSize: 100,
          includeInactive: true,
        }),
      );

      setItems(result.items as CatalogRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger le catalogue",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleCreate = async () => {
    if (!name || Number(unitPrice) < 0 || Number(vatRate) < 0) {
      toast.error("Renseigne correctement les informations de la prestation");
      return;
    }

    setIsCreating(true);
    try {
      await resolveActionResult(
        createCatalogItemAction({
          name,
          description,
          unitLabel,
          unitPriceCents: Math.round(Number(unitPrice) * 100),
          vatRatePercent: Number(vatRate),
        }),
      );
      toast.success("Ligne catalogue ajoutée");
      setName("");
      setDescription("");
      await loadItems();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création impossible",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (item: CatalogRow) => {
    setProcessingItemId(item.id);
    try {
      await resolveActionResult(
        updateCatalogItemAction({
          id: item.id,
          isActive: !item.isActive,
        }),
      );
      await loadItems();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mise à jour impossible",
      );
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    setProcessingItemId(itemId);
    try {
      await resolveActionResult(deleteCatalogItemAction({ id: itemId }));
      toast.success("Ligne supprimée du catalogue");
      await loadItems();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible",
      );
    } finally {
      setProcessingItemId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle ligne catalogue</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Nom de la prestation"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <Input
            placeholder="Description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
          <Input
            placeholder="Unité (jour, heure, forfait...)"
            value={unitLabel}
            onChange={(event) => {
              setUnitLabel(event.target.value);
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Prix (€)"
              value={unitPrice}
              onChange={(event) => {
                setUnitPrice(event.target.value);
              }}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="TVA (%)"
              value={vatRate}
              onChange={(event) => {
                setVatRate(event.target.value);
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="button" disabled={isCreating} onClick={handleCreate}>
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
              Ajouter au catalogue
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement du catalogue...
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune ligne catalogue.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestation</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>TVA</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {item.unitLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCents(item.unitPriceCents)}</TableCell>
                    <TableCell>{item.vatRatePercent}%</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "outline"}>
                        {item.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={processingItemId === item.id}
                          onClick={() => {
                            void handleToggleActive(item);
                          }}
                        >
                          {item.isActive ? "Désactiver" : "Activer"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={processingItemId === item.id}
                          onClick={() => {
                            void handleDelete(item.id);
                          }}
                        >
                          {processingItemId === item.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
