"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { BillingQuoteStatus } from "@/features/freelance/billing-client-enums";
import { getCatalogItemsAction } from "@/features/freelance/billing-catalog.action";
import {
  getBillingClientsAction,
  getBillingProfileAction,
} from "@/features/freelance/billing-clients.action";
import {
  DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID,
  resolveBillingDocumentTemplate,
  type BillingDocumentTemplateId,
} from "@/features/freelance/billing-document-templates";
import {
  convertQuoteToInvoiceAction,
  createQuoteDraftAction,
  deleteQuoteAction,
  duplicateQuoteAction,
  getQuotesAction,
  setQuoteStatusAction,
  updateQuoteDraftAction,
} from "@/features/freelance/billing-documents.action";
import {
  buildFreelanceDocumentUrl,
  formatCents,
  formatDate,
  quoteStatusLabel,
} from "@/features/freelance/billing-presenter";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import {
  BillingDocumentStudio,
  billingStudioUnitOptions,
  parseBillingStudioDescriptionUnit,
  resolveBillingStudioUnitLabel,
} from "@/features/freelance/components/billing-document-studio";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  Check,
  Copy,
  Ellipsis,
  Eye,
  FileDown,
  FileText,
  Loader2,
  PencilLine,
  Plus,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ClientOption = {
  id: string;
  displayName: string;
  siret?: string | null;
  vatNumber?: string | null;
};

type QuoteLineRow = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPercent: number;
  vatRatePercent: number;
};

type QuoteRow = {
  id: string;
  number: string | null;
  status: BillingQuoteStatus;
  issueDate: Date | string;
  validUntil: Date | string | null;
  currency: string;
  notes: string | null;
  terms: string | null;
  totalCents: number;
  client: {
    id: string;
    displayName: string;
  };
  lines: QuoteLineRow[];
};

type CatalogOption = {
  id: string;
  name: string;
  unitPriceCents: number;
  vatRatePercent: number;
};

type BillingProfilePreview = {
  legalName: string;
  tradeName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  email: string | null;
  iban: string | null;
  bic: string | null;
  paymentTermsInDays: number;
  vatExemptionMention: string | null;
  documentTemplate: string | null;
  documentPrimaryColor: string | null;
  documentAccentColor: string | null;
  documentLogoUrl: string | null;
  documentFooterText: string | null;
};

type QuoteLineForm = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
};

const statusVariant: Record<BillingQuoteStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SENT: "secondary",
  ACCEPTED: "default",
  REFUSED: "destructive",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
};

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

const createLineKey = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultLine = (): QuoteLineForm => ({
  key: createLineKey(),
  description: "",
  quantity: "1",
  unit: "unite",
  unitPrice: "0",
  vatRate: "0",
  discountPercent: "0",
});

const mapQuoteLineToForm = (line: QuoteLineRow): QuoteLineForm => {
  const parsedDescription = parseBillingStudioDescriptionUnit(line.description);
  return {
    key: createLineKey(),
    description: parsedDescription.description,
    quantity: String(line.quantity),
    unit: parsedDescription.unit,
    unitPrice: (line.unitPriceCents / 100).toFixed(2),
    vatRate: String(line.vatRatePercent),
    discountPercent: String(line.discountPercent),
  };
};

const parseLine = (line: QuoteLineForm) => {
  const quantity = Number(line.quantity);
  const unitPrice = Number(line.unitPrice);
  const vatRate = Number(line.vatRate);
  const discountPercent = Number(line.discountPercent);

  if (
    line.description.trim().length === 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0 ||
    !Number.isFinite(vatRate) ||
    vatRate < 0 ||
    vatRate > 100 ||
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    return null;
  }

  const baseDescription = line.description.trim();
  const unitLabel = resolveBillingStudioUnitLabel(line.unit);

  return {
    description:
      line.unit === "unite"
        ? baseDescription
        : `${baseDescription} (${unitLabel})`,
    quantity,
    unitPriceCents: Math.round(unitPrice * 100),
    discountPercent,
    vatRatePercent: vatRate,
  };
};

