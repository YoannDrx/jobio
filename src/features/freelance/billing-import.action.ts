"use server";
/* eslint-disable no-await-in-loop */

import {
  BillingAuditEventType,
  BillingClientType,
  BillingEntityType,
  BillingInvoiceStatus,
  type Prisma,
} from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { extractText } from "unpdf";
import { z } from "zod";
import { createBillingAuditEvent } from "./billing-audit";

const IMPORT_CONFIDENCE_VALUES = ["HIGH", "MEDIUM", "LOW"] as const;

type ImportConfidence = (typeof IMPORT_CONFIDENCE_VALUES)[number];

const invoiceImportItemSchema = z.object({
  number: z.string().optional(),
  clientDisplayName: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string().nullable().optional(),
  currency: z.string().length(3).default("EUR"),
  status: z.nativeEnum(BillingInvoiceStatus).default(BillingInvoiceStatus.ISSUED),
  subtotalCents: z.number().int().min(0),
  taxCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  paidCents: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  lineDescription: z.string().optional(),
  source: z.enum(["CSV", "PDF"]).default("CSV"),
  confidence: z.enum(IMPORT_CONFIDENCE_VALUES).default("MEDIUM"),
  warnings: z.array(z.string()).default([]),
});

const clientImportItemSchema = z.object({
  type: z.nativeEnum(BillingClientType).default(BillingClientType.COMPANY),
  displayName: z.string().min(1),
  legalName: z.string().optional(),
  siret: z.string().optional(),
  vatNumber: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().default("Adresse non renseignée"),
  addressLine2: z.string().optional(),
  postalCode: z.string().default("00000"),
  city: z.string().default("Ville"),
  countryCode: z.string().length(2).default("FR"),
  notes: z.string().optional(),
  contacts: z
    .array(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        includeInEmail: z.boolean().default(false),
        isPrimary: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .default([]),
  source: z.enum(["CSV", "PDF"]).default("CSV"),
  confidence: z.enum(IMPORT_CONFIDENCE_VALUES).default("MEDIUM"),
  warnings: z.array(z.string()).default([]),
});

const parseImportFileSchema = z.object({
  formData: z.instanceof(FormData),
});

const commitInvoiceImportSchema = z.object({
  items: z.array(invoiceImportItemSchema).min(1),
});

const commitClientImportSchema = z.object({
  items: z.array(clientImportItemSchema).min(1),
});

const normalizeHeader = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
};

