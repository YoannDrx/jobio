/**
 * FEC (Fichier des Ecritures Comptables) export logic
 *
 * Implements French tax authority standard for accounting entries
 * Article A.47 A-1 du Livre des Procédures Fiscales
 *
 * @description
 * Generates tab-separated accounting journal entries in FEC format with:
 * - UTF-8 with BOM encoding
 * - Specific account plan (PCG simplified for freelance)
 * - Journal codes for sales (VE) and bank (BQ)
 * - Date format: YYYYMMDD
 * - Amount format: comma decimal separator (French: "1234,56")
 */

type FecEntry = {
  journalCode: string;
  journalLib: string;
  ecritureNum: string;
  ecritureDate: string;
  compteNum: string;
  compteLib: string;
  compAuxNum: string;
  compAuxLib: string;
  pieceRef: string;
  pieceDate: string;
  ecritureLib: string;
  debit: string;
  credit: string;
  ecritureLet: string;
  dateLet: string;
  validDate: string;
  montantdevise: string;
  idevise: string;
};

type FecInvoice = {
  number: string | null;
  issueDate: Date;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  client: { displayName: string };
};

type FecPayment = {
  id: string;
  paidAt: Date;
  amountCents: number;
  method: string;
  status: string;
  reference: string | null;
  client: { displayName: string };
  allocations: { invoice: { number: string | null } }[];
};

type FecCreditNote = {
  number: string | null;
  issueDate: Date;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  invoice: { number: string | null; client: { displayName: string } };
};

/**
 * Account plan (PCG simplified for freelance)
 */
const ACCOUNTS = {
  CLIENTS: "411000",
  CLIENTS_LIB: "Clients",
  BANQUE: "512000",
  BANQUE_LIB: "Banque",
  PRESTATIONS: "706000",
  PRESTATIONS_LIB: "Prestations de services",
  TVA_COLLECTEE: "445710",
  TVA_COLLECTEE_LIB: "TVA collectée",
  RABAIS: "709000",
  RABAIS_LIB: "Rabais, remises et ristournes",
} as const;

/**
 * Journal codes
 */
const JOURNALS = {
  VENTES: "VE",
  VENTES_LIB: "Ventes",
  BANQUE: "BQ",
  BANQUE_LIB: "Banque",
} as const;

/**
 * Format date to YYYYMMDD string
 */
export const formatFecDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

/**
 * Format cents to French decimal format (e.g., "1234,56")
 * @param cents Amount in cents
 * @returns Formatted string with comma as decimal separator
 */
export const formatFecAmount = (cents: number): string => {
  const euros = Math.abs(cents) / 100;
  const formatted = euros.toFixed(2).replace(".", ",");
  return formatted;
};

/**
 * Generate FEC entries from invoices, payments, and credit notes
 *
 * For each ISSUED or PAID invoice:
 * 1. Debit 411000 (Clients) for totalCents
 * 2. Credit 706000 (Prestations) for subtotalCents
 * 3. Credit 445710 (TVA collectée) for taxCents (if > 0)
 *
 * For each CONFIRMED payment:
 * 1. Debit 512000 (Banque) for amountCents
 * 2. Credit 411000 (Clients) for amountCents
 *
 * For each ISSUED credit note:
 * 1. Debit 709000 (Rabais) for subtotalCents
 * 2. Debit 445710 (TVA collectée) for taxCents (if > 0)
 * 3. Credit 411000 (Clients) for totalCents
 */
