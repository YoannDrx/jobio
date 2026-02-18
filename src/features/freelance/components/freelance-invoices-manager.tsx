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
import { Checkbox } from "@/components/ui/checkbox";
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
import { BillingInvoiceStatus, BillingPaymentMethod } from "@/generated/prisma";
import { getCatalogItemsAction } from "@/features/freelance/billing-catalog.action";
import {
  getBillingClientsAction,
  getBillingProfileAction,
} from "@/features/freelance/billing-clients.action";
import {
  bulkInvoiceAction,
  cancelInvoiceAction,
  createInvoiceDraftAction,
  deleteInvoiceAction,
  duplicateInvoiceAction,
  getInvoicesAction,
  issueInvoiceAction,
  recordInvoicePaymentAction,
  updateInvoiceDraftAction,
} from "@/features/freelance/billing-documents.action";
import {
  buildFreelanceDocumentUrl,
  formatCents,
  formatDate,
  invoiceStatusLabel,
} from "@/features/freelance/billing-presenter";
import {
  BILLING_DOCUMENT_TEMPLATES,
  DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID,
  resolveBillingDocumentTemplate,
  type BillingDocumentTemplateId,
} from "@/features/freelance/billing-document-templates";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import { FreelanceInvoicesImportSheet } from "@/features/freelance/components/freelance-invoices-import-sheet";
import {
  BillingDocumentStudio,
  billingStudioUnitOptions,
  parseBillingStudioDescriptionUnit,
  resolveBillingStudioUnitLabel,
} from "@/features/freelance/components/billing-document-studio";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  Copy,
  Ellipsis,
  Eye,
  FileDown,
  HandCoins,
  Loader2,
  Mail,
  PencilLine,
  Plus,
  Send,
  Trash2,
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

type CatalogOption = {
  id: string;
  name: string;
  unitPriceCents: number;
  vatRatePercent: number;
};

type InvoiceLineRow = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPercent: number;
  vatRatePercent: number;
};

type InvoiceRow = {
  id: string;
  number: string | null;
  status: BillingInvoiceStatus;
  issueDate: Date | string;
  dueDate: Date | string | null;
  currency: string;
  documentTemplate: string | null;
  notes: string | null;
  terms: string | null;
  subtotalCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  client: {
    id: string;
    displayName: string;
  };
  lines: InvoiceLineRow[];
};

type BillingProfilePreview = {
  legalName: string;
  tradeName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  email: string | null;
  phone: string | null;
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

type InvoiceLineForm = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
};

const statusVariant: Record<BillingInvoiceStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  ISSUED: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
};

const paymentMethodLabel: Record<BillingPaymentMethod, string> = {
  BANK_TRANSFER: "Virement",
  CARD: "Carte",
  CASH: "Espèces",
  CHECK: "Chèque",
  DIRECT_DEBIT: "Prélèvement",
  OTHER: "Autre",
};

const createLineKey = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultLine = (): InvoiceLineForm => ({
  key: createLineKey(),
  description: "",
  quantity: "1",
  unit: "unite",
  unitPrice: "0",
  vatRate: "0",
  discountPercent: "0",
});

