import type {
  BillingAuditEventType,
  BillingEntityType,
  BillingInvoiceStatus,
  BillingQuoteStatus,
} from "@/generated/prisma";

export const formatCents = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value / 100);
};

export const formatDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const quoteStatusLabel: Record<BillingQuoteStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

export const invoiceStatusLabel: Record<BillingInvoiceStatus, string> = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  PARTIALLY_PAID: "Partiellement payée",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
};

export const entityLabel: Record<BillingEntityType, string> = {
  PROFILE: "Profil",
  CLIENT: "Client",
  QUOTE: "Devis",
  INVOICE: "Facture",
  CREDIT_NOTE: "Avoir",
  PAYMENT: "Paiement",
  DECLARATION_PERIOD: "Déclaration",
  EXPENSE_INVOICE: "Dépense facture",
  EXPENSE_NOTE: "Note de frais",
  EXPENSE_TRIP: "Trajet",
  RECURRING_INVOICE: "Facture récurrente",
};

export const auditEventLabel: Record<BillingAuditEventType, string> = {
  CREATED: "Création",
  UPDATED: "Mise à jour",
  DELETED: "Suppression",
  STATUS_CHANGED: "Changement statut",
  NUMBER_ASSIGNED: "Numérotation",
  CONVERTED_TO_INVOICE: "Conversion",
  PAYMENT_RECORDED: "Paiement",
};

export const buildFreelanceDocumentUrl = (params: {
  type: "quote" | "invoice" | "creditNote";
  id: string;
  mode?: "preview" | "pdf";
  download?: boolean;
}) => {
  const searchParams = new URLSearchParams({
    type: params.type,
    id: params.id,
    mode: params.mode ?? "pdf",
    download: String(params.download ?? false),
  });

  return `/api/freelance/render?${searchParams.toString()}`;
};