const normalizeText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const parseAmountToCents = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const compact = value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, "")
    .replace(/€/gi, "")
    .replace(/eur/gi, "");
  const keepNumeric = compact.replace(/[^0-9,.-]/g, "");

  if (keepNumeric.length === 0) {
    return null;
  }

  const lastComma = keepNumeric.lastIndexOf(",");
  const lastDot = keepNumeric.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex >= 0) {
    const integerPartRaw = keepNumeric.slice(0, decimalIndex).replace(/[.,]/g, "");
    const decimalPartRaw = keepNumeric.slice(decimalIndex + 1).replace(/[.,]/g, "");
    const integerPart = integerPartRaw.replace(/-/g, "") || "0";
    const sign = integerPartRaw.startsWith("-") ? -1 : 1;
    const decimals = `${decimalPartRaw}00`.slice(0, 2);
    const cents = Number(integerPart) * 100 + Number(decimals);
    return Number.isFinite(cents) ? sign * cents : null;
  }

  const integerOnly = keepNumeric.replace(/[.,-]/g, "");
  if (!integerOnly) {
    return null;
  }

  const parsed = Number(integerOnly) * 100;
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDateValue = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const date = new Date(`${normalized}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const frenchMatch = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (frenchMatch) {
    const day = Number(frenchMatch[1]);
    const month = Number(frenchMatch[2]);
    const yearValue = Number(frenchMatch[3]);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const isoLike = new Date(normalized);
  if (!Number.isNaN(isoLike.getTime())) {
    return isoLike;
  }

  return null;
};

const parseInvoiceStatus = (value?: string | null) => {
  const normalized = normalizeHeader(value ?? "");

  if (normalized.includes("brouillon") || normalized.includes("draft")) {
    return BillingInvoiceStatus.DRAFT;
  }

  if (
    normalized.includes("partiel") ||
    normalized.includes("partially") ||
    normalized.includes("partiellement")
  ) {
    return BillingInvoiceStatus.PARTIALLY_PAID;
  }

  if (
    normalized.includes("paye") ||
    normalized.includes("payee") ||
    normalized.includes("paid") ||
    normalized.includes("reglee")
  ) {
    return BillingInvoiceStatus.PAID;
  }

  if (normalized.includes("retard") || normalized.includes("overdue")) {
    return BillingInvoiceStatus.OVERDUE;
  }

  if (normalized.includes("annule") || normalized.includes("cancel")) {
    return BillingInvoiceStatus.CANCELLED;
  }

  if (
    normalized.includes("emise") ||
    normalized.includes("issued") ||
    normalized.includes("envoye")
  ) {
    return BillingInvoiceStatus.ISSUED;
  }

  return BillingInvoiceStatus.ISSUED;
};

const parseInvoiceCurrency = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "EUR";
  }

  const compact = normalized.toUpperCase().replace(/[^A-Z]/g, "");
  if (compact.length === 3) {
    return compact;
  }

  if (normalized.includes("€")) {
    return "EUR";
  }

  return "EUR";
};

const normalizeEmailKey = (value?: string | null) => {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
};

const parseBooleanLike = (value?: string | null) => {
  const normalized = normalizeHeader(value ?? "");
  if (!normalized) {
    return null;
  }

  if (
    normalized === "1" ||
    normalized === "oui" ||
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "x"
  ) {
    return true;
  }

  if (
    normalized === "0" ||
    normalized === "non" ||
    normalized === "no" ||
    normalized === "false"
  ) {
    return false;
  }

  return null;
};

type ImportClientContact = z.infer<typeof clientImportItemSchema>["contacts"][number];

const normalizeImportContacts = (
  contacts: Partial<ImportClientContact>[],
): ImportClientContact[] => {
  const normalized = contacts
    .map((contact) => {
      const firstName = normalizeText(contact.firstName);
      const lastName = normalizeText(contact.lastName);
      const role = normalizeText(contact.role);
      const email = normalizeText(contact.email);
      const phone = normalizeText(contact.phone);
      const notes = normalizeText(contact.notes);
      const hasData = [firstName, lastName, role, email, phone, notes].some(
        (value) => value !== null,
      );
      if (!hasData) {
        return null;
      }

      return {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        role: role ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        includeInEmail: Boolean(contact.includeInEmail) && Boolean(email),
        isPrimary: Boolean(contact.isPrimary),
        notes: notes ?? undefined,
      };
    })
    .filter((contact): contact is NonNullable<typeof contact> => contact !== null);

  if (normalized.length === 0) {
    return [];
  }

  const hasPrimary = normalized.some((contact) => contact.isPrimary);
  return normalized.map((contact, index) => ({
    ...contact,
    isPrimary: hasPrimary ? contact.isPrimary : index === 0,
    includeInEmail: contact.includeInEmail || (index === 0 && Boolean(contact.email)),
  }));
};

const buildHeaderResolver = (headers: string[]) => {
  const normalized = headers.map((header) => ({
    raw: header,
    normalized: normalizeHeader(header),
  }));

  return (aliases: string[]) => {
    const normalizedAliases = aliases.map((alias) => normalizeHeader(alias));
    for (const alias of normalizedAliases) {
      const exact = normalized.find((header) => header.normalized === alias);
      if (exact) {
        return exact.raw;
      }
    }

    for (const alias of normalizedAliases) {
      const contains = normalized.find(
        (header) =>
          header.normalized.includes(alias) || alias.includes(header.normalized),
      );
      if (contains) {
        return contains.raw;
      }
    }

    return null;
  };
};

const extractPdfText = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true,
  });

  const normalized = text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, " ")
    .trim();

  if (normalized.length < 20) {
    throw new ActionError("PDF vide ou illisible");
  }

  return normalized.slice(0, 50_000);
};

const detectImportFileType = (file: File) => {
  const filename = file.name.toLowerCase();
  if (file.type === "application/pdf" || filename.endsWith(".pdf")) {
    return "pdf" as const;
  }

  if (
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel" ||
    filename.endsWith(".csv")
  ) {
    return "csv" as const;
  }

  return null;
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const captureDateAfterLabels = (text: string, labels: string[]) => {
  const datePattern =
    "(\\d{1,2}[./-]\\d{1,2}[./-]\\d{2,4}|\\d{4}[./-]\\d{1,2}[./-]\\d{1,2})";

  for (const label of labels) {
    const regex = new RegExp(
      `${escapeRegex(label)}\\s*[:\\-]?\\s*${datePattern}`,
      "i",
    );
    const match = text.match(regex);
    if (match?.[1]) {
      return parseDateValue(match[1]);
    }
  }

  return null;
};

const captureAmountAfterLabels = (text: string, labels: string[]) => {
  for (const label of labels) {
    const regex = new RegExp(
      `${escapeRegex(label)}\\s*[:\\-]?\\s*([-0-9\\s.,]+)\\s*(?:€|EUR)?`,
      "i",
    );
    const match = text.match(regex);
    if (match?.[1]) {
      const amount = parseAmountToCents(match[1]);
      if (amount !== null) {
        return amount;
      }
    }
  }

  return null;
};

const captureTextAfterLabels = (text: string, labels: string[]) => {
  const stopWords =
    "(?:Date|Total|Montant|TVA|SIREN|SIRET|R[eè]glement|D[eé]signation|Adresse|$)";

  for (const label of labels) {
    const regex = new RegExp(
      `${escapeRegex(label)}\\s*[:\\-]?\\s*(.{2,100}?)(?=${stopWords})`,
      "i",
    );
    const match = text.match(regex);
    const captured = normalizeText(match?.[1]);
    if (captured) {
      return captured;
    }
  }

  return null;
};

const parseInvoicesFromCsv = (fileText: string) => {
  const parsed = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new ActionError("Le CSV ne peut pas être lu");
  }

  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) {
    throw new ActionError("Le CSV ne contient aucun en-tête");
  }

  const resolveHeader = buildHeaderResolver(headers);

  const mapping = {
    number: resolveHeader([
      "numero",
      "numéro",
      "n facture",
      "invoice number",
      "reference",
    ]),
    client: resolveHeader([
      "client",
      "nom du client",
      "entreprise",
      "societe",
      "company",
    ]),
    issueDate: resolveHeader([
      "date",
      "date emission",
      "date d emission",
      "issue date",
      "date facture",
    ]),
    dueDate: resolveHeader(["echeance", "date echeance", "due date"]),
    subtotal: resolveHeader([
      "montant ht",
      "total ht",
      "ht",
      "subtotal",
      "amount ht",
    ]),
    tax: resolveHeader(["tva", "tax", "montant tva", "tax amount"]),
    total: resolveHeader([
      "montant ttc",
      "total ttc",
      "ttc",
      "montant",
      "total",
      "amount",
    ]),
    paid: resolveHeader(["encaisse", "encaissé", "paid", "montant paye"]),
    status: resolveHeader(["statut", "status", "etat"]),
    currency: resolveHeader(["devise", "currency"]),
    notes: resolveHeader(["notes", "objet", "libelle", "description"]),
    lineDescription: resolveHeader([
      "designation",
      "prestation",
      "item",
      "article",
      "service",
    ]),
  } as const;

  const items: z.infer<typeof invoiceImportItemSchema>[] = [];

  for (const row of parsed.data) {
    const warnings: string[] = [];
    const read = (field: keyof typeof mapping) => {
      const header = mapping[field];
      if (!header) {
        return null;
      }
      return normalizeText(row[header]);
    };

    const clientDisplayName = read("client");
    const number = read("number") ?? undefined;
    const totalParsed = parseAmountToCents(read("total"));
    const subtotalParsed = parseAmountToCents(read("subtotal"));
    const taxParsed = parseAmountToCents(read("tax"));
    const issueDateParsed = parseDateValue(read("issueDate"));

    if (!clientDisplayName && !number && totalParsed === null && subtotalParsed === null) {
      continue;
    }

    if (!clientDisplayName) {
      warnings.push("Client non détecté, ligne ignorée");
      continue;
    }

    const totalCents = Math.max(
      0,
      totalParsed ?? (subtotalParsed ?? 0) + (taxParsed ?? 0),
    );
    const subtotalCents = Math.max(
      0,
      subtotalParsed ?? Math.max(0, totalCents - (taxParsed ?? 0)),
    );
    const taxCents = Math.max(0, taxParsed ?? Math.max(0, totalCents - subtotalCents));

    if (totalCents === 0) {
      warnings.push("Montant TTC non détecté, valeur 0 utilisée");
    }

    const statusFromFile = parseInvoiceStatus(read("status"));
    const paidFromFile = Math.max(0, parseAmountToCents(read("paid")) ?? 0);
    const paidCents = Math.min(
      totalCents,
      paidFromFile > 0
        ? paidFromFile
        : statusFromFile === BillingInvoiceStatus.PAID
          ? totalCents
          : 0,
    );

    const issueDate = issueDateParsed ?? new Date();
    if (!issueDateParsed) {
      warnings.push("Date d'émission invalide, date du jour appliquée");
    }

    const dueDate = parseDateValue(read("dueDate"));

    const confidence: ImportConfidence =
      number && totalCents > 0 ? "HIGH" : totalCents > 0 ? "MEDIUM" : "LOW";

    items.push({
      number,
      clientDisplayName,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : null,
      currency: parseInvoiceCurrency(read("currency")),
      status: statusFromFile,
      subtotalCents,
      taxCents,
      totalCents,
      paidCents,
      notes: read("notes") ?? undefined,
      lineDescription:
        read("lineDescription") ?? read("notes") ?? "Import historique",
      source: "CSV",
      confidence,
      warnings,
    });
  }

  return {
    items,
    mappedColumns: Object.entries(mapping)
      .filter(([, header]) => Boolean(header))
      .map(([key, header]) => `${key}: ${header}`)
      .slice(0, 12),
  };
};

const parseInvoiceFromPdf = async (file: File) => {
  const text = await extractPdfText(file);
  const warnings: string[] = [];

  const number =
    captureTextAfterLabels(text, ["Facture n°", "Facture numero", "Invoice #"]) ??
    text.match(/(?:Facture|Invoice)\s*(?:n[°o]|num[eé]ro|#)?\s*([A-Z0-9/_-]{2,40})/i)?.[1] ??
    undefined;

  const clientDisplayName =
    captureTextAfterLabels(text, ["Nom du client", "Client"]) ??
    "Client importé PDF";

  const issueDate =
    captureDateAfterLabels(text, ["Date d'émission", "Date emission", "Date"]) ??
    new Date();
  if (!captureDateAfterLabels(text, ["Date d'émission", "Date emission", "Date"])) {
    warnings.push("Date d'émission non détectée, date du jour appliquée");
  }

  const dueDate = captureDateAfterLabels(text, [
    "Date d'échéance",
    "Date echeance",
    "Due date",
  ]);
  const subtotalCents = Math.max(
    0,
    captureAmountAfterLabels(text, ["Total HT", "Montant HT"]) ?? 0,
  );
  const totalCents = Math.max(
    0,
    captureAmountAfterLabels(text, ["Total TTC", "Montant TTC", "TTC"]) ??
      subtotalCents,
  );
  const taxCents = Math.max(
    0,
    captureAmountAfterLabels(text, ["TVA", "Montant TVA"]) ??
      Math.max(0, totalCents - subtotalCents),
  );

  if (totalCents === 0) {
    warnings.push("Montant TTC non détecté");
  }

  const item: z.infer<typeof invoiceImportItemSchema> = {
    number,
    clientDisplayName,
    issueDate: issueDate.toISOString(),
    dueDate: dueDate ? dueDate.toISOString() : null,
    currency: text.includes("€") ? "EUR" : "EUR",
    status: BillingInvoiceStatus.ISSUED,
    subtotalCents,
    taxCents,
    totalCents,
    paidCents: 0,
    notes: captureTextAfterLabels(text, ["Objet", "Notes", "Description"]) ?? undefined,
    lineDescription:
      captureTextAfterLabels(text, ["Désignation", "Designation", "Prestation"]) ??
      "Import PDF historique",
    source: "PDF",
    confidence: totalCents > 0 ? "MEDIUM" : "LOW",
    warnings,
  };

  return {
    items: [item],
    mappedColumns: ["Extraction PDF intelligente (heuristiques Jobio/Time/Abby)"],
  };
};

const parseClientsFromCsv = (fileText: string) => {
  const parsed = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new ActionError("Le CSV clients ne peut pas être lu");
  }

  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) {
    throw new ActionError("Le CSV ne contient aucun en-tête");
  }

  const resolveHeader = buildHeaderResolver(headers);
  const mapping = {
    type: resolveHeader(["type", "type client", "client type"]),
    displayName: resolveHeader([
      "nom",
      "nom client",
      "client",
      "display name",
      "entreprise",
      "societe",
    ]),
    legalName: resolveHeader(["raison sociale", "legal name"]),
    siret: resolveHeader(["siret", "siren", "siren ou siret"]),
    vatNumber: resolveHeader(["tva", "tva intracom", "vat"]),
    email: resolveHeader(["mail", "email"]),
    phone: resolveHeader(["telephone", "tel", "phone"]),
    addressLine1: resolveHeader(["adresse", "address"]),
    addressLine2: resolveHeader(["complement", "adresse 2", "address 2"]),
    postalCode: resolveHeader(["code postal", "postal code", "zip"]),
    city: resolveHeader(["ville", "city"]),
    countryCode: resolveHeader(["pays", "country", "country code"]),
    notes: resolveHeader(["notes", "commentaire"]),
    contactFirstName: resolveHeader([
      "contact prenom",
      "contact first name",
      "prenom contact",
    ]),
    contactLastName: resolveHeader([
      "contact nom",
      "contact last name",
      "nom contact",
    ]),
    contactRole: resolveHeader([
      "contact role",
      "contact fonction",
      "fonction contact",
    ]),
    contactEmail: resolveHeader(["contact email", "contact mail"]),
    contactPhone: resolveHeader(["contact telephone", "contact phone", "contact tel"]),
    contactNotes: resolveHeader(["contact notes", "note contact"]),
    contactIncludeInEmail: resolveHeader([
      "contact include email",
      "inclure email contact",
    ]),
  } as const;

  const items: z.infer<typeof clientImportItemSchema>[] = [];

  for (const row of parsed.data) {
    const warnings: string[] = [];
    const read = (field: keyof typeof mapping) => {
      const header = mapping[field];
      if (!header) {
        return null;
      }
      return normalizeText(row[header]);
    };

    const displayName = read("displayName");
    if (!displayName) {
      continue;
    }

    const siret = read("siret");
    const typeText = normalizeHeader(read("type") ?? "");
    const inferredType =
      typeText.includes("particulier") || typeText.includes("individual")
        ? BillingClientType.INDIVIDUAL
      : siret
          ? BillingClientType.COMPANY
          : BillingClientType.INDIVIDUAL;

    const contactBuckets = new Map<string, Partial<ImportClientContact>>();
    const applyContactField = <
      K extends keyof ImportClientContact,
    >(
      bucket: string,
      field: K,
      value: ImportClientContact[K] | null | undefined,
    ) => {
      if (value === null || value === undefined || value === "") {
        return;
      }

      const existing = contactBuckets.get(bucket) ?? {};
      contactBuckets.set(bucket, {
        ...existing,
        [field]: value,
      });
    };

    applyContactField("0", "firstName", read("contactFirstName"));
    applyContactField("0", "lastName", read("contactLastName"));
    applyContactField("0", "role", read("contactRole"));
    applyContactField("0", "email", read("contactEmail"));
    applyContactField("0", "phone", read("contactPhone"));
    applyContactField("0", "notes", read("contactNotes"));
    const includeMapped = parseBooleanLike(read("contactIncludeInEmail"));
    if (includeMapped !== null) {
      applyContactField("0", "includeInEmail", includeMapped);
    }

    for (const header of headers) {
      const value = normalizeText(row[header]);
      if (!value) {
        continue;
      }

      const normalizedHeader = normalizeHeader(header);
      const match = normalizedHeader.match(/(?:contact|personne)\s*(\d+)\s*(.+)$/);
      if (!match?.[1] || !match[2]) {
        continue;
      }

      const index = match[1];
      const suffix = match[2];
      if (suffix.includes("prenom") || suffix.includes("first name")) {
        applyContactField(index, "firstName", value);
      } else if (suffix.includes("nom") || suffix.includes("last name")) {
        applyContactField(index, "lastName", value);
      } else if (suffix.includes("fonction") || suffix.includes("role")) {
        applyContactField(index, "role", value);
      } else if (suffix.includes("mail") || suffix.includes("email")) {
        applyContactField(index, "email", value);
      } else if (
        suffix.includes("telephone") ||
        suffix.includes("phone") ||
        suffix.includes("tel")
      ) {
        applyContactField(index, "phone", value);
      } else if (suffix.includes("note")) {
        applyContactField(index, "notes", value);
      } else if (suffix.includes("inclure email")) {
        const parsed = parseBooleanLike(value);
        if (parsed !== null) {
          applyContactField(index, "includeInEmail", parsed);
        }
      }
    }

    const contacts = normalizeImportContacts(
      Array.from(contactBuckets.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, contact]) => contact),
    );
    const primaryContact = contacts.find((contact) => contact.isPrimary);

    const confidence: ImportConfidence =
      [siret, read("email"), primaryContact?.email].some((value) => Boolean(value))
        ? "HIGH"
        : read("addressLine1")
          ? "MEDIUM"
          : "LOW";

    if (!read("addressLine1")) {
      warnings.push("Adresse non détectée");
    }

    items.push({
      type: inferredType,
      displayName,
      legalName: read("legalName") ?? displayName,
      siret: siret ?? undefined,
      vatNumber: read("vatNumber") ?? undefined,
      email: read("email") ?? primaryContact?.email ?? undefined,
      phone: read("phone") ?? primaryContact?.phone ?? undefined,
      addressLine1: read("addressLine1") ?? "Adresse non renseignée",
      addressLine2: read("addressLine2") ?? undefined,
      postalCode: read("postalCode") ?? "00000",
      city: read("city") ?? "Ville",
      countryCode: (read("countryCode") ?? "FR").slice(0, 2).toUpperCase(),
      notes: read("notes") ?? undefined,
      contacts,
      source: "CSV",
      confidence,
      warnings,
    });
  }

  return {
    items,
    mappedColumns: Object.entries(mapping)
      .filter(([, header]) => Boolean(header))
      .map(([key, header]) => `${key}: ${header}`)
      .slice(0, 12),
  };
};

const parseClientFromPdf = async (file: File) => {
  const text = await extractPdfText(file);
  const warnings: string[] = [];

  const displayName =
    captureTextAfterLabels(text, ["Nom du client", "Client"]) ??
    normalizeText(file.name.replace(/\.[^.]+$/, "")) ??
    "Client importé PDF";
  const siretMatch = text.match(/SIREN(?: ou SIRET)?\s*[:-]?\s*([0-9\s]{9,18})/i);
  const siretClean = siretMatch?.[1]?.replace(/\s+/g, "") ?? null;
  const vatMatch = text.match(
    /TVA(?: intracommunautaire)?\s*[:-]?\s*([A-Z]{2}[A-Z0-9\s]{2,24})/i,
  );
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\d[\s.-]?){8,13}/,
  );
  const postalCityMatch = text.match(/(\d{5})\s+([A-ZÀ-ÿ' -]{2,40})/);

  if (!siretClean) {
    warnings.push("SIRET/SIREN non détecté");
  }

  const contacts = normalizeImportContacts([
    {
      email: emailMatch?.[0] ?? undefined,
      phone: phoneMatch?.[0]?.trim() ?? undefined,
      includeInEmail: Boolean(emailMatch?.[0]),
      isPrimary: true,
      notes: "Contact extrait automatiquement du PDF",
    },
  ]);

  const item: z.infer<typeof clientImportItemSchema> = {
    type: siretClean ? BillingClientType.COMPANY : BillingClientType.INDIVIDUAL,
    displayName,
    legalName: displayName,
    siret: siretClean ?? undefined,
    vatNumber: vatMatch?.[1]?.replace(/\s+/g, "") ?? undefined,
    email: emailMatch?.[0] ?? contacts[0]?.email ?? undefined,
    phone: phoneMatch?.[0]?.trim() ?? contacts[0]?.phone ?? undefined,
    addressLine1:
      captureTextAfterLabels(text, ["Adresse postale", "Adresse"]) ??
      "Adresse non renseignée",
    addressLine2: undefined,
    postalCode: postalCityMatch?.[1] ?? "00000",
    city: postalCityMatch?.[2]?.trim() ?? "Ville",
    countryCode: "FR",
    notes: "Client extrait depuis un PDF historique",
    contacts,
    source: "PDF",
    confidence: siretClean ? "MEDIUM" : "LOW",
    warnings,
  };

  return {
    items: [item],
    mappedColumns: ["Extraction PDF intelligente (heuristiques Jobio/Time/Abby)"],
  };
};

const ensureClientForImport = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    displayName: string;
  },
) => {
  const existing = await tx.billingClient.findFirst({
    where: {
      userId: input.userId,
      deletedAt: null,
      displayName: {
        equals: input.displayName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return {
      clientId: existing.id,
      created: false,
    };
  }

  const created = await tx.billingClient.create({
    data: {
      userId: input.userId,
      type: BillingClientType.COMPANY,
      displayName: input.displayName,
      legalName: input.displayName,
      addressLine1: "Adresse non renseignée",
      postalCode: "00000",
      city: "Ville",
      countryCode: "FR",
      tags: ["imported-invoice"],
    },
    select: {
      id: true,
    },
  });

  return {
    clientId: created.id,
    created: true,
  };
};

type ExistingClientContact = {
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  includeInEmail: boolean;
  isPrimary: boolean;
  notes: string | null;
};

const mergeClientContactsForImport = (
  existingContacts: ExistingClientContact[],
  importedContacts: ImportClientContact[],
) => {
  const merged = existingContacts.map((contact) => ({
    firstName: contact.firstName,
    lastName: contact.lastName,
    role: contact.role,
    email: contact.email,
    phone: contact.phone,
    includeInEmail: contact.includeInEmail,
    isPrimary: contact.isPrimary,
    notes: contact.notes,
  }));

  for (const importedContact of importedContacts) {
    const importedEmailKey = normalizeEmailKey(importedContact.email);
    const importedFirstNameKey = normalizeHeader(importedContact.firstName ?? "");
    const importedLastNameKey = normalizeHeader(importedContact.lastName ?? "");

    const existingIndex = merged.findIndex((contact) => {
      const existingEmailKey = normalizeEmailKey(contact.email);
      if (existingEmailKey && importedEmailKey) {
        return existingEmailKey === importedEmailKey;
      }

      const existingFirstNameKey = normalizeHeader(contact.firstName ?? "");
      const existingLastNameKey = normalizeHeader(contact.lastName ?? "");
      if (
        existingFirstNameKey.length > 0 &&
        existingLastNameKey.length > 0 &&
        importedFirstNameKey.length > 0 &&
        importedLastNameKey.length > 0
      ) {
        return (
          existingFirstNameKey === importedFirstNameKey &&
          existingLastNameKey === importedLastNameKey
        );
      }

      return false;
    });

    if (existingIndex >= 0) {
      const current = merged[existingIndex];
      merged[existingIndex] = {
        firstName: current.firstName ?? importedContact.firstName ?? null,
        lastName: current.lastName ?? importedContact.lastName ?? null,
        role: current.role ?? importedContact.role ?? null,
        email: current.email ?? importedContact.email ?? null,
        phone: current.phone ?? importedContact.phone ?? null,
        includeInEmail:
          current.includeInEmail ||
          (Boolean(importedContact.includeInEmail) && Boolean(importedContact.email)),
        isPrimary: current.isPrimary || Boolean(importedContact.isPrimary),
        notes: current.notes ?? importedContact.notes ?? null,
      };
      continue;
    }

    merged.push({
      firstName: importedContact.firstName ?? null,
      lastName: importedContact.lastName ?? null,
      role: importedContact.role ?? null,
      email: importedContact.email ?? null,
      phone: importedContact.phone ?? null,
      includeInEmail:
        Boolean(importedContact.includeInEmail) && Boolean(importedContact.email),
      isPrimary: Boolean(importedContact.isPrimary),
      notes: importedContact.notes ?? null,
    });
  }

  if (merged.length > 0 && !merged.some((contact) => contact.isPrimary)) {
    merged[0].isPrimary = true;
  }

  return merged.map((contact, index) => ({
    ...contact,
    position: index,
  }));
};

const areContactsEquivalent = (
  left: (
    ExistingClientContact & {
      position?: number;
    }
  )[],
  right: (
    ExistingClientContact & {
      position?: number;
    }
  )[],
) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((contact, index) => {
    const other = right[index];

    return (
      (contact.firstName ?? null) === (other.firstName ?? null) &&
      (contact.lastName ?? null) === (other.lastName ?? null) &&
      (contact.role ?? null) === (other.role ?? null) &&
      (contact.email ?? null) === (other.email ?? null) &&
      (contact.phone ?? null) === (other.phone ?? null) &&
      Boolean(contact.includeInEmail) === Boolean(other.includeInEmail) &&
      Boolean(contact.isPrimary) === Boolean(other.isPrimary) &&
      (contact.notes ?? null) === (other.notes ?? null)
    );
  });
};

export const parseBillingInvoicesImportAction = authAction
  .inputSchema(parseImportFileSchema)
  .action(async ({ parsedInput }) => {
    const file = parsedInput.formData.get("file");
    if (!(file instanceof File)) {
      throw new ActionError("Aucun fichier sélectionné");
    }

    const fileType = detectImportFileType(file);
    if (!fileType) {
      throw new ActionError("Formats supportés: CSV, PDF");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new ActionError("Fichier trop volumineux (max 10 Mo)");
    }

    const parsed =
      fileType === "csv"
        ? parseInvoicesFromCsv(await file.text())
        : await parseInvoiceFromPdf(file);

    if (parsed.items.length === 0) {
      throw new ActionError("Aucune facture exploitable trouvée dans ce fichier");
    }

    return {
      fileType: fileType.toUpperCase(),
      items: parsed.items,
      mappedColumns: parsed.mappedColumns,
    };
  });

export const commitBillingInvoicesImportAction = authAction
  .inputSchema(commitInvoiceImportSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.billingProfile.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          documentTemplate: true,
          paymentTermsInDays: true,
        },
      });

      let createdCount = 0;
      let skippedCount = 0;
      let createdClientsCount = 0;
      const warnings: string[] = [];

      for (const item of parsedInput.items) {
        const issueDate = parseDateValue(item.issueDate) ?? new Date();
        const dueDate = item.dueDate ? parseDateValue(item.dueDate) : null;

        if (item.number) {
          const exists = await tx.billingInvoice.findFirst({
            where: {
              userId: user.id,
              deletedAt: null,
              number: item.number,
            },
            select: {
              id: true,
            },
          });

          if (exists) {
            skippedCount += 1;
            warnings.push(`Facture ${item.number} ignorée (déjà existante)`);
            continue;
          }
        }

        const { clientId, created } = await ensureClientForImport(tx, {
          userId: user.id,
          displayName: item.clientDisplayName,
        });

        if (created) {
          createdClientsCount += 1;
        }

        const totalCents = Math.max(0, item.totalCents);
        const subtotalCents = Math.max(
          0,
          item.subtotalCents > 0 ? item.subtotalCents : totalCents - item.taxCents,
        );
        const taxCents = Math.max(
          0,
          item.taxCents > 0 ? item.taxCents : totalCents - subtotalCents,
        );
        const paidCents = Math.min(totalCents, Math.max(0, item.paidCents));
        const balanceCents = Math.max(0, totalCents - paidCents);

        const effectiveStatus =
          item.status === BillingInvoiceStatus.DRAFT
            ? BillingInvoiceStatus.DRAFT
            : balanceCents <= 0
              ? BillingInvoiceStatus.PAID
              : paidCents > 0
                ? BillingInvoiceStatus.PARTIALLY_PAID
                : item.status;

        const vatRatePercent =
          subtotalCents > 0 ? Math.round((taxCents / subtotalCents) * 10_000) / 100 : 0;

        const invoice = await tx.billingInvoice.create({
          data: {
            userId: user.id,
            clientId,
            number: item.number ?? null,
            status: effectiveStatus,
            issueDate,
            dueDate:
              dueDate ??
              new Date(
                issueDate.getFullYear(),
                issueDate.getMonth(),
                issueDate.getDate() + (profile?.paymentTermsInDays ?? 30),
              ),
            currency: item.currency.toUpperCase(),
            documentTemplate: profile?.documentTemplate ?? null,
            notes: item.notes ?? null,
            terms: null,
            subtotalCents,
            discountCents: 0,
            taxCents,
            totalCents,
            paidCents,
            balanceCents,
            issuedAt:
              effectiveStatus === BillingInvoiceStatus.DRAFT ? null : issueDate,
            paidAt:
              effectiveStatus === BillingInvoiceStatus.PAID ? issueDate : null,
            lines: {
              create: {
                position: 0,
                description: item.lineDescription ?? "Import historique",
                quantity: 1,
                unitPriceCents: subtotalCents,
                discountPercent: 0,
                vatRatePercent,
                subtotalCents,
                taxCents,
                totalCents,
              },
            },
          },
          select: {
            id: true,
            number: true,
            status: true,
          },
        });

        await createBillingAuditEvent(tx, {
          userId: user.id,
          entityType: BillingEntityType.INVOICE,
          entityId: invoice.id,
          eventType: BillingAuditEventType.CREATED,
          message: `Facture importée (${invoice.number ?? invoice.id})`,
          metadata: {
            source: item.source,
            confidence: item.confidence,
            ownerOverride: true,
          },
        });

        createdCount += 1;
      }

      return {
        createdCount,
        skippedCount,
        createdClientsCount,
        warnings,
      };
    });
  });

export const parseBillingClientsImportAction = authAction
  .inputSchema(parseImportFileSchema)
  .action(async ({ parsedInput }) => {
    const file = parsedInput.formData.get("file");
    if (!(file instanceof File)) {
      throw new ActionError("Aucun fichier sélectionné");
    }

    const fileType = detectImportFileType(file);
    if (!fileType) {
      throw new ActionError("Formats supportés: CSV, PDF");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new ActionError("Fichier trop volumineux (max 10 Mo)");
    }

    const parsed =
      fileType === "csv"
        ? parseClientsFromCsv(await file.text())
        : await parseClientFromPdf(file);

    if (parsed.items.length === 0) {
      throw new ActionError("Aucun client exploitable trouvé dans ce fichier");
    }

    return {
      fileType: fileType.toUpperCase(),
      items: parsed.items,
      mappedColumns: parsed.mappedColumns,
    };
  });

export const commitBillingClientsImportAction = authAction
  .inputSchema(commitClientImportSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const item of parsedInput.items) {
        const importedContacts = normalizeImportContacts(item.contacts);
        const primaryImportedContact = importedContacts.find(
          (contact) => contact.isPrimary,
        );
        const hasSendableContact = importedContacts.some(
          (contact) => contact.includeInEmail && Boolean(contact.email),
        );

        const existing = await tx.billingClient.findFirst({
          where: {
            userId: user.id,
            deletedAt: null,
            OR: [
              {
                displayName: {
                  equals: item.displayName,
                  mode: "insensitive",
                },
              },
              ...(item.siret
                ? [
                    {
                      siret: item.siret,
                    },
                  ]
                : []),
            ],
          },
          include: {
            contacts: {
              orderBy: {
                position: "asc",
              },
            },
          },
        });

        if (!existing) {
          const created = await tx.billingClient.create({
            data: {
              userId: user.id,
              type: item.type,
              displayName: item.displayName,
              legalName: item.legalName ?? item.displayName,
              contactFirstName: primaryImportedContact?.firstName ?? null,
              contactLastName: primaryImportedContact?.lastName ?? null,
              email: item.email ?? primaryImportedContact?.email ?? null,
              phone: item.phone ?? primaryImportedContact?.phone ?? null,
              vatNumber: item.vatNumber ?? null,
              siret: item.siret ?? null,
              addressLine1:
                item.addressLine1.trim().length > 0
                  ? item.addressLine1
                  : "Adresse non renseignée",
              addressLine2: item.addressLine2 ?? null,
              postalCode: item.postalCode.trim().length > 0 ? item.postalCode : "00000",
              city: item.city.trim().length > 0 ? item.city : "Ville",
              countryCode:
                item.countryCode.trim().length > 0 ? item.countryCode : "FR",
              notes: item.notes ?? null,
              tags: [
                "imported-client",
                `import-confidence:${item.confidence.toLowerCase()}`,
                ...(hasSendableContact ? ["email-send-enabled"] : []),
              ],
              contacts:
                importedContacts.length > 0
                  ? {
                      create: importedContacts.map((contact, index) => ({
                        userId: user.id,
                        position: index,
                        firstName: contact.firstName ?? null,
                        lastName: contact.lastName ?? null,
                        role: contact.role ?? null,
                        email: contact.email ?? null,
                        phone: contact.phone ?? null,
                        includeInEmail:
                          Boolean(contact.includeInEmail) && Boolean(contact.email),
                        isPrimary: Boolean(contact.isPrimary),
                        notes: contact.notes ?? null,
                      })),
                    }
                  : undefined,
            },
            select: {
              id: true,
              displayName: true,
            },
          });

          await createBillingAuditEvent(tx, {
            userId: user.id,
            entityType: BillingEntityType.CLIENT,
            entityId: created.id,
            eventType: BillingAuditEventType.CREATED,
            message: `Client importé (${created.displayName})`,
            metadata: {
              source: item.source,
              confidence: item.confidence,
            },
          });
          createdCount += 1;
          continue;
        }

        const mergedContacts = mergeClientContactsForImport(
          existing.contacts,
          importedContacts,
        );
        const shouldUpdateContacts =
          importedContacts.length > 0 &&
          !areContactsEquivalent(existing.contacts, mergedContacts);
        const mergedTags = new Set(existing.tags);
        mergedTags.add(`import-confidence:${item.confidence.toLowerCase()}`);
        if (hasSendableContact) {
          mergedTags.add("email-send-enabled");
        }

        const shouldUpdate =
          [
            !existing.email && Boolean(item.email),
            !existing.phone && Boolean(item.phone),
            !existing.siret && Boolean(item.siret),
            !existing.vatNumber && Boolean(item.vatNumber),
            !existing.legalName && Boolean(item.legalName),
            !existing.contactFirstName && Boolean(primaryImportedContact?.firstName),
            !existing.contactLastName && Boolean(primaryImportedContact?.lastName),
            shouldUpdateContacts,
            mergedTags.size !== existing.tags.length,
          ].some(Boolean) || existing.addressLine1 === "Adresse non renseignée";

        if (!shouldUpdate) {
          skippedCount += 1;
          continue;
        }

        await tx.billingClient.update({
          where: {
            id: existing.id,
          },
          data: {
            legalName: existing.legalName ?? item.legalName ?? item.displayName,
            contactFirstName:
              existing.contactFirstName ?? primaryImportedContact?.firstName ?? null,
            contactLastName:
              existing.contactLastName ?? primaryImportedContact?.lastName ?? null,
            email: existing.email ?? item.email ?? primaryImportedContact?.email ?? null,
            phone: existing.phone ?? item.phone ?? primaryImportedContact?.phone ?? null,
            vatNumber: existing.vatNumber ?? item.vatNumber ?? null,
            siret: existing.siret ?? item.siret ?? null,
            addressLine1:
              existing.addressLine1 === "Adresse non renseignée"
                ? item.addressLine1.trim().length > 0
                  ? item.addressLine1
                  : existing.addressLine1
                : existing.addressLine1,
            addressLine2: existing.addressLine2 ?? item.addressLine2 ?? null,
            postalCode:
              existing.postalCode === "00000"
                ? item.postalCode.trim().length > 0
                  ? item.postalCode
                  : existing.postalCode
                : existing.postalCode,
            city:
              existing.city === "Ville"
                ? item.city.trim().length > 0
                  ? item.city
                  : existing.city
                : existing.city,
            countryCode:
              existing.countryCode === "FR"
                ? item.countryCode.trim().length > 0
                  ? item.countryCode
                  : existing.countryCode
                : existing.countryCode,
            notes: existing.notes ?? item.notes ?? null,
            tags: Array.from(mergedTags),
            contacts: shouldUpdateContacts
              ? {
                  deleteMany: {},
                  create: mergedContacts.map((contact, index) => ({
                    userId: user.id,
                    position: index,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    role: contact.role,
                    email: contact.email,
                    phone: contact.phone,
                    includeInEmail: contact.includeInEmail,
                    isPrimary: contact.isPrimary,
                    notes: contact.notes,
                  })),
                }
              : undefined,
          },
        });

        await createBillingAuditEvent(tx, {
          userId: user.id,
          entityType: BillingEntityType.CLIENT,
          entityId: existing.id,
          eventType: BillingAuditEventType.UPDATED,
          message: `Client enrichi depuis import (${existing.displayName})`,
          metadata: {
            source: item.source,
            confidence: item.confidence,
          },
        });
        updatedCount += 1;
      }

      return {
        createdCount,
        updatedCount,
        skippedCount,
      };
    });
  });
