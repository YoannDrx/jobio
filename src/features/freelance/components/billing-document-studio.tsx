"use client";

import { Button } from "@/components/ui/button";
import { type BillingDocumentTemplateId } from "@/features/freelance/billing-document-templates";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DocumentStudioLayout } from "@/components/nowts/document-studio-layout";
import { BillingStudioPreview } from "./billing-studio-preview";
import { BillingStudioEditPanel } from "./billing-studio-edit-panel";

export const billingStudioUnitOptions = [
  { value: "article", label: "Articles" },
  { value: "centimetre", label: "Centimètres" },
  { value: "forfait", label: "Forfait" },
  { value: "heure", label: "Heures" },
  { value: "jour", label: "Jours" },
  { value: "kilo", label: "Kilos" },
  { value: "kilometre", label: "Kilomètre" },
  { value: "litre", label: "Litre" },
  { value: "millilitre", label: "Millilitre" },
  { value: "mois", label: "Mois" },
  { value: "metre_carre", label: "Mètre carré" },
  { value: "metre", label: "Mètre" },
  { value: "page", label: "Page" },
  { value: "semaine", label: "Semaine" },
  { value: "tonne", label: "Tonne" },
  { value: "unite", label: "Unité" },
] as const;

export const resolveBillingStudioUnitLabel = (value: string) => {
  return (
    billingStudioUnitOptions.find((option) => option.value === value)?.label ??
    "Unité"
  );
};

export const parseBillingStudioDescriptionUnit = (description: string) => {
  const trimmed = description.trim();
  const matchedUnit = billingStudioUnitOptions.find((option) =>
    trimmed.endsWith(` (${option.label})`),
  );

  if (!matchedUnit) {
    return {
      description: trimmed,
      unit: "unite",
    };
  }

  return {
    description: trimmed.slice(0, -` (${matchedUnit.label})`.length),
    unit: matchedUnit.value,
  };
};

export type BillingStudioLine = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
};

export type BillingStudioClient = {
  id: string;
  displayName: string;
  siret?: string | null;
  vatNumber?: string | null;
};

export type BillingStudioCatalogItem = {
  id: string;
  name: string;
  unitPriceCents: number;
  vatRatePercent: number;
};

export type BillingStudioIssuer = {
  legalName?: string | null;
  tradeName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  email?: string | null;
  iban?: string | null;
  bic?: string | null;
  vatExemptionMention?: string | null;
  documentFooterText?: string | null;
  documentLogoUrl?: string | null;
};

export type BillingStudioOptions = {
  showDeliveryAddress: boolean;
  showClientSiret: boolean;
  showClientVat: boolean;
  showBankInfo: boolean;
  showPaymentConditions: boolean;
  showDocumentTitle: boolean;
  showFreeField: boolean;
  showGlobalDiscount: boolean;
};

type BillingDocumentStudioProps = {
  id?: string;
  title: string;
  description?: string;
  documentLabel: string;
  secondaryDateLabel: string;
  issuer?: BillingStudioIssuer | null;
  clients: BillingStudioClient[];
  selectedClientId: string;
  onSelectedClientIdChange?: (value: string) => void;
  selectedClient?: BillingStudioClient | null;
  issueDate: string;
  onIssueDateChange?: (value: string) => void;
  secondaryDate: string;
  onSecondaryDateChange?: (value: string) => void;
  currency: string;
  onCurrencyChange?: (value: string) => void;
  lines: BillingStudioLine[];
  onLineChange?: (
    key: string,
    field: keyof Omit<BillingStudioLine, "key">,
    value: string,
  ) => void;
  onAddLine?: () => void;
  onRemoveLine?: (key: string) => void;
  catalogItems?: BillingStudioCatalogItem[];
  selectedCatalogItemId?: string;
  onCatalogSelection?: (value: string) => void;
  notes: string;
  onNotesChange?: (value: string) => void;
  terms: string;
  onTermsChange?: (value: string) => void;
  totals: {
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  };
  computeLineTotals: (line: BillingStudioLine) => {
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  };
  documentTemplateId: BillingDocumentTemplateId;
  onDocumentTemplateChange?: (value: BillingDocumentTemplateId) => void;
  documentPrimaryColor?: string | null;
  documentAccentColor?: string | null;
  options: BillingStudioOptions;
  onOptionsChange?: (patch: Partial<BillingStudioOptions>) => void;
  creationMode: "quick" | "full";
  onCreationModeChange?: (value: "quick" | "full") => void;
  language: string;
  onLanguageChange?: (value: string) => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  submitLabel?: string;
  onSubmit?: () => void;
  showEditorPanel?: boolean;
  readOnlyPreview?: boolean;
};

type StudioSection =
  | "header"
  | "client"
  | "meta"
  | "lines"
  | "totals"
  | "legal";