const mapInvoiceLineToForm = (line: InvoiceLineRow): InvoiceLineForm => {
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

const parseLine = (line: InvoiceLineForm) => {
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

const computeLinePreviewTotals = (line: InvoiceLineForm) => {
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

export function FreelanceInvoicesManager() {
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [billingProfile, setBillingProfile] =
    useState<BillingProfilePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(
    null,
  );
  const [actionMenuInvoiceId, setActionMenuInvoiceId] = useState<string | null>(
    null,
  );
  const [pendingInvoiceConfirmation, setPendingInvoiceConfirmation] = useState<{
    type: "cancel" | "delete";
    invoiceId: string;
    number: string | null;
  } | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [pendingBulkInvoiceOperation, setPendingBulkInvoiceOperation] =
    useState<"ISSUE" | "CANCEL" | "DELETE" | null>(null);
  const [bulkInvoiceReason, setBulkInvoiceReason] = useState("");
  const [_isBulkInvoiceProcessing, setIsBulkInvoiceProcessing] =
    useState(false);

  const [createClientId, setCreateClientId] = useState("");
  const [createIssueDate, setCreateIssueDate] = useState(
    toDateInputValue(new Date()),
  );
  const [createDueDate, setCreateDueDate] = useState("");
  const [createCurrency, setCreateCurrency] = useState("EUR");
  const [createDocumentTemplate, setCreateDocumentTemplate] =
    useState<BillingDocumentTemplateId>(DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID);
  const [createNotes, setCreateNotes] = useState(
    "Pénalité de retard: 3x taux légal + indemnité forfaitaire de 40€.",
  );
  const [createTerms, setCreateTerms] = useState("");
  const [createCatalogItemId, setCreateCatalogItemId] =
    useState<string>("custom");
  const [createLines, setCreateLines] = useState<InvoiceLineForm[]>([
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
  const [invoiceCreationMode, setInvoiceCreationMode] = useState<
    "quick" | "full"
  >("quick");
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
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editClientId, setEditClientId] = useState("");
  const [editIssueDate, setEditIssueDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCurrency, setEditCurrency] = useState("EUR");
  const [editDocumentTemplate, setEditDocumentTemplate] =
    useState<BillingDocumentTemplateId>(DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID);
  const [editNotes, setEditNotes] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [editLines, setEditLines] = useState<InvoiceLineForm[]>([
    createDefaultLine(),
  ]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>(
    BillingPaymentMethod.BANK_TRANSFER,
  );
  const [paymentDate, setPaymentDate] = useState(toDateInputValue(new Date()));
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [clientsResult, invoicesResult, catalogResult, profileResult] =
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
            getInvoicesAction({
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
      setInvoices(invoicesResult.invoices as InvoiceRow[]);
      setCatalogItems(catalogResult.items as CatalogOption[]);
      const nextProfile =
        (profileResult as BillingProfilePreview | null) ?? null;
      setBillingProfile(nextProfile);
      setCreateDocumentTemplate(
        resolveBillingDocumentTemplate(nextProfile?.documentTemplate).id,
      );

      if (nextClients.length > 0) {
        setCreateClientId((previous) => previous || (nextClients[0]?.id ?? ""));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les factures",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      setCreateClientId(match.id);
    }
  }, [searchParams, clients]);

  useEffect(() => {
    if (searchParams.get("create") !== "1") {
      return;
    }

    const target = document.getElementById("invoice-create-card");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  useEffect(() => {
    if (!createIssueDate || createDueDate) {
      return;
    }

    const issueDate = new Date(createIssueDate);
    if (Number.isNaN(issueDate.getTime())) {
      return;
    }

    issueDate.setDate(
      issueDate.getDate() + (billingProfile?.paymentTermsInDays ?? 30),
    );
    setCreateDueDate(toDateInputValue(issueDate));
  }, [createIssueDate, createDueDate, billingProfile?.paymentTermsInDays]);

  useEffect(() => {
    setSelectedInvoiceIds((previous) =>
      previous.filter((invoiceId) =>
        invoices.some((invoice) => invoice.id === invoiceId),
      ),
    );
  }, [invoices]);

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
    () => clients.find((client) => client.id === createClientId) ?? null,
    [clients, createClientId],
  );

  const canCreateInvoice = useMemo(() => {
    if (
      !createClientId ||
      !createIssueDate ||
      createCurrency.trim().length !== 3
    ) {
      return false;
    }

    return (
      createLines.length > 0 && parsedCreateLines.every((line) => line !== null)
    );
  }, [
    createClientId,
    createIssueDate,
    createCurrency,
    createLines.length,
    parsedCreateLines,
  ]);

  const canSaveEdit = useMemo(() => {
    if (
      !editingInvoiceId ||
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
  }, [editingInvoiceId, editClientId, editIssueDate, editCurrency, editLines]);

  const canSavePayment = useMemo(() => {
    if (!paymentInvoice || !paymentDate) {
      return false;
    }

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    const amountCents = Math.round(amount * 100);
    return amountCents <= paymentInvoice.balanceCents;
  }, [paymentAmount, paymentDate, paymentInvoice]);

  const activeTemplate = resolveBillingDocumentTemplate(createDocumentTemplate);
  const documentPrimaryColor =
    billingProfile?.documentPrimaryColor ?? activeTemplate.primaryColor;
  const documentAccentColor =
    billingProfile?.documentAccentColor ?? activeTemplate.accentColor;

  const handleCatalogSelection = (value: string) => {
    setCreateCatalogItemId(value);

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
    field: keyof Omit<InvoiceLineForm, "key">,
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

  const handleCreateInvoice = async () => {
    if (!canCreateInvoice) {
      toast.error("Complète les champs de la facture avant de créer");
      return;
    }

    const lines = parsedCreateLines.filter(
      (line): line is NonNullable<typeof line> => line !== null,
    );

    setIsCreating(true);
    try {
      await resolveActionResult(
        createInvoiceDraftAction({
          clientId: createClientId,
          issueDate: new Date(createIssueDate),
          dueDate: createDueDate ? new Date(createDueDate) : undefined,
          currency: createCurrency.toUpperCase(),
          documentTemplate: createDocumentTemplate,
          notes: createNotes,
          terms: createTerms,
          lines,
        }),
      );

      toast.success("Facture brouillon créée");
      setCreateCatalogItemId("custom");
      setCreateCurrency("EUR");
      setCreateDocumentTemplate(
        resolveBillingDocumentTemplate(billingProfile?.documentTemplate).id,
      );
      setCreateIssueDate(toDateInputValue(new Date()));
      setCreateDueDate("");
      setCreateNotes(
        "Pénalité de retard: 3x taux légal + indemnité forfaitaire de 40€.",
      );
      setCreateTerms("");
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

  const handleIssueInvoice = async (invoiceId: string) => {
    setProcessingInvoiceId(invoiceId);
    try {
      await resolveActionResult(issueInvoiceAction({ invoiceId }));
      toast.success("Facture émise");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Émission impossible",
      );
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handleDuplicateInvoice = async (invoiceId: string) => {
    setActionMenuInvoiceId(invoiceId);
    try {
      await resolveActionResult(duplicateInvoiceAction({ invoiceId }));
      toast.success("Facture dupliquée en brouillon");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Duplication impossible",
      );
    } finally {
      setActionMenuInvoiceId(null);
    }
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    setActionMenuInvoiceId(invoiceId);
    try {
      await resolveActionResult(cancelInvoiceAction({ invoiceId }));
      toast.success("Facture annulée");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Annulation impossible",
      );
    } finally {
      setActionMenuInvoiceId(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    setActionMenuInvoiceId(invoiceId);
    try {
      await resolveActionResult(deleteInvoiceAction({ invoiceId }));
      toast.success("Facture supprimée");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible",
      );
    } finally {
      setActionMenuInvoiceId(null);
    }
  };

  const handleConfirmPendingInvoiceAction = async () => {
    if (!pendingInvoiceConfirmation) {
      return;
    }

    if (pendingInvoiceConfirmation.type === "cancel") {
      await handleCancelInvoice(pendingInvoiceConfirmation.invoiceId);
    } else {
      await handleDeleteInvoice(pendingInvoiceConfirmation.invoiceId);
    }

    setPendingInvoiceConfirmation(null);
  };

  const areAllInvoicesSelected =
    invoices.length > 0 && selectedInvoiceIds.length === invoices.length;

  const handleToggleAllInvoices = (checked: boolean) => {
    if (!checked) {
      setSelectedInvoiceIds([]);
      return;
    }

    setSelectedInvoiceIds(invoices.map((invoice) => invoice.id));
  };

  const handleToggleInvoiceSelection = (
    invoiceId: string,
    checked: boolean,
  ) => {
    setSelectedInvoiceIds((previous) => {
      if (checked) {
        if (previous.includes(invoiceId)) {
          return previous;
        }
        return [...previous, invoiceId];
      }

      return previous.filter((id) => id !== invoiceId);
    });
  };

  const _handleRunBulkInvoiceOperation = async () => {
    if (!pendingBulkInvoiceOperation) {
      return;
    }

    const reason = bulkInvoiceReason.trim();
    if (reason.length < 3) {
      toast.error("Ajoute un contexte d’audit (au moins 3 caractères).");
      return;
    }

    if (selectedInvoiceIds.length === 0) {
      toast.error("Sélectionne au moins une facture.");
      return;
    }

    setIsBulkInvoiceProcessing(true);
    try {
      const result = await resolveActionResult(
        bulkInvoiceAction({
          operation: pendingBulkInvoiceOperation,
          ids: selectedInvoiceIds,
          reason,
        }),
      );
      const processedCount =
        (result as { processedCount?: number }).processedCount ?? 0;
      const skippedCount =
        (result as { skippedCount?: number }).skippedCount ?? 0;
      const failedCount = (result as { failedCount?: number }).failedCount ?? 0;
      toast.success(
        `Bulk factures terminé: ${processedCount} traité(s), ${skippedCount} ignoré(s), ${failedCount} en erreur.`,
      );
      setPendingBulkInvoiceOperation(null);
      setBulkInvoiceReason("");
      setSelectedInvoiceIds([]);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Opération bulk impossible",
      );
    } finally {
      setIsBulkInvoiceProcessing(false);
    }
  };

  const handleSendReminder = async (invoice: InvoiceRow) => {
    const daysOverdue = invoice.dueDate
      ? Math.floor(
          (Date.now() - new Date(invoice.dueDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    const message = `Bonjour,\n\nJe me permets de vous relancer concernant la facture ${invoice.number ?? ""} d'un montant de ${formatCents(invoice.balanceCents)} émise le ${formatDate(invoice.issueDate)}, dont le règlement était attendu le ${formatDate(invoice.dueDate)}.\n\nElle est actuellement en retard de ${daysOverdue} jour(s).\n\nMerci de bien vouloir procéder au règlement dans les meilleurs délais.\n\nCordialement`;

    await navigator.clipboard.writeText(message);
    toast.success("Message de relance copié dans le presse-papier !");
    setActionMenuInvoiceId(null);
  };

  const handleOpenPaymentDialog = (invoice: InvoiceRow) => {
    if (invoice.balanceCents <= 0) {
      return;
    }

    setPaymentInvoice(invoice);
    setPaymentAmount((invoice.balanceCents / 100).toFixed(2));
    setPaymentMethod(BillingPaymentMethod.BANK_TRANSFER);
    setPaymentDate(toDateInputValue(new Date()));
    setPaymentReference("");
    setPaymentNote("Encaissement depuis Jobio Freelance");
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentInvoice || !canSavePayment) {
      toast.error("Renseigne un paiement valide");
      return;
    }

    const amountCents = Math.round(Number(paymentAmount) * 100);
    setIsSavingPayment(true);
    try {
      await resolveActionResult(
        recordInvoicePaymentAction({
          invoiceId: paymentInvoice.id,
          amountCents,
          paidAt: new Date(paymentDate),
          method: paymentMethod,
          reference: paymentReference,
          note: paymentNote,
        }),
      );

      toast.success("Paiement enregistré");
      setIsPaymentOpen(false);
      setPaymentInvoice(null);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Paiement impossible",
      );
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleOpenEdit = (invoice: InvoiceRow) => {
    setEditingInvoiceId(invoice.id);
    setEditClientId(invoice.client.id);
    setEditIssueDate(toDateInputValue(invoice.issueDate));
    setEditDueDate(toDateInputValue(invoice.dueDate));
    setEditCurrency(invoice.currency);
    setEditDocumentTemplate(
      resolveBillingDocumentTemplate(invoice.documentTemplate).id,
    );
    setEditNotes(invoice.notes ?? "");
    setEditTerms(invoice.terms ?? "");
    setEditLines(
      invoice.lines.length > 0
        ? invoice.lines.map(mapInvoiceLineToForm)
        : [createDefaultLine()],
    );
    setIsEditOpen(true);
  };

  const handleUpdateLine = (
    key: string,
    field: keyof Omit<InvoiceLineForm, "key">,
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
    if (!editingInvoiceId || !canSaveEdit) {
      toast.error("Vérifie les champs de la facture avant enregistrement");
      return;
    }

    const lines = editLines.map(parseLine);
    if (lines.some((line) => line === null)) {
      toast.error("Chaque ligne de facture doit être valide");
      return;
    }

    setIsSavingEdit(true);
    try {
      await resolveActionResult(
        updateInvoiceDraftAction({
          invoiceId: editingInvoiceId,
          clientId: editClientId,
          issueDate: new Date(editIssueDate),
          dueDate: editDueDate ? new Date(editDueDate) : null,
          currency: editCurrency.toUpperCase(),
          documentTemplate: editDocumentTemplate,
          notes: editNotes,
          terms: editTerms,
          lines: lines.filter(
            (line): line is NonNullable<typeof line> => line !== null,
          ),
        }),
      );

      toast.success("Facture mise à jour");
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

  const renderInvoiceActions = (invoice: InvoiceRow, compact = false) => {
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
                type: "invoice",
                id: invoice.id,
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
                type: "invoice",
                id: invoice.id,
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
        <Button
          variant="outline"
          size="icon"
          title="Éditer"
          aria-label="Éditer"
          disabled={processingInvoiceId === invoice.id}
          onClick={() => {
            handleOpenEdit(invoice);
          }}
        >
          <PencilLine className="size-4" />
        </Button>
        {invoice.status === BillingInvoiceStatus.DRAFT ? (
          <Button
            variant="outline"
            size="icon"
            title="Émettre"
            aria-label="Émettre"
            disabled={processingInvoiceId === invoice.id}
            onClick={() => {
              void handleIssueInvoice(invoice.id);
            }}
          >
            <Send className="size-4" />
          </Button>
        ) : null}
        {invoice.balanceCents > 0 ? (
          <Button
            variant="outline"
            size="icon"
            title="Enregistrer un paiement"
            aria-label="Enregistrer un paiement"
            disabled={processingInvoiceId === invoice.id}
            onClick={() => {
              handleOpenPaymentDialog(invoice);
            }}
          >
            {processingInvoiceId === invoice.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <HandCoins className="size-4" />
            )}
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={actionMenuInvoiceId === invoice.id}
              title="Plus d'actions"
            >
              {actionMenuInvoiceId === invoice.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ellipsis className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                void handleDuplicateInvoice(invoice.id);
              }}
            >
              <Copy className="size-4" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setPendingInvoiceConfirmation({
                  type: "cancel",
                  invoiceId: invoice.id,
                  number: invoice.number,
                });
              }}
              disabled={invoice.status === BillingInvoiceStatus.CANCELLED}
            >
              <XCircle className="size-4" />
              Annuler
            </DropdownMenuItem>
            {invoice.status === BillingInvoiceStatus.OVERDUE && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void handleSendReminder(invoice);
                  }}
                >
                  <Mail className="mr-2 size-4" />
                  Envoyer une relance
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setPendingInvoiceConfirmation({
                  type: "delete",
                  invoiceId: invoice.id,
                  number: invoice.number,
                });
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div data-full-width className="flex flex-col gap-6">
      <BillingDocumentStudio
        id="invoice-create-card"
        title="Nouvelle facture"
        documentLabel="Facture"
        secondaryDateLabel="Échéance"
        issuer={billingProfile}
        clients={clients}
        selectedClientId={createClientId}
        onSelectedClientIdChange={setCreateClientId}
        selectedClient={selectedCreateClient}
        issueDate={createIssueDate}
        onIssueDateChange={setCreateIssueDate}
        secondaryDate={createDueDate}
        onSecondaryDateChange={setCreateDueDate}
        currency={createCurrency}
        onCurrencyChange={setCreateCurrency}
        lines={createLines}
        onLineChange={handleCreateLineChange}
        onAddLine={handleAddCreateLine}
        onRemoveLine={handleRemoveCreateLine}
        catalogItems={catalogItems}
        selectedCatalogItemId={createCatalogItemId}
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
        creationMode={invoiceCreationMode}
        onCreationModeChange={setInvoiceCreationMode}
        language={createLanguage}
        onLanguageChange={setCreateLanguage}
        isSubmitting={isCreating}
        canSubmit={canCreateInvoice}
        submitLabel="Créer la facture brouillon"
        onSubmit={handleCreateInvoice}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Factures</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
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
            <FreelanceInvoicesImportSheet
              onImported={async () => {
                await loadData();
              }}
            />
            {selectedInvoiceIds.length > 0 ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPendingBulkInvoiceOperation("ISSUE");
                    setBulkInvoiceReason("Émission groupée depuis le tableau");
                  }}
                >
                  Émettre ({selectedInvoiceIds.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPendingBulkInvoiceOperation("CANCEL");
                    setBulkInvoiceReason(
                      "Annulation groupée depuis le tableau",
                    );
                  }}
                >
                  Annuler ({selectedInvoiceIds.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setPendingBulkInvoiceOperation("DELETE");
                    setBulkInvoiceReason("Suppression groupée owner override");
                  }}
                >
                  Supprimer ({selectedInvoiceIds.length})
                </Button>
              </>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des factures...
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune facture pour le moment.
            </p>
          ) : viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={areAllInvoicesSelected}
                      onCheckedChange={(checked) => {
                        handleToggleAllInvoices(Boolean(checked));
                      }}
                      aria-label="Sélectionner toutes les factures"
                    />
                  </TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Émission</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Reste dû</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoiceIds.includes(invoice.id)}
                        onCheckedChange={(checked) => {
                          handleToggleInvoiceSelection(
                            invoice.id,
                            Boolean(checked),
                          );
                        }}
                        aria-label={`Sélectionner ${invoice.number ?? invoice.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.number ?? "Brouillon"}
                    </TableCell>
                    <TableCell>{invoice.client.displayName}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[invoice.status]}>
                        {invoiceStatusLabel[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatCents(invoice.subtotalCents)}</TableCell>
                    <TableCell>{formatCents(invoice.totalCents)}</TableCell>
                    <TableCell>{formatCents(invoice.paidCents)}</TableCell>
                    <TableCell>{formatCents(invoice.balanceCents)}</TableCell>
                    <TableCell>{renderInvoiceActions(invoice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {invoice.number ?? "Brouillon"}
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">
                          {invoice.client.displayName}
                        </p>
                      </div>
                      <Badge variant={statusVariant[invoice.status]}>
                        {invoiceStatusLabel[invoice.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Émission</span>
                      <span>{formatDate(invoice.issueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Échéance</span>
                      <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Montant TTC</span>
                      <span className="font-medium">
                        {formatCents(invoice.totalCents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Payé</span>
                      <span>{formatCents(invoice.paidCents)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reste dû</span>
                      <span>{formatCents(invoice.balanceCents)}</span>
                    </div>
                    <div className="pt-2">
                      {renderInvoiceActions(invoice, true)}
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
            <SheetTitle>Éditer la facture</SheetTitle>
            <SheetDescription>
              Ajuste les lignes, les dates et les mentions à tout moment.
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

            <Select
              value={editDocumentTemplate}
              onValueChange={(value) => {
                setEditDocumentTemplate(value as BillingDocumentTemplateId);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {BILLING_DOCUMENT_TEMPLATES.map((template) => (
                  <SelectItem
                    key={`edit-template-${template.id}`}
                    value={template.id}
                  >
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={editIssueDate}
              onChange={(event) => {
                setEditIssueDate(event.target.value);
              }}
            />

            <Input
              type="date"
              value={editDueDate}
              onChange={(event) => {
                setEditDueDate(event.target.value);
              }}
            />

            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium">Lignes de la facture</p>
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
                            key={`edit-${unit.value}`}
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

      <Sheet
        open={isPaymentOpen}
        onOpenChange={(open) => {
          setIsPaymentOpen(open);
          if (!open) {
            setPaymentInvoice(null);
          }
        }}
      >
        <FreelanceSideSheetContent>
          <FreelanceSideSheetHeader>
            <SheetTitle>Enregistrer un paiement</SheetTitle>
            <SheetDescription>
              {paymentInvoice
                ? `Facture ${paymentInvoice.number ?? paymentInvoice.id} - solde ${formatCents(paymentInvoice.balanceCents)}`
                : "Saisis les détails du paiement."}
            </SheetDescription>
          </FreelanceSideSheetHeader>

          <FreelanceSideSheetBody className="grid gap-3">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Montant encaissé (€)"
              value={paymentAmount}
              onChange={(event) => {
                setPaymentAmount(event.target.value);
              }}
            />

            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value as BillingPaymentMethod);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Mode de paiement" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(paymentMethodLabel) as BillingPaymentMethod[]
                ).map((method) => (
                  <SelectItem key={method} value={method}>
                    {paymentMethodLabel[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={paymentDate}
              onChange={(event) => {
                setPaymentDate(event.target.value);
              }}
            />

            <Input
              placeholder="Référence (optionnel)"
              value={paymentReference}
              onChange={(event) => {
                setPaymentReference(event.target.value);
              }}
            />

            <Textarea
              rows={4}
              placeholder="Note (optionnel)"
              value={paymentNote}
              onChange={(event) => {
                setPaymentNote(event.target.value);
              }}
            />
          </FreelanceSideSheetBody>

          <FreelanceSideSheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsPaymentOpen(false);
                setPaymentInvoice(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleRecordPayment();
              }}
              disabled={!canSavePayment || isSavingPayment}
            >
              {isSavingPayment ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Enregistrer le paiement
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>

      <AlertDialog
        open={pendingInvoiceConfirmation !== null}
        onOpenChange={(open) => {
          if (!open && actionMenuInvoiceId === null) {
            setPendingInvoiceConfirmation(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingInvoiceConfirmation?.type === "cancel"
                ? "Annuler la facture"
                : "Supprimer la facture"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingInvoiceConfirmation?.type === "cancel"
                ? "Cette action conserve l'historique et met la facture en statut annulé."
                : "Cette action retire la facture de ton espace. L'opération est historisée dans les logs."}{" "}
              {pendingInvoiceConfirmation
                ? `Facture cible: ${pendingInvoiceConfirmation.number ?? pendingInvoiceConfirmation.invoiceId}.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionMenuInvoiceId !== null}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionMenuInvoiceId !== null}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmPendingInvoiceAction();
              }}
            >
              {actionMenuInvoiceId !== null ? (
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