const computeLinePreviewTotals = (line: QuoteLineForm) => {
  const parsed = parseLine(line);
  if (!parsed) {
    return {
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
    };
  }

  const baseCents = parsed.unitPriceCents * parsed.quantity;
  const discountCents = Math.round(baseCents * (parsed.discountPercent / 100));
  const subtotalCents = Math.max(0, Math.round(baseCents - discountCents));
  const taxCents = Math.round(subtotalCents * (parsed.vatRatePercent / 100));
  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    taxCents,
    totalCents,
  };
};

export function FreelanceQuotesManager() {
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogOption[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [billingProfile, setBillingProfile] =
    useState<BillingProfilePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [processingQuoteId, setProcessingQuoteId] = useState<string | null>(
    null,
  );
  const [actionMenuQuoteId, setActionMenuQuoteId] = useState<string | null>(
    null,
  );
  const [pendingQuoteConfirmation, setPendingQuoteConfirmation] = useState<{
    type: "cancel" | "delete";
    quoteId: string;
    number: string | null;
  } | null>(null);

  const [clientId, setClientId] = useState("");
  const [catalogItemId, setCatalogItemId] = useState<string>("custom");
  const [createIssueDate, setCreateIssueDate] = useState(
    toDateInputValue(new Date()),
  );
  const [createValidUntil, setCreateValidUntil] = useState("");
  const [createCurrency, setCreateCurrency] = useState("EUR");
  const [createDocumentTemplate, setCreateDocumentTemplate] =
    useState<BillingDocumentTemplateId>(DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID);
  const [createNotes, setCreateNotes] = useState(
    "Conditions de validité du devis: 30 jours.",
  );
  const [createTerms, setCreateTerms] = useState("");
  const [createLines, setCreateLines] = useState<QuoteLineForm[]>([
    {
      key: createLineKey(),
      description: "Prestation freelance",
      quantity: "1",
      unit: "unite",
      unitPrice: "450",
      vatRate: "0",
      discountPercent: "0",
    },
  ]);
  const [quoteCreationMode, setQuoteCreationMode] = useState<"quick" | "full">(
    "quick",
  );
  const [createLanguage, setCreateLanguage] = useState("fr");
  const [showDeliveryAddress, setShowDeliveryAddress] = useState(false);
  const [showClientSiret, setShowClientSiret] = useState(true);
  const [showClientVat, setShowClientVat] = useState(true);
  const [showBankInfo, setShowBankInfo] = useState(true);
  const [showPaymentConditions, setShowPaymentConditions] = useState(true);
  const [showDocumentTitle, setShowDocumentTitle] = useState(false);
  const [showFreeField, setShowFreeField] = useState(true);
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editClientId, setEditClientId] = useState("");
  const [editIssueDate, setEditIssueDate] = useState("");
  const [editValidUntil, setEditValidUntil] = useState("");
  const [editCurrency, setEditCurrency] = useState("EUR");
  const [editNotes, setEditNotes] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [editLines, setEditLines] = useState<QuoteLineForm[]>([
    createDefaultLine(),
  ]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [clientsResult, quotesResult, catalogResult, profileResult] =
        await Promise.all([
          resolveActionResult(
            getBillingClientsAction({
              page: 1,
              pageSize: 100,
              sortBy: "displayName",
              sortOrder: "asc",
            }),
          ),
          resolveActionResult(
            getQuotesAction({
              page: 1,
              pageSize: 100,
            }),
          ),
          resolveActionResult(
            getCatalogItemsAction({
              page: 1,
              pageSize: 100,
            }),
          ),
          resolveActionResult(getBillingProfileAction({})),
        ]);

      const nextClients = clientsResult.clients.map((client) => ({
        id: client.id,
        displayName: client.displayName,
        siret: client.siret ?? null,
        vatNumber: client.vatNumber ?? null,
      }));

      setClients(nextClients);
      setQuotes(quotesResult.quotes as QuoteRow[]);
      setCatalogItems(catalogResult.items as CatalogOption[]);
      const nextProfile =
        (profileResult as BillingProfilePreview | null) ?? null;
      setBillingProfile(nextProfile);
      setCreateDocumentTemplate(
        resolveBillingDocumentTemplate(nextProfile?.documentTemplate).id,
      );

      if (!clientId && nextClients.length > 0) {
        setClientId(nextClients[0]?.id ?? "");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les devis",
      );
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const queryClientId = searchParams.get("clientId");
    if (!queryClientId) {
      return;
    }

    const match = clients.find((client) => client.id === queryClientId);
    if (match) {
      setClientId(match.id);
    }
  }, [searchParams, clients]);

  useEffect(() => {
    if (searchParams.get("create") !== "1") {
      return;
    }

    const target = document.getElementById("quote-create-card");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  useEffect(() => {
    if (!createIssueDate || createValidUntil) {
      return;
    }

    const issueDate = new Date(createIssueDate);
    if (Number.isNaN(issueDate.getTime())) {
      return;
    }

    issueDate.setDate(
      issueDate.getDate() + (billingProfile?.paymentTermsInDays ?? 30),
    );
    setCreateValidUntil(toDateInputValue(issueDate));
  }, [createIssueDate, createValidUntil, billingProfile?.paymentTermsInDays]);

  const parsedCreateLines = useMemo(
    () => createLines.map((line) => parseLine(line)),
    [createLines],
  );

  const createTotals = useMemo(() => {
    return createLines.reduce(
      (accumulator, line) => {
        const totals = computeLinePreviewTotals(line);
        return {
          subtotalCents: accumulator.subtotalCents + totals.subtotalCents,
          taxCents: accumulator.taxCents + totals.taxCents,
          totalCents: accumulator.totalCents + totals.totalCents,
        };
      },
      {
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0,
      },
    );
  }, [createLines]);

  const selectedCreateClient = useMemo(
    () => clients.find((client) => client.id === clientId) ?? null,
    [clients, clientId],
  );

  const canCreateQuote = useMemo(() => {
    if (!clientId || !createIssueDate || createCurrency.trim().length !== 3) {
      return false;
    }

    return (
      createLines.length > 0 && parsedCreateLines.every((line) => line !== null)
    );
  }, [
    clientId,
    createIssueDate,
    createCurrency,
    createLines.length,
    parsedCreateLines,
  ]);

  const canSaveEdit = useMemo(() => {
    if (
      !editingQuoteId ||
      !editClientId ||
      !editIssueDate ||
      editCurrency.trim().length !== 3
    ) {
      return false;
    }

    return (
      editLines.length > 0 &&
      editLines.every((line) => parseLine(line) !== null)
    );
  }, [editingQuoteId, editClientId, editIssueDate, editCurrency, editLines]);

  const handleCatalogSelection = (value: string) => {
    setCatalogItemId(value);

    if (value === "custom") {
      return;
    }

    const selected = catalogItems.find((item) => item.id === value);
    if (!selected) {
      return;
    }

    setCreateLines((previous) => {
      if (previous.length === 0) {
        return [
          {
            key: createLineKey(),
            description: selected.name,
            quantity: "1",
            unit: "unite",
            unitPrice: (selected.unitPriceCents / 100).toFixed(2),
            vatRate: String(selected.vatRatePercent),
            discountPercent: "0",
          },
        ];
      }

      const firstLine = previous[0];

      return [
        {
          ...firstLine,
          description: selected.name,
          unitPrice: (selected.unitPriceCents / 100).toFixed(2),
          vatRate: String(selected.vatRatePercent),
        },
        ...previous.slice(1),
      ];
    });
  };

  const handleCreateLineChange = (
    key: string,
    field: keyof Omit<QuoteLineForm, "key">,
    value: string,
  ) => {
    setCreateLines((previous) =>
      previous.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
  };

  const handleAddCreateLine = () => {
    setCreateLines((previous) => [...previous, createDefaultLine()]);
  };

  const handleRemoveCreateLine = (key: string) => {
    setCreateLines((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((line) => line.key !== key);
    });
  };

  const handleCreateQuote = async () => {
    if (!canCreateQuote) {
      toast.error("Complète les champs du devis avant de créer");
      return;
    }

    const lines = parsedCreateLines.filter(
      (line): line is NonNullable<typeof line> => line !== null,
    );

    setIsCreating(true);
    try {
      await resolveActionResult(
        createQuoteDraftAction({
          clientId,
          issueDate: new Date(createIssueDate),
          validUntil: createValidUntil ? new Date(createValidUntil) : undefined,
          currency: createCurrency.toUpperCase(),
          notes: createNotes,
          terms: createTerms,
          lines,
        }),
      );

      toast.success("Devis brouillon créé");
      setCatalogItemId("custom");
      setCreateCurrency("EUR");
      setCreateIssueDate(toDateInputValue(new Date()));
      setCreateValidUntil("");
      setCreateNotes("Conditions de validité du devis: 30 jours.");
      setCreateTerms("");
      setCreateDocumentTemplate(
        resolveBillingDocumentTemplate(billingProfile?.documentTemplate).id,
      );
      setCreateLines([
        {
          key: createLineKey(),
          description: "Prestation freelance",
          quantity: "1",
          unit: "unite",
          unitPrice: "450",
          vatRate: "0",
          discountPercent: "0",
        },
      ]);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création impossible",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetStatus = async (
    quoteId: string,
    status: BillingQuoteStatus,
  ) => {
    setProcessingQuoteId(quoteId);
    try {
      await resolveActionResult(setQuoteStatusAction({ quoteId, status }));
      toast.success("Statut du devis mis à jour");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mise à jour impossible",
      );
    } finally {
      setProcessingQuoteId(null);
    }
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    setProcessingQuoteId(quoteId);
    try {
      await resolveActionResult(convertQuoteToInvoiceAction({ quoteId }));
      toast.success("Devis converti en facture");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Conversion impossible",
      );
    } finally {
      setProcessingQuoteId(null);
    }
  };

  const handleDuplicateQuote = async (quoteId: string) => {
    setActionMenuQuoteId(quoteId);
    try {
      await resolveActionResult(duplicateQuoteAction({ quoteId }));
      toast.success("Devis dupliqué en brouillon");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Duplication impossible",
      );
    } finally {
      setActionMenuQuoteId(null);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    setActionMenuQuoteId(quoteId);
    try {
      await resolveActionResult(deleteQuoteAction({ quoteId }));
      toast.success("Devis supprimé");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible",
      );
    } finally {
      setActionMenuQuoteId(null);
    }
  };

  const handleConfirmPendingQuoteAction = async () => {
    if (!pendingQuoteConfirmation) {
      return;
    }

    if (pendingQuoteConfirmation.type === "cancel") {
      setActionMenuQuoteId(pendingQuoteConfirmation.quoteId);
      try {
        await resolveActionResult(
          setQuoteStatusAction({
            quoteId: pendingQuoteConfirmation.quoteId,
            status: BillingQuoteStatus.CANCELLED,
          }),
        );
        toast.success("Devis annulé");
        setPendingQuoteConfirmation(null);
        await loadData();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Annulation impossible",
        );
      } finally {
        setActionMenuQuoteId(null);
      }
      return;
    }

    await handleDeleteQuote(pendingQuoteConfirmation.quoteId);
    setPendingQuoteConfirmation(null);
  };

  const handleOpenEdit = (quote: QuoteRow) => {
    setEditingQuoteId(quote.id);
    setEditClientId(quote.client.id);
    setEditIssueDate(toDateInputValue(quote.issueDate));
    setEditValidUntil(toDateInputValue(quote.validUntil));
    setEditCurrency(quote.currency);
    setEditNotes(quote.notes ?? "");
    setEditTerms(quote.terms ?? "");
    setEditLines(
      quote.lines.length > 0
        ? quote.lines.map(mapQuoteLineToForm)
        : [createDefaultLine()],
    );
    setIsEditOpen(true);
  };

  const handleUpdateLine = (
    key: string,
    field: keyof Omit<QuoteLineForm, "key">,
    value: string,
  ) => {
    setEditLines((previous) =>
      previous.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
  };

  const handleAddLine = () => {
    setEditLines((previous) => [...previous, createDefaultLine()]);
  };

  const handleRemoveLine = (key: string) => {
    setEditLines((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((line) => line.key !== key);
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuoteId || !canSaveEdit) {
      toast.error("Vérifie les champs du devis avant enregistrement");
      return;
    }

    const lines = editLines.map(parseLine);
    if (lines.some((line) => line === null)) {
      toast.error("Chaque ligne du devis doit être valide");
      return;
    }

    setIsSavingEdit(true);
    try {
      await resolveActionResult(
        updateQuoteDraftAction({
          quoteId: editingQuoteId,
          clientId: editClientId,
          issueDate: new Date(editIssueDate),
          validUntil: editValidUntil ? new Date(editValidUntil) : null,
          currency: editCurrency.toUpperCase(),
          notes: editNotes,
          terms: editTerms,
          lines: lines.filter(
            (line): line is NonNullable<typeof line> => line !== null,
          ),
        }),
      );

      toast.success("Devis brouillon mis à jour");
      setIsEditOpen(false);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mise à jour impossible",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderQuoteActions = (quote: QuoteRow, compact = false) => {
    return (
      <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-end"}`}>
        <Button
          variant="outline"
          size="icon"
          title="Aperçu"
          aria-label="Aperçu"
          onClick={() => {
            window.open(
              buildFreelanceDocumentUrl({
                type: "quote",
                id: quote.id,
                mode: "preview",
              }),
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Télécharger PDF"
          aria-label="Télécharger PDF"
          onClick={() => {
            window.open(
              buildFreelanceDocumentUrl({
                type: "quote",
                id: quote.id,
                mode: "pdf",
                download: true,
              }),
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          <FileDown className="size-4" />
        </Button>
        {quote.status === BillingQuoteStatus.DRAFT ? (
          <Button
            variant="outline"
            size="icon"
            title="Éditer"
            aria-label="Éditer"
            disabled={processingQuoteId === quote.id}
            onClick={() => {
              handleOpenEdit(quote);
            }}
          >
            <PencilLine className="size-4" />
          </Button>
        ) : null}
        {quote.status === BillingQuoteStatus.DRAFT ? (
          <Button
            variant="outline"
            size="icon"
            title="Envoyer"
            aria-label="Envoyer"
            disabled={processingQuoteId === quote.id}
            onClick={() => {
              void handleSetStatus(quote.id, BillingQuoteStatus.SENT);
            }}
          >
            <Send className="size-4" />
          </Button>
        ) : null}
        {quote.status === BillingQuoteStatus.SENT ? (
          <>
            <Button
              variant="outline"
              size="icon"
              title="Accepter"
              aria-label="Accepter"
              disabled={processingQuoteId === quote.id}
              onClick={() => {
                void handleSetStatus(quote.id, BillingQuoteStatus.ACCEPTED);
              }}
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Refuser"
              aria-label="Refuser"
              disabled={processingQuoteId === quote.id}
              onClick={() => {
                void handleSetStatus(quote.id, BillingQuoteStatus.REFUSED);
              }}
            >
              <X className="size-4" />
            </Button>
          </>
        ) : null}
        {quote.status !== BillingQuoteStatus.REFUSED &&
        quote.status !== BillingQuoteStatus.CANCELLED ? (
          <Button
            variant="outline"
            size="icon"
            title="Convertir en facture"
            aria-label="Convertir en facture"
            disabled={processingQuoteId === quote.id}
            onClick={() => {
              void handleConvertToInvoice(quote.id);
            }}
          >
            {processingQuoteId === quote.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Plus d'actions"
              disabled={actionMenuQuoteId === quote.id}
            >
              {actionMenuQuoteId === quote.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ellipsis className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                void handleDuplicateQuote(quote.id);
              }}
            >
              <Copy className="size-4" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={quote.status === BillingQuoteStatus.CANCELLED}
              onClick={() => {
                setPendingQuoteConfirmation({
                  type: "cancel",
                  quoteId: quote.id,
                  number: quote.number,
                });
              }}
            >
              <XCircle className="size-4" />
              Annuler
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setPendingQuoteConfirmation({
                  type: "delete",
                  quoteId: quote.id,
                  number: quote.number,
                });
              }}
            >
              <Trash2 className="size-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const activeTemplate = resolveBillingDocumentTemplate(createDocumentTemplate);
  const documentPrimaryColor =
    billingProfile?.documentPrimaryColor ?? activeTemplate.primaryColor;
  const documentAccentColor =
    billingProfile?.documentAccentColor ?? activeTemplate.accentColor;

  return (
    <div className="space-y-4">
      <Card id="quote-create-card">
        <CardHeader>
          <CardTitle>Quote Studio</CardTitle>
        </CardHeader>
        <CardContent>
          <BillingDocumentStudio
            title="Quote Studio"
            description="Même moteur live A4 que les factures, avec options avancées et sections cliquables."
            documentLabel="Devis"
            secondaryDateLabel="Validité"
            issuer={billingProfile}
            clients={clients}
            selectedClientId={clientId}
            onSelectedClientIdChange={setClientId}
            selectedClient={selectedCreateClient}
            issueDate={createIssueDate}
            onIssueDateChange={setCreateIssueDate}
            secondaryDate={createValidUntil}
            onSecondaryDateChange={setCreateValidUntil}
            currency={createCurrency}
            onCurrencyChange={setCreateCurrency}
            lines={createLines}
            onLineChange={handleCreateLineChange}
            onAddLine={handleAddCreateLine}
            onRemoveLine={handleRemoveCreateLine}
            catalogItems={catalogItems}
            selectedCatalogItemId={catalogItemId}
            onCatalogSelection={handleCatalogSelection}
            notes={createNotes}
            onNotesChange={setCreateNotes}
            terms={createTerms}
            onTermsChange={setCreateTerms}
            totals={createTotals}
            computeLineTotals={computeLinePreviewTotals}
            documentTemplateId={createDocumentTemplate}
            onDocumentTemplateChange={setCreateDocumentTemplate}
            documentPrimaryColor={documentPrimaryColor}
            documentAccentColor={documentAccentColor}
            options={{
              showDeliveryAddress,
              showClientSiret,
              showClientVat,
              showBankInfo,
              showPaymentConditions,
              showDocumentTitle,
              showFreeField,
              showGlobalDiscount,
            }}
            onOptionsChange={(patch) => {
              if (patch.showDeliveryAddress !== undefined) {
                setShowDeliveryAddress(patch.showDeliveryAddress);
              }
              if (patch.showClientSiret !== undefined) {
                setShowClientSiret(patch.showClientSiret);
              }
              if (patch.showClientVat !== undefined) {
                setShowClientVat(patch.showClientVat);
              }
              if (patch.showBankInfo !== undefined) {
                setShowBankInfo(patch.showBankInfo);
              }
              if (patch.showPaymentConditions !== undefined) {
                setShowPaymentConditions(patch.showPaymentConditions);
              }
              if (patch.showDocumentTitle !== undefined) {
                setShowDocumentTitle(patch.showDocumentTitle);
              }
              if (patch.showFreeField !== undefined) {
                setShowFreeField(patch.showFreeField);
              }
              if (patch.showGlobalDiscount !== undefined) {
                setShowGlobalDiscount(patch.showGlobalDiscount);
              }
            }}
            creationMode={quoteCreationMode}
            onCreationModeChange={setQuoteCreationMode}
            language={createLanguage}
            onLanguageChange={setCreateLanguage}
            isSubmitting={isCreating}
            canSubmit={canCreateQuote}
            submitLabel="Créer le devis brouillon"
            onSubmit={handleCreateQuote}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Devis</CardTitle>
          <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des devis...
            </div>
          ) : quotes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun devis pour le moment.
            </p>
          ) : viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Émis le</TableHead>
                  <TableHead>Valide jusqu'au</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.number ?? "Brouillon"}
                    </TableCell>
                    <TableCell>{quote.client.displayName}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[quote.status]}>
                        {quoteStatusLabel[quote.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(quote.issueDate)}</TableCell>
                    <TableCell>{formatDate(quote.validUntil)}</TableCell>
                    <TableCell>{formatCents(quote.totalCents)}</TableCell>
                    <TableCell>{renderQuoteActions(quote)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quotes.map((quote) => (
                <Card key={quote.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {quote.number ?? "Brouillon"}
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">
                          {quote.client.displayName}
                        </p>
                      </div>
                      <Badge variant={statusVariant[quote.status]}>
                        {quoteStatusLabel[quote.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Émis le</span>
                      <span>{formatDate(quote.issueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Valide jusqu'au
                      </span>
                      <span>{formatDate(quote.validUntil)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">
                        {formatCents(quote.totalCents)}
                      </span>
                    </div>
                    <div className="pt-2">
                      {renderQuoteActions(quote, true)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <FreelanceSideSheetContent>
          <FreelanceSideSheetHeader>
            <SheetTitle>Éditer le devis brouillon</SheetTitle>
            <SheetDescription>
              Modifie les lignes, les dates et les mentions avant envoi.
            </SheetDescription>
          </FreelanceSideSheetHeader>

          <FreelanceSideSheetBody className="grid gap-4 xl:grid-cols-2">
            <Select value={editClientId} onValueChange={setEditClientId}>
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

            <Input
              placeholder="Devise"
              maxLength={3}
              value={editCurrency}
              onChange={(event) => {
                setEditCurrency(event.target.value.toUpperCase());
              }}
            />

            <Input
              type="date"
              value={editIssueDate}
              onChange={(event) => {
                setEditIssueDate(event.target.value);
              }}
            />

            <Input
              type="date"
              value={editValidUntil}
              onChange={(event) => {
                setEditValidUntil(event.target.value);
              }}
            />

            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium">Lignes du devis</p>
              <div className="space-y-2">
                {editLines.map((line, index) => (
                  <div
                    key={line.key}
                    className="grid gap-2 rounded-md border p-3 md:grid-cols-[1.6fr_0.7fr_1fr_0.9fr_0.8fr_0.8fr_auto]"
                  >
                    <Input
                      placeholder={`Description ligne ${index + 1}`}
                      value={line.description}
                      onChange={(event) => {
                        handleUpdateLine(
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
                      placeholder="Qté"
                      value={line.quantity}
                      onChange={(event) => {
                        handleUpdateLine(
                          line.key,
                          "quantity",
                          event.target.value,
                        );
                      }}
                    />
                    <Select
                      value={line.unit}
                      onValueChange={(value) => {
                        handleUpdateLine(line.key, "unit", value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {billingStudioUnitOptions.map((unit) => (
                          <SelectItem
                            key={`edit-quote-${unit.value}`}
                            value={unit.value}
                          >
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="PU (€)"
                      value={line.unitPrice}
                      onChange={(event) => {
                        handleUpdateLine(
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
                      placeholder="TVA %"
                      value={line.vatRate}
                      onChange={(event) => {
                        handleUpdateLine(
                          line.key,
                          "vatRate",
                          event.target.value,
                        );
                      }}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Remise %"
                      value={line.discountPercent}
                      onChange={(event) => {
                        handleUpdateLine(
                          line.key,
                          "discountPercent",
                          event.target.value,
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        handleRemoveLine(line.key);
                      }}
                      disabled={editLines.length <= 1}
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={handleAddLine}>
                <Plus className="size-4" />
                Ajouter une ligne
              </Button>
            </div>

            <Textarea
              rows={5}
              placeholder="Notes (optionnel)"
              value={editNotes}
              onChange={(event) => {
                setEditNotes(event.target.value);
              }}
            />
            <Textarea
              rows={5}
              placeholder="Conditions (optionnel)"
              value={editTerms}
              onChange={(event) => {
                setEditTerms(event.target.value);
              }}
            />
          </FreelanceSideSheetBody>

          <FreelanceSideSheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={!canSaveEdit || isSavingEdit}
            >
              {isSavingEdit ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Enregistrer
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>

      <AlertDialog
        open={pendingQuoteConfirmation !== null}
        onOpenChange={(open) => {
          if (!open && actionMenuQuoteId === null) {
            setPendingQuoteConfirmation(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingQuoteConfirmation?.type === "cancel"
                ? "Annuler le devis"
                : "Supprimer le devis"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingQuoteConfirmation?.type === "cancel"
                ? "Le devis sera conservé dans l’historique avec le statut annulé."
                : "Le devis sera retiré de ton espace. L’opération reste historisée dans les logs."}{" "}
              {pendingQuoteConfirmation
                ? `Devis cible: ${pendingQuoteConfirmation.number ?? pendingQuoteConfirmation.quoteId}.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionMenuQuoteId !== null}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionMenuQuoteId !== null}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmPendingQuoteAction();
              }}
            >
              {actionMenuQuoteId !== null ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
