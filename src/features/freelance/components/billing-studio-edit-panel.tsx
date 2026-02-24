"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BILLING_DOCUMENT_TEMPLATES,
  type BillingDocumentTemplateId,
} from "@/features/freelance/billing-document-templates";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import type {
  BillingStudioClient,
  BillingStudioCatalogItem,
  BillingStudioOptions,
} from "./billing-document-studio";

type StudioSection =
  | "header"
  | "client"
  | "meta"
  | "lines"
  | "totals"
  | "legal";

type BillingStudioEditPanelProps = {
  activeSection: StudioSection;
  creationMode: "quick" | "full";
  onCreationModeChange?: (value: "quick" | "full") => void;
  language: string;
  onLanguageChange?: (value: string) => void;
  documentTemplateId: BillingDocumentTemplateId;
  onDocumentTemplateChange?: (value: BillingDocumentTemplateId) => void;
  options: BillingStudioOptions;
  onOptionsChange?: (patch: Partial<BillingStudioOptions>) => void;
  clients: BillingStudioClient[];
  selectedClientId: string;
  onSelectedClientIdChange?: (value: string) => void;
  selectedClientName: string | null;
  issueDate: string;
  onIssueDateChange?: (value: string) => void;
  secondaryDate: string;
  onSecondaryDateChange?: (value: string) => void;
  secondaryDateLabel: string;
  currency: string;
  onCurrencyChange?: (value: string) => void;
  catalogItems?: BillingStudioCatalogItem[];
  selectedCatalogItemId?: string;
  onCatalogSelection?: (value: string) => void;
  onAddLine?: () => void;
  notes: string;
  onNotesChange?: (value: string) => void;
  terms: string;
  onTermsChange?: (value: string) => void;
  canSubmit?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit?: () => void;
  readOnly?: boolean;
};

