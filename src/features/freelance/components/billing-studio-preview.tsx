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
import { Textarea } from "@/components/ui/textarea";
import { LogoSvg } from "@/components/svg/logo-svg";
import {
  resolveBillingDocumentTemplate,
  type BillingDocumentTemplateId,
} from "@/features/freelance/billing-document-templates";
import { formatCents } from "@/features/freelance/billing-presenter";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import { Trash2 } from "lucide-react";
import type {
  BillingStudioLine,
  BillingStudioClient,
  BillingStudioIssuer,
  BillingStudioOptions,
} from "./billing-document-studio";
import { billingStudioUnitOptions } from "./billing-document-studio";

type StudioSection =
  | "header"
  | "client"
  | "meta"
  | "lines"
  | "totals"
  | "legal";

type BillingStudioPreviewProps = {
  activeSection: StudioSection;
  onSectionClick: (section: StudioSection) => void;
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
  _onAddLine?: () => void;
  onRemoveLine?: (key: string) => void;
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
  documentPrimaryColor?: string | null;
  documentAccentColor?: string | null;
  options: BillingStudioOptions;
  showEditorPanel?: boolean;
  readOnly?: boolean;
};

export function BillingStudioPreview({
  activeSection,
  onSectionClick,
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
  _onAddLine,
  onRemoveLine,
  notes,
  onNotesChange,
  terms,
  onTermsChange,
  totals,
  computeLineTotals,
  documentTemplateId,
  documentPrimaryColor,
  documentAccentColor,
  options,
  showEditorPanel = true,
  readOnly = false,
}: BillingStudioPreviewProps) {
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

  const canInteract = !readOnly;
  const primaryColor = documentPrimaryColor ?? activeTemplate.primaryColor;
  const accentColor = documentAccentColor ?? activeTemplate.accentColor;

  const activateSection = (section: StudioSection) => {
    if (showEditorPanel) {
      onSectionClick(section);
    }
  };

  return (
    <div className="mx-auto max-w-[794px] rounded-sm bg-white shadow-xl">
      <div
        className={cn(
          "mx-auto aspect-[210/297] border bg-white",
          "max-w-[794px]",
        )}
      >
        <div className="h-full overflow-auto p-4 md:p-5">
          <div
            className="mx-auto w-full max-w-[760px] space-y-4 text-slate-700"
            style={{ fontFamily: activeTemplate.fontFamily }}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: primaryColor }}
            />
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
                  activeSection === "header" &&
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
                    activeSection === "meta" &&
                      "border-primary ring-primary/20 ring-2",
                  )}
                  onClick={() => {
                    activateSection("meta");
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                      Metadonnees
                    </p>
                    {options.showDocumentTitle ? (
                      <span className="border border-slate-300 px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                        Document
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
                    activeSection === "client" &&
                      "border-primary ring-primary/20 ring-2",
                  )}
                  onClick={() => {
                    activateSection("client");
                  }}
                >
                  <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                    Client
                  </p>
                  <Select
                    value={selectedClientId}
                    onValueChange={(value) => {
                      onSelectedClientIdChange?.(value);
                    }}
                    disabled={!canInteract || !onSelectedClientIdChange}
                  >
                    <SelectTrigger
                      className={cn("h-8 w-full text-xs", previewEditableClass)}
                    >
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
                    {options.showDeliveryAddress ? (
                      <p>Adresse de livraison: idem client</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "space-y-2 p-3",
                previewSectionBorderClass,
                activeSection === "lines" &&
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
                          onLineChange?.(
                            line.key,
                            "description",
                            event.target.value,
                          );
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
                          onLineChange?.(
                            line.key,
                            "quantity",
                            event.target.value,
                          );
                        }}
                      />
                      <Select
                        value={line.unit}
                        onValueChange={(value) => {
                          onLineChange?.(line.key, "unit", value);
                        }}
                        disabled={!canInteract || !onLineChange}
                      >
                        <SelectTrigger
                          className={cn("h-8 text-xs", previewEditableClass)}
                        >
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
                          onLineChange?.(
                            line.key,
                            "unitPrice",
                            event.target.value,
                          );
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
                          onLineChange?.(
                            line.key,
                            "vatRate",
                            event.target.value,
                          );
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
                  activeSection === "legal" &&
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
                  {issuer?.vatExemptionMention ??
                    "TVA non applicable, art. 293 B du CGI"}
                </p>
                {options.showBankInfo ? (
                  <p className="text-[11px] text-slate-500">
                    {issuer?.iban
                      ? `IBAN ${issuer.iban}`
                      : "IBAN non renseigne"}
                    {issuer?.bic ? ` · BIC ${issuer.bic}` : ""}
                  </p>
                ) : null}
                {issuer?.documentFooterText ? (
                  <p className="text-[11px] text-slate-500">
                    {issuer.documentFooterText}
                  </p>
                ) : null}
              </div>

              <div
                className={cn(
                  "space-y-1.5 p-3",
                  previewSectionBorderClass,
                  activeSection === "totals" &&
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
}