export function BillingDocumentStudio({
  id,
  title,
  description,
  documentLabel: _documentLabel,
  secondaryDateLabel,
  issuer,
  clients,
  selectedClientId,
  onSelectedClientIdChange,
  selectedClient,
  issueDate,
  onIssueDateChange,
  secondaryDate,
  onSecondaryDateChange,
  currency,
  onCurrencyChange,
  lines,
  onLineChange,
  onAddLine,
  onRemoveLine,
  catalogItems = [],
  selectedCatalogItemId = "custom",
  onCatalogSelection,
  notes,
  onNotesChange,
  terms,
  onTermsChange,
  totals,
  computeLineTotals,
  documentTemplateId,
  onDocumentTemplateChange,
  documentPrimaryColor,
  documentAccentColor,
  options,
  onOptionsChange,
  creationMode,
  onCreationModeChange,
  language,
  onLanguageChange,
  isSubmitting = false,
  canSubmit = true,
  submitLabel = "Creer le document",
  onSubmit,
  showEditorPanel = true,
  readOnlyPreview = false,
}: BillingDocumentStudioProps) {
  const [activeStudioSection, setActiveStudioSection] =
    useState<StudioSection>("lines");
  const [isPanelOpen, setIsPanelOpen] = useState(showEditorPanel);

  const selectedClientName = useMemo(() => {
    return (
      clients.find((client) => client.id === selectedClientId)?.displayName ??
      null
    );
  }, [clients, selectedClientId]);

  const activateSection = (section: StudioSection) => {
    setActiveStudioSection(section);
    if (!isPanelOpen) {
      setIsPanelOpen(true);
    }
  };

  if (!showEditorPanel) {
    return (
      <div id={id} className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
        <BillingStudioPreview
          activeSection={activeStudioSection}
          onSectionClick={activateSection}
          issuer={issuer}
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectedClientIdChange={onSelectedClientIdChange}
          selectedClient={selectedClient}
          issueDate={issueDate}
          onIssueDateChange={onIssueDateChange}
          secondaryDate={secondaryDate}
          onSecondaryDateChange={onSecondaryDateChange}
          currency={currency}
          onCurrencyChange={onCurrencyChange}
          lines={lines}
          onLineChange={onLineChange}
          onRemoveLine={onRemoveLine}
          notes={notes}
          onNotesChange={onNotesChange}
          terms={terms}
          onTermsChange={onTermsChange}
          totals={totals}
          computeLineTotals={computeLineTotals}
          options={options}
          documentTemplateId={documentTemplateId}
          documentPrimaryColor={documentPrimaryColor}
          documentAccentColor={documentAccentColor}
          readOnly={readOnlyPreview}
          showEditorPanel={false}
        />
      </div>
    );
  }

  return (
    <div id={id} className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{title}</p>
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
      <DocumentStudioLayout
        toolbar={null}
        preview={
          <BillingStudioPreview
            activeSection={activeStudioSection}
            onSectionClick={activateSection}
            issuer={issuer}
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectedClientIdChange={onSelectedClientIdChange}
            selectedClient={selectedClient}
            issueDate={issueDate}
            onIssueDateChange={onIssueDateChange}
            secondaryDate={secondaryDate}
            onSecondaryDateChange={onSecondaryDateChange}
            currency={currency}
            onCurrencyChange={onCurrencyChange}
            lines={lines}
            onLineChange={onLineChange}
            onRemoveLine={onRemoveLine}
            notes={notes}
            onNotesChange={onNotesChange}
            terms={terms}
            onTermsChange={onTermsChange}
            totals={totals}
            computeLineTotals={computeLineTotals}
            options={options}
            documentTemplateId={documentTemplateId}
            documentPrimaryColor={documentPrimaryColor}
            documentAccentColor={documentAccentColor}
            readOnly={readOnlyPreview}
            showEditorPanel={isPanelOpen}
          />
        }
        editPanelOpen={isPanelOpen}
        onEditPanelOpenChange={setIsPanelOpen}
        editPanelTitle="Panneau d'édition"
        editPanelContent={
          <BillingStudioEditPanel
            activeSection={activeStudioSection}
            creationMode={creationMode}
            onCreationModeChange={onCreationModeChange}
            language={language}
            onLanguageChange={onLanguageChange}
            documentTemplateId={documentTemplateId}
            onDocumentTemplateChange={onDocumentTemplateChange}
            options={options}
            onOptionsChange={onOptionsChange}
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectedClientIdChange={onSelectedClientIdChange}
            selectedClientName={selectedClientName}
            issueDate={issueDate}
            onIssueDateChange={onIssueDateChange}
            secondaryDate={secondaryDate}
            onSecondaryDateChange={onSecondaryDateChange}
            secondaryDateLabel={secondaryDateLabel}
            currency={currency}
            onCurrencyChange={onCurrencyChange}
            catalogItems={catalogItems}
            selectedCatalogItemId={selectedCatalogItemId}
            onCatalogSelection={onCatalogSelection}
            onAddLine={onAddLine}
            notes={notes}
            onNotesChange={onNotesChange}
            terms={terms}
            onTermsChange={onTermsChange}
            readOnly={readOnlyPreview}
          />
        }
        editPanelFooter={
          onSubmit ? (
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {submitLabel}
            </Button>
          ) : null
        }
      />
    </div>
  );
}
