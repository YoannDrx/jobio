"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { InlineTooltip } from "@/components/ui/tooltip";
import { BillingDeclarationPeriodType } from "@/generated/prisma";
import { searchBillingCompaniesAction } from "@/features/freelance/billing-company-search.action";
import {
  getBillingProfileAction,
  upsertBillingProfileAction,
} from "@/features/freelance/billing-clients.action";
import { ImageFormItem } from "@/features/images/image-form-item";
import {
  ACTIVITY_CATEGORY_VALUES,
  FREELANCE_STATUS_VALUES,
  activityCategoryLabel,
  buildBillingComplianceChecklist,
  freelanceStatusLabel,
  resolveBillingCompliancePreset,
} from "@/features/freelance/billing-compliance-rules";
import {
  BILLING_DOCUMENT_TEMPLATES,
  DEFAULT_BILLING_DOCUMENT_ACCENT_COLOR,
  DEFAULT_BILLING_DOCUMENT_PRIMARY_COLOR,
  DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID,
  resolveBillingDocumentTemplate,
  type BillingDocumentTemplateId,
} from "@/features/freelance/billing-document-templates";
import {
  BillingDocumentStudio,
  type BillingStudioLine,
} from "@/features/freelance/components/billing-document-studio";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { CircleHelp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BillingProfileState = {
  legalName: string;
  legalForm: string;
  siret: string;
  vatNumber: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  email: string;
  phone: string;
  website: string;
  iban: string;
  bic: string;
  paymentTermsInDays: string;
  latePenaltyRate: string;
  latePenaltyFlatFeeEur: string;
  notes: string;
  freelanceStatus: (typeof FREELANCE_STATUS_VALUES)[number];
  activityCategory: (typeof ACTIVITY_CATEGORY_VALUES)[number] | "";
  urssafDeclarationType: BillingDeclarationPeriodType;
  urssafContributionRate: string;
  vatExemptionMention: string;
  documentTemplate: BillingDocumentTemplateId;
  documentPrimaryColor: string;
  documentAccentColor: string;
  documentLogoUrl: string;
  documentFooterText: string;
  documentShowNotes: boolean;
  documentShowTerms: boolean;
  documentShowBankDetails: boolean;
  documentShowClientContact: boolean;
  documentShowIssuerContact: boolean;
  documentShowLineVat: boolean;
};

type AddressSuggestion = {
  label: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  countryCode: string;
};

type CompanySearchResult = {
  siren: string;
  siret: string | null;
  displayName: string;
  legalName: string | null;
  vatNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
};

type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

const INITIAL_PROFILE: BillingProfileState = {
  legalName: "",
  legalForm: "",
  siret: "",
  vatNumber: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  countryCode: "FR",
  email: "",
  phone: "",
  website: "",
  iban: "",
  bic: "",
  paymentTermsInDays: "30",
  latePenaltyRate: "",
  latePenaltyFlatFeeEur: "40",
  notes: "",
  freelanceStatus: "MICRO_ENTREPRISE",
  activityCategory: "LIBERAL",
  urssafDeclarationType: BillingDeclarationPeriodType.QUARTERLY,
  urssafContributionRate: "23.1",
  vatExemptionMention: "TVA non applicable, art. 293 B du CGI",
  documentTemplate: DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID,
  documentPrimaryColor: DEFAULT_BILLING_DOCUMENT_PRIMARY_COLOR,
  documentAccentColor: DEFAULT_BILLING_DOCUMENT_ACCENT_COLOR,
  documentLogoUrl: "",
  documentFooterText: "",
  documentShowNotes: true,
  documentShowTerms: true,
  documentShowBankDetails: true,
  documentShowClientContact: true,
  documentShowIssuerContact: true,
  documentShowLineVat: true,
};

const STATUS_TO_LEGAL_FORM: Partial<
  Record<(typeof FREELANCE_STATUS_VALUES)[number], string>
> = {
  MICRO_ENTREPRISE: "Micro-entreprise",
  EI: "Entreprise individuelle",
  EURL: "EURL",
  SASU: "SASU",
  SAS: "SAS",
  SA: "SA",
  PORTAGE: "Portage salarial",
  AUTRE: "Autre statut",
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", flag: "🇱🇺" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Allemagne", dialCode: "+49", flag: "🇩🇪" },
  { code: "ES", name: "Espagne", dialCode: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italie", dialCode: "+39", flag: "🇮🇹" },
];

const getCountryOption = (code: string) => {
  return COUNTRY_OPTIONS.find((option) => option.code === code);
};

const parsePhoneValue = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {
      countryCode: "FR",
      localNumber: "",
    };
  }

  const matched = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
  if (!matched) {
    return {
      countryCode: "FR",
      localNumber: trimmed,
    };
  }

  const dialCode = matched[1];
  const localNumber = matched[2];
  const country =
    COUNTRY_OPTIONS.find((option) => option.dialCode === dialCode)?.code ?? "FR";

  return {
    countryCode: country,
    localNumber,
  };
};

