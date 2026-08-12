import { generateCvPdfBuffer } from "@/features/cv-lab/cv-pdf";
import {
  renderBillingDocumentHtml,
  type BillingDocumentKind,
} from "@/features/freelance/billing-document-renderer";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";
import { z } from "zod";

const renderModeSchema = z.enum(["preview", "pdf"]);
const documentTypeSchema = z.enum(["quote", "invoice", "creditNote"]);

const querySchema = z.object({
  type: documentTypeSchema,
  id: z.string().min(1),
  mode: renderModeSchema.optional().default("pdf"),
  download: z.coerce.boolean().optional().default(false),
});

const getIssuer = async (userId: string) => {
  const profile = await prisma.billingProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!profile) {
    return null;
  }

  return {
    legalName: profile.legalName,
    legalForm: profile.legalForm,
    siret: profile.siret,
    vatNumber: profile.vatNumber,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    postalCode: profile.postalCode,
    city: profile.city,
    countryCode: profile.countryCode,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    iban: profile.iban,
    bic: profile.bic,
    paymentTermsInDays: profile.paymentTermsInDays,
    latePenaltyRate: profile.latePenaltyRate,
    latePenaltyFlatFeeEur: profile.latePenaltyFlatFeeEur,
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
  };
};

const mapClient = (client: {
  displayName: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
  vatNumber: string | null;
  siret: string | null;
}) => {
  return {
    displayName: client.displayName,
    legalName: client.legalName,
    email: client.email,
    phone: client.phone,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    postalCode: client.postalCode,
    city: client.city,
    countryCode: client.countryCode,
    vatNumber: client.vatNumber,
    siret: client.siret,
  };
};

const getQuoteDocument = async (userId: string, id: string) => {
  const quote = await prisma.billingQuote.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
    include: {
      client: true,
      lines: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!quote) {
    throw new ZodRouteError("Devis introuvable", 404);
  }

  return {
    kind: "quote" as const,
    counterparty: mapClient(quote.client),
    document: {
      number: quote.number,
      issueDate: quote.issueDate,
      validUntil: quote.validUntil,
      currency: quote.currency,
      notes: quote.notes,
      terms: quote.terms,
      subtotalCents: quote.subtotalCents,
      discountCents: quote.discountCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      lines: quote.lines,
    },
    safeName: `devis-${quote.number ?? quote.id}`,
  };
};

const getInvoiceDocument = async (userId: string, id: string) => {
  const invoice = await prisma.billingInvoice.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
    include: {
      client: true,
      lines: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!invoice) {
    throw new ZodRouteError("Facture introuvable", 404);
  }

  return {
    kind: "invoice" as const,
    counterparty: mapClient(invoice.client),
    document: {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      template: invoice.documentTemplate,
      notes: invoice.notes,
      terms: invoice.terms,
      subtotalCents: invoice.subtotalCents,
      discountCents: invoice.discountCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      paidCents: invoice.paidCents,
      balanceCents: invoice.balanceCents,
      lines: invoice.lines,
    },
    safeName: `facture-${invoice.number ?? invoice.id}`,
  };
};

const getCreditNoteDocument = async (userId: string, id: string) => {
  const creditNote = await prisma.billingCreditNote.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      invoice: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!creditNote) {
    throw new ZodRouteError("Avoir introuvable", 404);
  }

  return {
    kind: "creditNote" as const,
    counterparty: mapClient(creditNote.invoice.client),
    document: {
      number: creditNote.number,
      issueDate: creditNote.issueDate,
      currency: creditNote.invoice.currency,
      notes: null,
      terms: null,
      reason: creditNote.reason,
      sourceNumber: creditNote.invoice.number,
      subtotalCents: creditNote.subtotalCents,
      discountCents: 0,
      taxCents: creditNote.taxCents,
      totalCents: creditNote.totalCents,
      lines: [
        {
          description: creditNote.reason ?? "Avoir",
          quantity: 1,
          unitPriceCents: creditNote.subtotalCents,
          vatRatePercent:
            creditNote.subtotalCents === 0
              ? 0
              : (creditNote.taxCents / creditNote.subtotalCents) * 100,
          subtotalCents: creditNote.subtotalCents,
          taxCents: creditNote.taxCents,
          totalCents: creditNote.totalCents,
        },
      ],
    },
    safeName: `avoir-${creditNote.number ?? creditNote.id}`,
  };
};

const getDocument = async (params: {
  userId: string;
  type: z.infer<typeof documentTypeSchema>;
  id: string;
}) => {
  if (params.type === "quote") {
    return getQuoteDocument(params.userId, params.id);
  }

  if (params.type === "invoice") {
    return getInvoiceDocument(params.userId, params.id);
  }

  return getCreditNoteDocument(params.userId, params.id);
};

const renderResponse = async (params: {
  userId: string;
  type: z.infer<typeof documentTypeSchema>;
  id: string;
  mode: z.infer<typeof renderModeSchema>;
  download: boolean;
}) => {
  const [issuer, payload] = await Promise.all([
    getIssuer(params.userId),
    getDocument({
      userId: params.userId,
      type: params.type,
      id: params.id,
    }),
  ]);

  const html = renderBillingDocumentHtml({
    kind: payload.kind as BillingDocumentKind,
    issuer,
    counterparty: payload.counterparty,
    document: payload.document,
  });

  if (params.mode === "pdf") {
    try {
      const pdf = await generateCvPdfBuffer(html);
      const bytes = new ArrayBuffer(pdf.byteLength);
      new Uint8Array(bytes).set(pdf);

      return new Response(bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "private, max-age=0, must-revalidate",
          "Content-Disposition": `${params.download ? "attachment" : "inline"}; filename="${payload.safeName}.pdf"`,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de générer le PDF";
      throw new ZodRouteError(message, 503);
    }
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
};

export const GET = authRoute
  .query(querySchema)
  .handler(async (_req, { query, ctx }) => {
    return renderResponse({
      userId: ctx.user.id,
      type: query.type,
      id: query.id,
      mode: query.mode,
      download: query.download,
    });
  });