export const generateFecEntries = (data: {
  invoices: FecInvoice[];
  payments: FecPayment[];
  creditNotes: FecCreditNote[];
}): FecEntry[] => {
  const entries: FecEntry[] = [];
  let veCounter = 1;
  let bqCounter = 1;

  // Process invoices (ISSUED or PAID)
  for (const invoice of data.invoices) {
    if (
      invoice.status !== "ISSUED" &&
      invoice.status !== "PAID" &&
      invoice.status !== "PARTIALLY_PAID"
    ) {
      continue;
    }

    const invoiceNum = invoice.number ?? `INV-${invoice.issueDate.getTime()}`;
    const dateStr = formatFecDate(invoice.issueDate);
    const ecritureNum = `VE-${String(veCounter).padStart(3, "0")}`;
    veCounter++;

    // Debit 411000 (Clients)
    entries.push({
      journalCode: JOURNALS.VENTES,
      journalLib: JOURNALS.VENTES_LIB,
      ecritureNum,
      ecritureDate: dateStr,
      compteNum: ACCOUNTS.CLIENTS,
      compteLib: ACCOUNTS.CLIENTS_LIB,
      compAuxNum: "",
      compAuxLib: "",
      pieceRef: invoiceNum,
      pieceDate: dateStr,
      ecritureLib: `Facture ${invoiceNum}`,
      debit: formatFecAmount(invoice.totalCents),
      credit: "0,00",
      ecritureLet: "",
      dateLet: "",
      validDate: dateStr,
      montantdevise: formatFecAmount(invoice.totalCents),
      idevise: "EUR",
    });

    // Credit 706000 (Prestations)
    entries.push({
      journalCode: JOURNALS.VENTES,
      journalLib: JOURNALS.VENTES_LIB,
      ecritureNum,
      ecritureDate: dateStr,
      compteNum: ACCOUNTS.PRESTATIONS,
      compteLib: ACCOUNTS.PRESTATIONS_LIB,
      compAuxNum: "",
      compAuxLib: "",
      pieceRef: invoiceNum,
      pieceDate: dateStr,
      ecritureLib: `Facture ${invoiceNum}`,
      debit: "0,00",
      credit: formatFecAmount(invoice.subtotalCents),
      ecritureLet: "",
      dateLet: "",
      validDate: dateStr,
      montantdevise: formatFecAmount(invoice.subtotalCents),
      idevise: "EUR",
    });

    // Credit 445710 (TVA) if tax > 0
    if (invoice.taxCents > 0) {
      entries.push({
        journalCode: JOURNALS.VENTES,
        journalLib: JOURNALS.VENTES_LIB,
        ecritureNum,
        ecritureDate: dateStr,
        compteNum: ACCOUNTS.TVA_COLLECTEE,
        compteLib: ACCOUNTS.TVA_COLLECTEE_LIB,
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: invoiceNum,
        pieceDate: dateStr,
        ecritureLib: `Facture ${invoiceNum}`,
        debit: "0,00",
        credit: formatFecAmount(invoice.taxCents),
        ecritureLet: "",
        dateLet: "",
        validDate: dateStr,
        montantdevise: formatFecAmount(invoice.taxCents),
        idevise: "EUR",
      });
    }
  }

  // Process payments (CONFIRMED)
  for (const payment of data.payments) {
    if (payment.status !== "CONFIRMED") {
      continue;
    }

    const dateStr = formatFecDate(payment.paidAt);
    const paymentRef = payment.reference ?? `PAY-${payment.id.slice(0, 8)}`;
    const ecritureNum = `BQ-${String(bqCounter).padStart(3, "0")}`;
    bqCounter++;

    // Debit 512000 (Banque)
    entries.push({
      journalCode: JOURNALS.BANQUE,
      journalLib: JOURNALS.BANQUE_LIB,
      ecritureNum,
      ecritureDate: dateStr,
      compteNum: ACCOUNTS.BANQUE,
      compteLib: ACCOUNTS.BANQUE_LIB,
      compAuxNum: "",
      compAuxLib: "",
      pieceRef: paymentRef,
      pieceDate: dateStr,
      ecritureLib: `Paiement ${paymentRef}`,
      debit: formatFecAmount(payment.amountCents),
      credit: "0,00",
      ecritureLet: "",
      dateLet: "",
      validDate: dateStr,
      montantdevise: formatFecAmount(payment.amountCents),
      idevise: "EUR",
    });

    // Credit 411000 (Clients)
    entries.push({
      journalCode: JOURNALS.BANQUE,
      journalLib: JOURNALS.BANQUE_LIB,
      ecritureNum,
      ecritureDate: dateStr,
      compteNum: ACCOUNTS.CLIENTS,
      compteLib: ACCOUNTS.CLIENTS_LIB,
      compAuxNum: "",
      compAuxLib: "",
      pieceRef: paymentRef,
      pieceDate: dateStr,
      ecritureLib: `Paiement ${paymentRef}`,
      debit: "0,00",
      credit: formatFecAmount(payment.amountCents),
      ecritureLet: "",
      dateLet: "",
      validDate: dateStr,
      montantdevise: formatFecAmount(payment.amountCents),
      idevise: "EUR",
    });
  }

  // Process credit notes (ISSUED)
  for (const creditNote of data.creditNotes) {
    if (creditNote.status !== "ISSUED" && creditNote.status !== "APPLIED") {
      continue;
    }

    const creditNoteNum =
      creditNote.number ?? `CN-${creditNote.issueDate.getTime()}`;
    const dateStr = formatFecDate(creditNote.issueDate);
    const ecritureNum = `VE-${String(veCounter).padStart(3, "0")}`;
    veCounter++;

    // Debit 709000 (Rabais)
    entries.push({
      journalCode: JOURNALS.VENTES,
      journalLib: JOURNALS.VENTES_LIB,
      ecritureNum,
      ecritureDate: dateStr,
      compteNum: ACCOUNTS.RABAIS,
      compteLib: ACCOUNTS.RABAIS_LIB,
      compAuxNum: "",
      compAuxLib: "",
      pieceRef: creditNoteNum,
      pieceDate: dateStr,
      ecritureLib: `Avvoir ${creditNoteNum}`,
      debit: formatFecAmount(creditNote.subtotalCents),
      credit: "0,00",
      ecritureLet: "",
      dateLet: "",
      validDate: dateStr,
      montantdevise: formatFecAmount(creditNote.subtotalCents),
      idevise: "EUR",
    });

    // Debit 445710 (TVA) if tax > 0
    if (creditNote.taxCents > 0) {
      entries.push({
        journalCode: JOURNALS.VENTES,
        journalLib: JOURNALS.VENTES_LIB,
        ecritureNum,
        ecritureDate: dateStr,
        compteNum: ACCOUNTS.TVA_COLLECTEE,
        compteLib: ACCOUNTS.TVA_COLLECTEE_LIB,
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: creditNoteNum,
        pieceDate: dateStr,
        ecritureLib: `Avvoir ${creditNoteNum}`,
        debit: formatFecAmount(creditNote.taxCents),
        credit: "0,00",
        ecritureLet: "",
        dateLet: "",
        validDate: dateStr,
        montantdevise: formatFecAmount(creditNote.taxCents),
        idevise: "EUR",
      });
    }

    // Credit 411000 (Clients)
    entries.push({
      journalCode: JOURNALS.VENTES,
      journalLib: JOURNALS.VENTES_LIB,
      ecritureNum,
      ecritureDate: dateStr,
      compteNum: ACCOUNTS.CLIENTS,
      compteLib: ACCOUNTS.CLIENTS_LIB,
      compAuxNum: "",
      compAuxLib: "",
      pieceRef: creditNoteNum,
      pieceDate: dateStr,
      ecritureLib: `Avvoir ${creditNoteNum}`,
      debit: "0,00",
      credit: formatFecAmount(creditNote.totalCents),
      ecritureLet: "",
      dateLet: "",
      validDate: dateStr,
      montantdevise: formatFecAmount(creditNote.totalCents),
      idevise: "EUR",
    });
  }

  // Sort by date then by entry number
  entries.sort((a, b) => {
    const dateCompare = a.ecritureDate.localeCompare(b.ecritureDate);
    if (dateCompare !== 0) return dateCompare;
    return a.ecritureNum.localeCompare(b.ecritureNum);
  });

  return entries;
};

/**
 * Generate complete FEC file content with header and BOM
 *
 * Format: UTF-8 with BOM, tab-separated columns
 * Header: JournalCode\tJournalLib\tEcritureNum\t... (18 columns)
 */
export const generateFecFile = (entries: FecEntry[]): string => {
  const header = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
  ].join("\t");

  const lines = entries.map((entry) =>
    [
      entry.journalCode,
      entry.journalLib,
      entry.ecritureNum,
      entry.ecritureDate,
      entry.compteNum,
      entry.compteLib,
      entry.compAuxNum,
      entry.compAuxLib,
      entry.pieceRef,
      entry.pieceDate,
      entry.ecritureLib,
      entry.debit,
      entry.credit,
      entry.ecritureLet,
      entry.dateLet,
      entry.validDate,
      entry.montantdevise,
      entry.idevise,
    ].join("\t"),
  );

  const content = [header, ...lines].join("\n");

  // Add UTF-8 BOM
  const bom = "\uFEFF";
  return bom + content;
};

export type { FecEntry, FecInvoice, FecPayment, FecCreditNote };