const composePhoneValue = (countryCode: string, localNumber: string) => {
  const dialCode = getCountryOption(countryCode)?.dialCode ?? "+33";
  const normalizedLocal = localNumber.trim();
  if (normalizedLocal.length === 0) {
    return "";
  }

  return `${dialCode} ${normalizedLocal}`.trim();
};

const FieldLabel = ({ label, hint }: { label: string; hint?: string }) => {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      {hint ? (
        <InlineTooltip title={hint}>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex"
            aria-label={`Aide: ${label}`}
          >
            <CircleHelp className="size-3.5" />
          </button>
        </InlineTooltip>
      ) : null}
    </div>
  );
};

const formatRate = (value: number) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

export function FreelanceBillingProfileForm() {
  const [profile, setProfile] = useState<BillingProfileState>(INITIAL_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>(
    [],
  );
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState("FR");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<
    CompanySearchResult[]
  >([]);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);

  const setField = <K extends keyof BillingProfileState>(
    key: K,
    value: BillingProfileState[K],
  ) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const preset = useMemo(() => {
    return resolveBillingCompliancePreset({
      freelanceStatus: profile.freelanceStatus,
      activityCategory: profile.activityCategory || null,
    });
  }, [profile.freelanceStatus, profile.activityCategory]);

  const resolvedLegalForm = useMemo(() => {
    if (profile.legalForm.trim().length > 0) {
      return profile.legalForm;
    }

    return STATUS_TO_LEGAL_FORM[profile.freelanceStatus] ?? "";
  }, [profile.legalForm, profile.freelanceStatus]);

  const complianceChecklist = useMemo(() => {
    return buildBillingComplianceChecklist({
      freelanceStatus: profile.freelanceStatus,
      activityCategory: profile.activityCategory || null,
      legalName: profile.legalName,
      legalForm: resolvedLegalForm,
      siret: profile.siret,
      addressLine1: profile.addressLine1,
      postalCode: profile.postalCode,
      city: profile.city,
      countryCode: profile.countryCode,
      email: profile.email,
      vatNumber: profile.vatNumber,
      vatExemptionMention: profile.vatExemptionMention,
      iban: profile.iban,
      bic: profile.bic,
      documentShowBankDetails: profile.documentShowBankDetails,
    });
  }, [profile, resolvedLegalForm]);

  const missingRequiredCount = useMemo(() => {
    return complianceChecklist.filter((item) => item.required && !item.ok).length;
  }, [complianceChecklist]);

  const selectedTemplate = useMemo(() => {
    return resolveBillingDocumentTemplate(profile.documentTemplate);
  }, [profile.documentTemplate]);
  const settingsPreviewLines = useMemo<BillingStudioLine[]>(() => {
    return [
      {
        key: "preview-1",
        description: "Prestation freelance",
        quantity: "1",
        unit: "jour",
        unitPrice: "500",
        vatRate: profile.documentShowLineVat ? "20" : "0",
        discountPercent: "0",
      },
    ];
  }, [profile.documentShowLineVat]);

  const computeSettingsPreviewLineTotals = useCallback((line: BillingStudioLine) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    const vatRate = Number(line.vatRate);
    const discountPercent = Number(line.discountPercent);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isFinite(vatRate) ||
      vatRate < 0 ||
      !Number.isFinite(discountPercent) ||
      discountPercent < 0
    ) {
      return {
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0,
      };
    }

    const baseCents = Math.round(quantity * unitPrice * 100);
    const discountCents = Math.round(baseCents * (discountPercent / 100));
    const subtotalCents = Math.max(0, baseCents - discountCents);
    const taxCents = Math.round(subtotalCents * (vatRate / 100));
    return {
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
    };
  }, []);

  const settingsPreviewTotals = useMemo(() => {
    return settingsPreviewLines.reduce(
      (accumulator, line) => {
        const lineTotals = computeSettingsPreviewLineTotals(line);
        return {
          subtotalCents: accumulator.subtotalCents + lineTotals.subtotalCents,
          taxCents: accumulator.taxCents + lineTotals.taxCents,
          totalCents: accumulator.totalCents + lineTotals.totalCents,
        };
      },
      { subtotalCents: 0, taxCents: 0, totalCents: 0 },
    );
  }, [computeSettingsPreviewLineTotals, settingsPreviewLines]);

  const applyCompliancePreset = () => {
    setProfile((previous) => ({
      ...previous,
      urssafDeclarationType: preset.defaultDeclarationType,
      urssafContributionRate: formatRate(preset.defaultContributionRatePercent),
      vatExemptionMention:
        preset.vatExemptionSuggestedText ?? previous.vatExemptionMention,
    }));
    toast.success("Preset statut appliqué");
  };

  const applyAddressSuggestion = (suggestion: AddressSuggestion) => {
    setProfile((previous) => ({
      ...previous,
      addressLine1: suggestion.addressLine1,
      postalCode: suggestion.postalCode,
      city: suggestion.city,
      countryCode: suggestion.countryCode,
    }));
    setAddressSuggestions([]);
  };

  const handleSearchCompany = async () => {
    if (companySearchQuery.trim().length < 2) {
      setCompanySearchResults([]);
      return;
    }

    setIsSearchingCompany(true);
    try {
      const result = await resolveActionResult(
        searchBillingCompaniesAction({
          query: companySearchQuery,
        }),
      );
      setCompanySearchResults(result.companies as CompanySearchResult[]);
    } catch (error) {
      setCompanySearchResults([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Recherche entreprise indisponible",
      );
    } finally {
      setIsSearchingCompany(false);
    }
  };

  const applyCompanyResult = (company: CompanySearchResult) => {
    setProfile((previous) => ({
      ...previous,
      legalName: company.legalName ?? company.displayName,
      legalForm: previous.legalForm,
      siret: company.siret ?? previous.siret,
      vatNumber: company.vatNumber ?? previous.vatNumber,
      addressLine1: company.addressLine1,
      addressLine2: company.addressLine2 ?? previous.addressLine2,
      postalCode: company.postalCode,
      city: company.city,
      countryCode: company.countryCode || "FR",
    }));
    setCompanySearchResults([]);
    toast.success("Informations société appliquées");
  };

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(getBillingProfileAction({}));

      if (!result) {
        setProfile(INITIAL_PROFILE);
        setPhoneCountryCode("FR");
        setPhoneLocalNumber("");
        return;
      }

      const computedPreset = resolveBillingCompliancePreset({
        freelanceStatus: result.freelanceStatus ?? null,
        activityCategory: result.activityCategory ?? null,
      });

      const fallbackStatus =
        (result.freelanceStatus as BillingProfileState["freelanceStatus"] | null) ??
        INITIAL_PROFILE.freelanceStatus;

      const fallbackActivity =
        (result.activityCategory as BillingProfileState["activityCategory"] | null) ??
        (fallbackStatus === "MICRO_ENTREPRISE" ? "LIBERAL" : "");

      const nextProfile: BillingProfileState = {
        legalName: result.legalName,
        legalForm: result.legalForm ?? "",
        siret: result.siret ?? "",
        vatNumber: result.vatNumber ?? "",
        addressLine1: result.addressLine1,
        addressLine2: result.addressLine2 ?? "",
        postalCode: result.postalCode,
        city: result.city,
        countryCode: result.countryCode,
        email: result.email ?? "",
        phone: result.phone ?? "",
        website: result.website ?? "",
        iban: result.iban ?? "",
        bic: result.bic ?? "",
        paymentTermsInDays: String(result.paymentTermsInDays),
        latePenaltyRate:
          result.latePenaltyRate === null ? "" : String(result.latePenaltyRate),
        latePenaltyFlatFeeEur:
          result.latePenaltyFlatFeeEur === null
            ? "40"
            : String(result.latePenaltyFlatFeeEur),
        notes: result.notes ?? "",
        freelanceStatus: fallbackStatus,
        activityCategory: fallbackActivity,
        urssafDeclarationType:
          result.urssafDeclarationType ?? computedPreset.defaultDeclarationType,
        urssafContributionRate: formatRate(
          result.urssafContributionRate ?? computedPreset.defaultContributionRatePercent,
        ),
        vatExemptionMention:
          result.vatExemptionMention ?? computedPreset.vatExemptionSuggestedText ?? "",
        documentTemplate:
          (result.documentTemplate as BillingDocumentTemplateId | null) ??
          DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID,
        documentPrimaryColor:
          result.documentPrimaryColor ?? DEFAULT_BILLING_DOCUMENT_PRIMARY_COLOR,
        documentAccentColor:
          result.documentAccentColor ?? DEFAULT_BILLING_DOCUMENT_ACCENT_COLOR,
        documentLogoUrl: result.documentLogoUrl ?? "",
        documentFooterText: result.documentFooterText ?? "",
        documentShowNotes: result.documentShowNotes,
        documentShowTerms: result.documentShowTerms,
        documentShowBankDetails: result.documentShowBankDetails,
        documentShowClientContact: result.documentShowClientContact,
        documentShowIssuerContact: result.documentShowIssuerContact,
        documentShowLineVat: result.documentShowLineVat,
      };

      const parsedPhone = parsePhoneValue(nextProfile.phone);
      setPhoneCountryCode(parsedPhone.countryCode);
      setPhoneLocalNumber(parsedPhone.localNumber);
      setProfile(nextProfile);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les paramètres",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setProfile((previous) => {
      const nextPhone = composePhoneValue(phoneCountryCode, phoneLocalNumber);
      if (previous.phone === nextPhone) {
        return previous;
      }

      return {
        ...previous,
        phone: nextPhone,
      };
    });
  }, [phoneCountryCode, phoneLocalNumber]);

  useEffect(() => {
    const query = profile.addressLine1.trim();
    if (profile.countryCode !== "FR" || query.length < 4) {
      setAddressSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          features?: {
            properties?: {
              label?: string;
              name?: string;
              postcode?: string;
              city?: string;
            };
          }[];
        };

        const suggestions = (payload.features ?? [])
          .map((feature) => {
            const properties = feature.properties;
            if (!properties?.name || !properties.postcode || !properties.city) {
              return null;
            }

            return {
              label:
                properties.label ??
                `${properties.name}, ${properties.postcode} ${properties.city}`,
              addressLine1: properties.name,
              postalCode: properties.postcode,
              city: properties.city,
              countryCode: "FR",
            } as AddressSuggestion;
          })
          .filter(
            (entry): entry is AddressSuggestion => entry !== null,
          );

        setAddressSuggestions(suggestions);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      setIsSearchingAddress(false);
    };
  }, [profile.addressLine1, profile.countryCode]);

  const handleSave = async () => {
    if (!profile.legalName || !profile.addressLine1 || !profile.postalCode || !profile.city) {
      toast.error("Les champs légaux principaux sont requis");
      return;
    }

    const urssafRateNumber = Number(profile.urssafContributionRate);
    if (!Number.isFinite(urssafRateNumber) || urssafRateNumber < 0 || urssafRateNumber > 100) {
      toast.error("Taux URSSAF invalide");
      return;
    }

    setIsSaving(true);
    try {
      await resolveActionResult(
        upsertBillingProfileAction({
          legalName: profile.legalName,
          legalForm: resolvedLegalForm,
          siret: profile.siret,
          vatNumber: profile.vatNumber,
          addressLine1: profile.addressLine1,
          addressLine2: profile.addressLine2,
          postalCode: profile.postalCode,
          city: profile.city,
          countryCode: profile.countryCode || "FR",
          email: profile.email,
          phone: profile.phone,
          website: profile.website,
          iban: profile.iban,
          bic: profile.bic,
          paymentTermsInDays: Number(profile.paymentTermsInDays || "30"),
          latePenaltyRate:
            profile.latePenaltyRate.trim().length > 0
              ? Number(profile.latePenaltyRate)
              : undefined,
          latePenaltyFlatFeeEur: Number(profile.latePenaltyFlatFeeEur || "40"),
          notes: profile.notes,
          freelanceStatus: profile.freelanceStatus,
          activityCategory: profile.activityCategory || undefined,
          urssafDeclarationType: profile.urssafDeclarationType,
          urssafContributionRate: urssafRateNumber,
          vatExemptionMention: profile.vatExemptionMention,
          documentTemplate: profile.documentTemplate,
          documentPrimaryColor: profile.documentPrimaryColor,
          documentAccentColor: profile.documentAccentColor,
          documentLogoUrl: profile.documentLogoUrl,
          documentFooterText: profile.documentFooterText,
          documentShowNotes: profile.documentShowNotes,
          documentShowTerms: profile.documentShowTerms,
          documentShowBankDetails: profile.documentShowBankDetails,
          documentShowClientContact: profile.documentShowClientContact,
          documentShowIssuerContact: profile.documentShowIssuerContact,
          documentShowLineVat: profile.documentShowLineVat,
        }),
      );
      toast.success("Profil de facturation enregistré");
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = isLoading || isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil de facturation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Statut & conformité</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisabled}
              onClick={applyCompliancePreset}
            >
              Appliquer le preset {preset.statusLabel}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <FieldLabel label="Statut freelance" />
              <Select
                value={profile.freelanceStatus}
                onValueChange={(value) => {
                  setField(
                    "freelanceStatus",
                    value as BillingProfileState["freelanceStatus"],
                  );
                  if (value !== "MICRO_ENTREPRISE") {
                    setField("activityCategory", "");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {FREELANCE_STATUS_VALUES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {freelanceStatusLabel[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel label="Catégorie d'activité" />
              <Select
                value={profile.activityCategory || "none"}
                onValueChange={(value) => {
                  setField(
                    "activityCategory",
                    value === "none"
                      ? ""
                      : (value as BillingProfileState["activityCategory"]),
                  );
                }}
              >
                <SelectTrigger
                  className="w-full"
                  disabled={profile.freelanceStatus !== "MICRO_ENTREPRISE"}
                >
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non applicable</SelectItem>
                  {ACTIVITY_CATEGORY_VALUES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {activityCategoryLabel[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel label="Fréquence déclaration URSSAF" />
              <Select
                value={profile.urssafDeclarationType}
                onValueChange={(value) => {
                  setField(
                    "urssafDeclarationType",
                    value as BillingDeclarationPeriodType,
                  );
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BillingDeclarationPeriodType.MONTHLY}>
                    Mensuel
                  </SelectItem>
                  <SelectItem value={BillingDeclarationPeriodType.QUARTERLY}>
                    Trimestriel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel
                label="Taux de cotisations URSSAF (%)"
                hint="Taux estimatif appliqué au chiffre d'affaires encaissé pour le calcul de charges."
              />
              <Input
                type="number"
                min="0"
                step="0.1"
                value={profile.urssafContributionRate}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("urssafContributionRate", event.target.value);
                }}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <FieldLabel
                label="Mention TVA"
                hint="Mention légale affichée sur les factures (ex: art. 293 B CGI)."
              />
              <Textarea
                rows={2}
                value={profile.vatExemptionMention}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("vatExemptionMention", event.target.value);
                }}
              />
            </div>
          </div>
          <div className="text-muted-foreground text-xs">
            Recommandation actuelle: {preset.defaultContributionRatePercent}% en{" "}
            {preset.defaultDeclarationType === BillingDeclarationPeriodType.MONTHLY
              ? "mensuel"
              : "trimestriel"}
            . {preset.notes.at(0)}
          </div>
          <div className="space-y-1 rounded-md border p-3">
            <p className="text-sm font-medium">
              Checklist conformité{" "}
              {missingRequiredCount > 0
                ? `(${missingRequiredCount} point(s) requis manquant(s))`
                : "(OK)"}
            </p>
            <div className="space-y-1 text-sm">
              {complianceChecklist.map((item) => (
                <p
                  key={item.id}
                  className={item.ok ? "text-emerald-700" : "text-amber-700"}
                >
                  {item.ok ? "✓" : "•"} {item.label}
                  {item.required ? " (requis)" : " (recommandé)"}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm font-medium">Informations légales & paiement</p>
          <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
            <FieldLabel label="Recherche société (SIREN/SIRET)" />
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Nom, SIREN ou SIRET"
                value={companySearchQuery}
                disabled={isDisabled}
                className="min-w-[220px] flex-1"
                onChange={(event) => {
                  setCompanySearchQuery(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearchCompany();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isDisabled || isSearchingCompany}
                onClick={() => {
                  void handleSearchCompany();
                }}
              >
                {isSearchingCompany ? <Loader2 className="size-4 animate-spin" /> : null}
                Rechercher
              </Button>
            </div>
            {companySearchResults.length > 0 ? (
              <div className="space-y-2">
                {companySearchResults.slice(0, 5).map((company) => (
                  <div
                    key={`${company.siren}-${company.siret ?? "none"}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-white px-2 py-1.5"
                  >
                    <div className="text-sm">
                      <p className="font-medium">{company.displayName}</p>
                      <p className="text-muted-foreground text-xs">
                        {company.siret ?? company.siren} · {company.postalCode}{" "}
                        {company.city}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        applyCompanyResult(company);
                      }}
                    >
                      Appliquer
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <FieldLabel label="Raison sociale" />
              <Input
                value={profile.legalName}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("legalName", event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel
                label="Forme juridique déduite"
                hint="Déduite automatiquement du statut freelance pour éviter les doublons."
              />
              <div className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
                {resolvedLegalForm || "Non déduite"}
              </div>
            </div>

            <div className="space-y-1">
              <FieldLabel label="SIRET" />
              <Input
                value={profile.siret}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("siret", event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel label="Numéro TVA intracommunautaire" />
              <Input
                value={profile.vatNumber}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("vatNumber", event.target.value);
                }}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <FieldLabel
                label="Adresse"
                hint="Saisie intelligente activée pour les adresses françaises."
              />
              <Input
                value={profile.addressLine1}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("addressLine1", event.target.value);
                }}
              />
              {isSearchingAddress && profile.countryCode === "FR" ? (
                <p className="text-muted-foreground text-xs">
                  Recherche d’adresses…
                </p>
              ) : null}
              {addressSuggestions.length > 0 ? (
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border p-1">
                  {addressSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      className="hover:bg-muted w-full rounded-sm px-2 py-1.5 text-left text-xs"
                      onClick={() => {
                        applyAddressSuggestion(suggestion);
                      }}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-1 md:col-span-2">
              <FieldLabel label="Complément d'adresse" />
              <Input
                value={profile.addressLine2}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("addressLine2", event.target.value);
                }}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel label="Code postal" />
              <Input
                value={profile.postalCode}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("postalCode", event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel label="Ville" />
              <Input
                value={profile.city}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("city", event.target.value);
                }}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel label="Pays" />
              <Select
                value={profile.countryCode}
                onValueChange={(value) => {
                  setField("countryCode", value);
                  setPhoneCountryCode(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel label="Email" />
              <Input
                value={profile.email}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("email", event.target.value);
                }}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel label="Téléphone" />
              <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2">
                <Select
                  value={phoneCountryCode}
                  onValueChange={(value) => {
                    setPhoneCountryCode(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Indicatif" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((country) => (
                      <SelectItem key={`phone-${country.code}`} value={country.code}>
                        {country.flag} {country.dialCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Numéro"
                  value={phoneLocalNumber}
                  disabled={isDisabled}
                  onChange={(event) => {
                    setPhoneLocalNumber(event.target.value);
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <FieldLabel label="Site web" />
              <Input
                value={profile.website}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("website", event.target.value);
                }}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel label="IBAN" />
              <Input
                value={profile.iban}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("iban", event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel label="BIC" />
              <Input
                value={profile.bic}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("bic", event.target.value);
                }}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel
                label="Délai de paiement (jours)"
                hint="Ex: 30 = paiement attendu à 30 jours."
              />
              <Input
                type="number"
                min="0"
                value={profile.paymentTermsInDays}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("paymentTermsInDays", event.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel
                label="Pénalités de retard (%)"
                hint="Taux annuel appliqué en cas de retard de paiement."
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={profile.latePenaltyRate}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("latePenaltyRate", event.target.value);
                }}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <FieldLabel
                label="Indemnité forfaitaire (€)"
                hint="Montant forfaitaire pour frais de recouvrement (souvent 40€ en B2B)."
              />
              <Input
                type="number"
                min="0"
                value={profile.latePenaltyFlatFeeEur}
                disabled={isDisabled}
                onChange={(event) => {
                  setField("latePenaltyFlatFeeEur", event.target.value);
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm font-medium">Personnalisation des documents</p>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.95fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabel label="Template de facture" />
                <Select
                  value={profile.documentTemplate}
                  onValueChange={(value) => {
                    const template = resolveBillingDocumentTemplate(value);
                    setProfile((previous) => ({
                      ...previous,
                      documentTemplate: template.id,
                      documentPrimaryColor: template.primaryColor,
                      documentAccentColor: template.accentColor,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_DOCUMENT_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {selectedTemplate.mood}
                </p>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {BILLING_DOCUMENT_TEMPLATES.map((template) => {
                    const isActive = template.id === profile.documentTemplate;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setProfile((previous) => ({
                            ...previous,
                            documentTemplate: template.id,
                            documentPrimaryColor: template.primaryColor,
                            documentAccentColor: template.accentColor,
                          }));
                        }}
                        className={`rounded-md border p-2 text-left transition ${
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/60"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">{template.label}</span>
                          <div className="flex items-center gap-1">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: template.primaryColor }}
                            />
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: template.accentColor }}
                            />
                          </div>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{template.mood}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <FieldLabel label="Couleur principale" />
                  <div className="flex items-center gap-2">
                    <Input
                      id="documentPrimaryColor"
                      type="color"
                      className="h-10 w-12 p-1"
                      value={profile.documentPrimaryColor}
                      disabled={isDisabled}
                      onChange={(event) => {
                        setField("documentPrimaryColor", event.target.value);
                      }}
                    />
                    <Input
                      value={profile.documentPrimaryColor}
                      disabled={isDisabled}
                      onChange={(event) => {
                        setField("documentPrimaryColor", event.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <FieldLabel label="Couleur d'accent" />
                  <div className="flex items-center gap-2">
                    <Input
                      id="documentAccentColor"
                      type="color"
                      className="h-10 w-12 p-1"
                      value={profile.documentAccentColor}
                      disabled={isDisabled}
                      onChange={(event) => {
                        setField("documentAccentColor", event.target.value);
                      }}
                    />
                    <Input
                      value={profile.documentAccentColor}
                      disabled={isDisabled}
                      onChange={(event) => {
                        setField("documentAccentColor", event.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <ImageFormItem
                  imageUrl={profile.documentLogoUrl || undefined}
                  onChange={(url) => {
                    setField("documentLogoUrl", url);
                  }}
                  className="h-24 w-32"
                />
                <div className="space-y-1">
                  <FieldLabel
                    label="Logo"
                    hint="Tu peux uploader une image, ou coller une URL."
                  />
                  <Input
                    placeholder="URL logo (https://...)"
                    value={profile.documentLogoUrl}
                    disabled={isDisabled}
                    onChange={(event) => {
                      setField("documentLogoUrl", event.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <FieldLabel label="Texte de pied de page" />
                <Textarea
                  rows={3}
                  value={profile.documentFooterText}
                  disabled={isDisabled}
                  onChange={(event) => {
                    setField("documentFooterText", event.target.value);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Label className="inline-flex w-fit min-w-[220px] items-center justify-between gap-3 rounded-md border px-3 py-2">
                  Afficher les notes
                  <Switch
                    checked={profile.documentShowNotes}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      setField("documentShowNotes", checked);
                    }}
                  />
                </Label>
                <Label className="inline-flex w-fit min-w-[220px] items-center justify-between gap-3 rounded-md border px-3 py-2">
                  Afficher les conditions
                  <Switch
                    checked={profile.documentShowTerms}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      setField("documentShowTerms", checked);
                    }}
                  />
                </Label>
                <Label className="inline-flex w-fit min-w-[220px] items-center justify-between gap-3 rounded-md border px-3 py-2">
                  Afficher coordonnées client
                  <Switch
                    checked={profile.documentShowClientContact}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      setField("documentShowClientContact", checked);
                    }}
                  />
                </Label>
                <Label className="inline-flex w-fit min-w-[220px] items-center justify-between gap-3 rounded-md border px-3 py-2">
                  Afficher coordonnées émetteur
                  <Switch
                    checked={profile.documentShowIssuerContact}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      setField("documentShowIssuerContact", checked);
                    }}
                  />
                </Label>
                <Label className="inline-flex w-fit min-w-[220px] items-center justify-between gap-3 rounded-md border px-3 py-2">
                  Afficher détails bancaires
                  <Switch
                    checked={profile.documentShowBankDetails}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      setField("documentShowBankDetails", checked);
                    }}
                  />
                </Label>
                <Label className="inline-flex w-fit min-w-[220px] items-center justify-between gap-3 rounded-md border px-3 py-2">
                  Afficher colonnes TVA ligne
                  <Switch
                    checked={profile.documentShowLineVat}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      setField("documentShowLineVat", checked);
                    }}
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium tracking-wide uppercase">
                  Aperçu live (même preview que Facture)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open(
                        "/api/freelance/render-template?mode=preview",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                  >
                    Aperçu serveur
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open(
                        "/api/freelance/render-template?mode=pdf",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                  >
                    PDF réel
                  </Button>
                </div>
              </div>
              <BillingDocumentStudio
                title="Preview template"
                description="Même moteur de preview A4 que le studio Factures/Devis."
                documentLabel="Facture"
                secondaryDateLabel="Échéance"
                issuer={{
                  legalName: profile.legalName,
                  tradeName: profile.legalName,
                  addressLine1: profile.addressLine1,
                  addressLine2: profile.addressLine2,
                  postalCode: profile.postalCode,
                  city: profile.city,
                  email: profile.documentShowIssuerContact ? profile.email : null,
                  iban: profile.iban,
                  bic: profile.bic,
                  vatExemptionMention: profile.vatExemptionMention,
                  documentFooterText: profile.documentFooterText,
                  documentLogoUrl: profile.documentLogoUrl || null,
                }}
                clients={[
                  {
                    id: "preview-client",
                    displayName: "Client exemple",
                    siret: profile.documentShowClientContact ? "123 456 789" : null,
                    vatNumber: profile.documentShowClientContact ? "FR00123456789" : null,
                  },
                ]}
                selectedClientId="preview-client"
                selectedClient={{
                  id: "preview-client",
                  displayName: "Client exemple",
                  siret: profile.documentShowClientContact ? "123 456 789" : null,
                  vatNumber: profile.documentShowClientContact ? "FR00123456789" : null,
                }}
                issueDate="2026-02-16"
                secondaryDate="2026-03-18"
                currency="EUR"
                lines={settingsPreviewLines}
                notes={
                  profile.documentShowNotes
                    ? profile.vatExemptionMention || "TVA non applicable, art. 293 B du CGI"
                    : ""
                }
                terms={
                  profile.documentShowTerms
                    ? "Conditions de paiement et informations complémentaires."
                    : ""
                }
                totals={settingsPreviewTotals}
                computeLineTotals={computeSettingsPreviewLineTotals}
                documentTemplateId={profile.documentTemplate}
                documentPrimaryColor={profile.documentPrimaryColor}
                documentAccentColor={profile.documentAccentColor}
                options={{
                  showDeliveryAddress: false,
                  showClientSiret: profile.documentShowClientContact,
                  showClientVat: profile.documentShowClientContact,
                  showBankInfo: profile.documentShowBankDetails,
                  showPaymentConditions: profile.documentShowNotes,
                  showDocumentTitle: true,
                  showFreeField: profile.documentShowTerms,
                  showGlobalDiscount: false,
                }}
                creationMode="quick"
                language="fr"
                showEditorPanel={false}
                readOnlyPreview
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <FieldLabel label="Notes internes" />
          <Textarea
            rows={4}
            value={profile.notes}
            disabled={isDisabled}
            onChange={(event) => {
              setField("notes", event.target.value);
            }}
          />
        </div>

        <div>
          <Button type="button" disabled={isDisabled} onClick={handleSave}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer le profil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
