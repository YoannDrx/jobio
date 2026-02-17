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
import { LogoSvg } from "@/components/svg/logo-svg";
import {
  BILLING_DOCUMENT_TEMPLATES,
  resolveBillingDocumentTemplate,
  type BillingDocumentTemplateId,
} from "@/features/freelance/billing-document-templates";
import { formatCents } from "@/features/freelance/billing-presenter";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

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
    billingStudioUnitOptions.find((option) => option.value === value)?.label ?? "Unité"
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

type StudioSection = "header" | "client" | "meta" | "lines" | "totals" | "legal";

export function BillingDocumentStudio({
  id,
  title,
  description,
  documentLabel,
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
  const activeTemplate = resolveBillingDocumentTemplate(documentTemplateId);

  const previewHeaderGridClass =
    activeTemplate.headerLayout === "stacked"
      ? "md:grid-cols-1"
      : activeTemplate.headerLayout === "compact"
        ? "md:grid-cols-[1fr_0.8fr]"
        : "md:grid-cols-[1.25fr_0.95fr]";

  const previewSectionBorderClass =
    activeTemplate.id === "cobalt-frame" || activeTemplate.id === "amber-grid"
      ? "border-2 border-slate-200"
      : "border border-slate-200";
  const previewEditableClass =
    "rounded-none border-dashed border-slate-100 bg-white shadow-none focus-visible:border-slate-200 focus-visible:ring-0";

  const canInteract = !readOnlyPreview;
  const primaryColor = documentPrimaryColor ?? activeTemplate.primaryColor;
  const accentColor = documentAccentColor ?? activeTemplate.accentColor;

  const selectedClientName = useMemo(() => {
    return clients.find((client) => client.id === selectedClientId)?.displayName ?? null;
  }, [clients, selectedClientId]);

  const activateSection = (section: StudioSection) => {
    if (showEditorPanel) {
      setActiveStudioSection(section);
    }
  };

  const setOption = (patch: Partial<BillingStudioOptions>) => {
    if (!onOptionsChange) {
      return;
    }
    onOptionsChange(patch);
  };

  const renderPreview = (
    <div className="bg-muted/30 rounded-2xl border p-4">
      <div className={cn("mx-auto aspect-[210/297] border bg-white", showEditorPanel ? "max-w-[980px]" : "max-w-[640px]")}>
        <div className="h-full overflow-auto p-4 md:p-5">
          <div
            className="mx-auto w-full max-w-[760px] space-y-4 text-slate-700"
            style={{ fontFamily: activeTemplate.fontFamily }}
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} />
            {activeTemplate.bannerStyle !== "none" ? (
              <div className="relative h-0">
                <div
                  className={cn(
                    "pointer-events-none absolute -top-10 right-0 h-24 w-44 opacity-30",
                    activeTemplate.bannerStyle === "geo"
                      ? ""
                      : "rounded-[38%_62%_56%_44%]",
                  )}
                  style={{
                    backgroundColor: accentColor,
                    clipPath:
                      activeTemplate.bannerStyle === "geo"
                        ? "polygon(50% 0%, 100% 35%, 80% 100%, 0 84%, 0 20%)"
                        : undefined,
                  }}
                />
              </div>
            ) : null}

            <div className={cn("grid gap-3", previewHeaderGridClass)}>
              <div
                className={cn(
                  "space-y-2 p-3",
                  previewSectionBorderClass,
                  activeStudioSection === "header" &&
                    "border-primary ring-primary/20 ring-2",
                )}
                onClick={() => {
                  activateSection("header");
                }}
              >
                <div className="flex items-center gap-2">
                  {issuer?.documentLogoUrl ? (
                    <img
                      src={issuer.documentLogoUrl}
                      alt="Logo"
                      className="h-20 w-auto object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <LogoSvg size={96} />
                      <span className="text-[52px] leading-none font-semibold tracking-tight">
                        {SiteConfig.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 text-xs">
                  <p className="font-semibold text-slate-900">
                    {issuer?.tradeName ?? issuer?.legalName ?? "Emetteur"}
                  </p>
                  <p>{issuer?.addressLine1 ?? "Adresse emetteur"}</p>
                  {issuer?.addressLine2 ? <p>{issuer.addressLine2}</p> : null}
                  <p>
                    {issuer?.postalCode ?? "75000"} {issuer?.city ?? "Paris"}
                  </p>
                  {issuer?.email ? <p>{issuer.email}</p> : null}
                </div>
              </div>

              <div className="space-y-3">
                <div
                  className={cn(
                    "p-2.5",
                    previewSectionBorderClass,
                    activeStudioSection === "meta" &&
                      "border-primary ring-primary/20 ring-2",
                  )}
                  onClick={() => {
                    activateSection("meta");
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold tracking-wide uppercase text-slate-500">
                      Metadonnees
                    </p>
                    {options.showDocumentTitle ? (
                      <span className="border border-slate-300 px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                        {documentLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={issueDate}
                      readOnly={!canInteract || !onIssueDateChange}
                      className={cn("h-8 text-xs", previewEditableClass)}
                      onFocus={() => {
                        activateSection("meta");
                      }}
                      onChange={(event) => {
                        onIssueDateChange?.(event.target.value);
                      }}
                    />
                    <Input
                      type="date"
                      value={secondaryDate}
                      readOnly={!canInteract || !onSecondaryDateChange}
                      className={cn("h-8 text-xs", previewEditableClass)}
                      onFocus={() => {
                        activateSection("meta");
                      }}
                      onChange={(event) => {
                        onSecondaryDateChange?.(event.target.value);
                      }}
                    />
                    <Input
                      placeholder="Devise"
                      maxLength={3}
                      value={currency}
                      readOnly={!canInteract || !onCurrencyChange}
                      className={cn("h-8 text-xs", previewEditableClass)}
                      onFocus={() => {
                        activateSection("meta");
                      }}
                      onChange={(event) => {
                        onCurrencyChange?.(event.target.value.toUpperCase());
                      }}
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "space-y-2 p-3",
                    previewSectionBorderClass,
                    activeStudioSection === "client" &&
                      "border-primary ring-primary/20 ring-2",
                  )}
                  onClick={() => {
                    activateSection("client");
                  }}
                >
                  <p className="text-[10px] font-semibold tracking-wide uppercase text-slate-500">
                    Client
                  </p>
                  <Select
                    value={selectedClientId}
                    onValueChange={(value) => {
                      onSelectedClientIdChange?.(value);
                    }}
                    disabled={!canInteract || !onSelectedClientIdChange}
                  >
                    <SelectTrigger className={cn("h-8 w-full text-xs", previewEditableClass)}>
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
                  <div className="space-y-0.5 text-[11px] text-slate-500">
                    {options.showClientSiret ? (
                      <p>SIREN / SIRET: {selectedClient?.siret ?? "—"}</p>
                    ) : null}
                    {options.showClientVat ? (
                      <p>TVA intracom: {selectedClient?.vatNumber ?? "—"}</p>
                    ) : null}
                    {options.showDeliveryAddress ? <p>Adresse de livraison: idem client</p> : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "space-y-2 p-3",
                previewSectionBorderClass,
                activeStudioSection === "lines" &&
                  "border-primary ring-primary/20 ring-2",
              )}
              onClick={() => {
                activateSection("lines");
              }}
            >
              <div
                className="grid grid-cols-[minmax(0,1.45fr)_58px_95px_90px_65px_95px] gap-2 px-2 py-1.5 text-[10px] font-semibold tracking-wide uppercase"
                style={{ backgroundColor: accentColor }}
              >
                <span>Designation</span>
                <span>Qte</span>
                <span>Unite</span>
                <span>PU</span>
                <span>TVA</span>
                <span>Montant HT</span>
              </div>
              <div className="space-y-1.5">
                {lines.map((line, index) => {
                  const lineTotals = computeLineTotals(line);
                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-[minmax(0,1.45fr)_58px_95px_90px_65px_95px] gap-2"
                    >
                      <Input
                        placeholder={`Ligne ${index + 1}`}
                        value={line.description}
                        readOnly={!canInteract || !onLineChange}
                        className={cn("h-8 text-xs", previewEditableClass)}
                        onFocus={() => {
                          activateSection("lines");
                        }}
                        onChange={(event) => {
                          onLineChange?.(line.key, "description", event.target.value);
                        }}
                      />
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={line.quantity}
                        readOnly={!canInteract || !onLineChange}
                        className={cn("h-8 text-xs", previewEditableClass)}
                        onFocus={() => {
                          activateSection("lines");
                        }}
                        onChange={(event) => {
                          onLineChange?.(line.key, "quantity", event.target.value);
                        }}
                      />
                      <Select
                        value={line.unit}
                        onValueChange={(value) => {
                          onLineChange?.(line.key, "unit", value);
                        }}
                        disabled={!canInteract || !onLineChange}
                      >
                        <SelectTrigger className={cn("h-8 text-xs", previewEditableClass)}>
                          <SelectValue placeholder="Unite" />
                        </SelectTrigger>
                        <SelectContent>
                          {billingStudioUnitOptions.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        readOnly={!canInteract || !onLineChange}
                        className={cn("h-8 text-xs", previewEditableClass)}
                        onFocus={() => {
                          activateSection("lines");
                        }}
                        onChange={(event) => {
                          onLineChange?.(line.key, "unitPrice", event.target.value);
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.vatRate}
                        readOnly={!canInteract || !onLineChange}
                        className={cn("h-8 text-xs", previewEditableClass)}
                        onFocus={() => {
                          activateSection("lines");
                        }}
                        onChange={(event) => {
                          onLineChange?.(line.key, "vatRate", event.target.value);
                        }}
                      />
                      <div
                        className={cn(
                          "flex h-8 items-center justify-between border px-1.5 text-xs",
                          previewEditableClass,
                        )}
                      >
                        <span>{formatCents(lineTotals.subtotalCents)}</span>
                        {canInteract && onRemoveLine ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onRemoveLine(line.key);
                            }}
                            disabled={lines.length <= 1}
                            aria-label="Supprimer la ligne"
                            className="h-6 w-6 rounded-none"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_260px]">
              <div
                className={cn(
                  "space-y-2 p-3",
                  previewSectionBorderClass,
                  activeStudioSection === "legal" &&
                    "border-primary ring-primary/20 ring-2",
                )}
                onClick={() => {
                  activateSection("legal");
                }}
              >
                {options.showPaymentConditions ? (
                  <Textarea
                    rows={2}
                    value={notes}
                    readOnly={!canInteract || !onNotesChange}
                    className={cn("text-xs", previewEditableClass)}
                    onFocus={() => {
                      activateSection("legal");
                    }}
                    onChange={(event) => {
                      onNotesChange?.(event.target.value);
                    }}
                    placeholder="Conditions de paiement"
                  />
                ) : null}
                {options.showFreeField ? (
                  <Textarea
                    rows={2}
                    value={terms}
                    readOnly={!canInteract || !onTermsChange}
                    className={cn("text-xs", previewEditableClass)}
                    onFocus={() => {
                      activateSection("legal");
                    }}
                    onChange={(event) => {
                      onTermsChange?.(event.target.value);
                    }}
                    placeholder="Champ libre"
                  />
                ) : null}
                <p className="text-[11px] text-slate-500">
                  {issuer?.vatExemptionMention ?? "TVA non applicable, art. 293 B du CGI"}
                </p>
                {options.showBankInfo ? (
                  <p className="text-[11px] text-slate-500">
                    {issuer?.iban ? `IBAN ${issuer.iban}` : "IBAN non renseigne"}
                    {issuer?.bic ? ` · BIC ${issuer.bic}` : ""}
                  </p>
                ) : null}
                {issuer?.documentFooterText ? (
                  <p className="text-[11px] text-slate-500">{issuer.documentFooterText}</p>
                ) : null}
              </div>

              <div
                className={cn(
                  "space-y-1.5 p-3",
                  previewSectionBorderClass,
                  activeStudioSection === "totals" &&
                    "border-primary ring-primary/20 ring-2",
                )}
                onClick={() => {
                  activateSection("totals");
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Sous-total HT</span>
                  <span>{formatCents(totals.subtotalCents)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">TVA</span>
                  <span>{formatCents(totals.taxCents)}</span>
                </div>
                {options.showGlobalDiscount ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Remise globale</span>
                    <span>0,00 EUR</span>
                  </div>
                ) : null}
                <div
                  className="mt-2 flex items-center justify-between px-2 py-2 text-sm font-semibold"
                  style={{ backgroundColor: accentColor }}
                >
                  <span>Total TTC</span>
                  <span>{formatCents(totals.totalCents)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!showEditorPanel) {
    return (
      <div id={id} className="space-y-2">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
        {renderPreview}
      </div>
    );
  }

  return (
    <div id={id} className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {renderPreview}

        <div className="h-fit space-y-3 rounded-2xl border p-4 xl:sticky xl:top-20">
          <p className="text-sm font-semibold">Panneau d’edition</p>

          <div className="space-y-3 rounded-xl border p-3">
            <p className="text-xs font-semibold uppercase">Options</p>
            <div className="space-y-1">
              <p className="text-muted-foreground text-[11px]">Type de facturation</p>
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
              activeStudioSection === "client" && "border-primary bg-primary/5",
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
              activeStudioSection === "meta" && "border-primary bg-primary/5",
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
            <p className="text-muted-foreground -mt-1 text-[11px]">{secondaryDateLabel}</p>
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
              activeStudioSection === "lines" && "border-primary bg-primary/5",
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
              activeStudioSection === "legal" && "border-primary bg-primary/5",
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
      </div>
    </div>
  );
}