export function BillingStudioEditPanel({
  activeSection,
  creationMode,
  onCreationModeChange,
  language,
  onLanguageChange,
  documentTemplateId,
  onDocumentTemplateChange,
  options,
  onOptionsChange,
  clients,
  selectedClientId,
  onSelectedClientIdChange,
  selectedClientName,
  issueDate,
  onIssueDateChange,
  secondaryDate,
  onSecondaryDateChange,
  secondaryDateLabel,
  currency,
  onCurrencyChange,
  catalogItems = [],
  selectedCatalogItemId = "custom",
  onCatalogSelection,
  onAddLine,
  notes,
  onNotesChange,
  terms,
  onTermsChange,
  canSubmit = true,
  isSubmitting = false,
  submitLabel = "Creer le document",
  onSubmit,
  readOnly = false,
}: BillingStudioEditPanelProps) {
  const canInteract = !readOnly;

  const setOption = (patch: Partial<BillingStudioOptions>) => {
    if (!onOptionsChange) {
      return;
    }
    onOptionsChange(patch);
  };

  return (
    <div className="h-fit space-y-3 rounded-2xl border p-4 xl:sticky xl:top-20">
      <p className="text-sm font-semibold">Panneau d'edition</p>

      <div className="space-y-3 rounded-xl border p-3">
        <p className="text-xs font-semibold uppercase">Options</p>
        <div className="space-y-1">
          <p className="text-muted-foreground text-[11px]">
            Type de facturation
          </p>
          <Select
            value={creationMode}
            onValueChange={(value) => {
              onCreationModeChange?.(value as "quick" | "full");
            }}
            disabled={!canInteract || !onCreationModeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">Rapide</SelectItem>
              <SelectItem value="full">Complet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-[11px]">Langue</p>
          <Select
            value={language}
            onValueChange={onLanguageChange}
            disabled={!canInteract || !onLanguageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Francais</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-[11px]">Template</p>
          <Select
            value={documentTemplateId}
            onValueChange={(value) => {
              onDocumentTemplateChange?.(value as BillingDocumentTemplateId);
            }}
            disabled={!canInteract || !onDocumentTemplateChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {BILLING_DOCUMENT_TEMPLATES.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>Adresse de livraison</span>
          <Switch
            checked={options.showDeliveryAddress}
            onCheckedChange={(checked) => {
              setOption({ showDeliveryAddress: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>SIREN ou SIRET</span>
          <Switch
            checked={options.showClientSiret}
            onCheckedChange={(checked) => {
              setOption({ showClientSiret: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>N TVA intracom</span>
          <Switch
            checked={options.showClientVat}
            onCheckedChange={(checked) => {
              setOption({ showClientVat: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>Coordonnees bancaires</span>
          <Switch
            checked={options.showBankInfo}
            onCheckedChange={(checked) => {
              setOption({ showBankInfo: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>Conditions de paiement</span>
          <Switch
            checked={options.showPaymentConditions}
            onCheckedChange={(checked) => {
              setOption({ showPaymentConditions: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>Intitule du document</span>
          <Switch
            checked={options.showDocumentTitle}
            onCheckedChange={(checked) => {
              setOption({ showDocumentTitle: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>Champ libre</span>
          <Switch
            checked={options.showFreeField}
            onCheckedChange={(checked) => {
              setOption({ showFreeField: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
        <label className="inline-flex w-fit items-center gap-2 text-xs">
          <span>Remise globale</span>
          <Switch
            checked={options.showGlobalDiscount}
            onCheckedChange={(checked) => {
              setOption({ showGlobalDiscount: checked });
            }}
            disabled={!canInteract || !onOptionsChange}
          />
        </label>
      </div>

      <div
        className={cn(
          "space-y-2 rounded-xl border p-3",
          activeSection === "client" && "border-primary bg-primary/5",
        )}
      >
        <p className="text-xs font-semibold uppercase">Client</p>
        <Select
          value={selectedClientId}
          onValueChange={(value) => {
            onSelectedClientIdChange?.(value);
          }}
          disabled={!canInteract || !onSelectedClientIdChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selectionner un client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          {selectedClientName
            ? `Client selectionne: ${selectedClientName}`
            : "Aucun client selectionne"}
        </p>
      </div>

      <div
        className={cn(
          "space-y-2 rounded-xl border p-3",
          activeSection === "meta" && "border-primary bg-primary/5",
        )}
      >
        <p className="text-xs font-semibold uppercase">Metadonnees</p>
        <Input
          type="date"
          value={issueDate}
          readOnly={!canInteract || !onIssueDateChange}
          onChange={(event) => {
            onIssueDateChange?.(event.target.value);
          }}
        />
        <Input
          type="date"
          value={secondaryDate}
          readOnly={!canInteract || !onSecondaryDateChange}
          onChange={(event) => {
            onSecondaryDateChange?.(event.target.value);
          }}
        />
        <p className="text-muted-foreground -mt-1 text-[11px]">
          {secondaryDateLabel}
        </p>
        <Input
          placeholder="Devise"
          maxLength={3}
          value={currency}
          readOnly={!canInteract || !onCurrencyChange}
          onChange={(event) => {
            onCurrencyChange?.(event.target.value.toUpperCase());
          }}
        />
      </div>

      <div
        className={cn(
          "space-y-2 rounded-xl border p-3",
          activeSection === "lines" && "border-primary bg-primary/5",
        )}
      >
        <p className="text-xs font-semibold uppercase">Lignes</p>
        <Select
          value={selectedCatalogItemId}
          onValueChange={onCatalogSelection}
          disabled={!canInteract || !onCatalogSelection}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Catalogue (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Ligne personnalisee</SelectItem>
            {catalogItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} ({(item.unitPriceCents / 100).toFixed(2)} EUR)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={onAddLine}
          disabled={!canInteract || !onAddLine}
        >
          <Plus className="size-4" />
          Ajouter une ligne
        </Button>
      </div>

      <div
        className={cn(
          "space-y-2 rounded-xl border p-3",
          activeSection === "legal" && "border-primary bg-primary/5",
        )}
      >
        <p className="text-xs font-semibold uppercase">Mentions & notes</p>
        <Textarea
          rows={3}
          value={notes}
          readOnly={!canInteract || !onNotesChange}
          onChange={(event) => {
            onNotesChange?.(event.target.value);
          }}
          placeholder="Mentions de paiement"
        />
        <Textarea
          rows={2}
          value={terms}
          readOnly={!canInteract || !onTermsChange}
          onChange={(event) => {
            onTermsChange?.(event.target.value);
          }}
          placeholder="Conditions"
        />
      </div>

      {onSubmit ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      ) : null}
    </div>
  );
}
