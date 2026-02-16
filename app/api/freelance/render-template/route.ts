import { generateCvPdfBuffer } from "@/features/cv-lab/cv-pdf";
import { renderBillingDocumentHtml } from "@/features/freelance/billing-document-renderer";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";
import { z } from "zod";

const renderModeSchema = z.enum(["preview", "pdf"]);

const querySchema = z.object({
  mode: renderModeSchema.optional().default("preview"),
  download: z.coerce.boolean().optional().default(false),
});

const mapIssuer = (profile: {
  legalName: string;
  legalForm: string | null;
  siret: string | null;
  vatNumber: string | null;
  vatExemptionMention: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  iban: string | null;
  bic: string | null;
  paymentTermsInDays: number;
  latePenaltyRate: number | null;
  latePenaltyFlatFeeEur: number | null;
  documentTemplate: string | null;
  documentPrimaryColor: string | null;
  documentAccentColor: string | null;
  documentLogoUrl: string | null;
  documentFooterText: string | null;
  documentShowNotes: boolean;
  documentShowTerms: boolean;
  documentShowBankDetails: boolean;
  documentShowClientContact: boolean;
  documentShowIssuerContact: boolean;
  documentShowLineVat: boolean;
}) => {
  return {
    legalName: profile.legalName,
    legalForm: profile.legalForm,
    siret: profile.siret,
    vatNumber: profile.vatNumber,
    vatExemptionMention: profile.vatExemptionMention,
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

const getTemplatePreviewHtml = async (userId: string) => {
  const profile = await prisma.billingProfile.findUnique({
    where: {
      userId,
    },
    select: {
      legalName: true,
      legalForm: true,
      siret: true,
      vatNumber: true,
      vatExemptionMention: true,
      addressLine1: true,
      addressLine2: true,
      postalCode: true,
      city: true,
      countryCode: true,
      email: true,
      phone: true,
      website: true,
      iban: true,
      bic: true,
      paymentTermsInDays: true,
      latePenaltyRate: true,
      latePenaltyFlatFeeEur: true,
      documentTemplate: true,
      documentPrimaryColor: true,
      documentAccentColor: true,
      documentLogoUrl: true,
      documentFooterText: true,
      documentShowNotes: true,
      documentShowTerms: true,
      documentShowBankDetails: true,
      documentShowClientContact: true,
      documentShowIssuerContact: true,
      documentShowLineVat: true,
    },
  });

  if (!profile) {
    throw new ZodRouteError(
      "Profil de facturation introuvable. Configure d'abord tes paramètres Freelance.",
      404,
    );
  }

  return renderBillingDocumentHtml({
    kind: "invoice",
    issuer: mapIssuer(profile),
    counterparty: {
      displayName: "Client Démo",
      legalName: "Client Démo SAS",
      email: "billing@client-demo.fr",
      phone: "+33 6 00 00 00 00",
      addressLine1: "14 rue du Client",
      addressLine2: null,
      postalCode: "75002",
      city: "Paris",
      countryCode: "FR",
      vatNumber: "FR00123456789",
      siret: "12345678900011",
    },
    document: {
      number: "PREVIEW-2026-001",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      currency: "EUR",
      template: profile.documentTemplate,
      notes:
        "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, à laquelle s'ajoutera une indemnité forfaitaire de 40€.",
      terms: "TVA non applicable, art. 293 B du CGI",
      subtotalCents: 250000,
      discountCents: 0,
      taxCents: 0,
      totalCents: 250000,
      paidCents: 0,
      balanceCents: 250000,
      lines: [
        {
          description: "Prestation de conseil freelance",
          quantity: 5,
          unitPriceCents: 50000,
          vatRatePercent: 0,
          subtotalCents: 250000,
          taxCents: 0,
          totalCents: 250000,
        },
      ],
    },
  });
};

export const GET = authRoute.query(querySchema).handler(async (_req, { query, ctx }) => {
  const html = await getTemplatePreviewHtml(ctx.user.id);

  if (query.mode === "pdf") {
    try {
      const pdf = await generateCvPdfBuffer(html);
      const bytes = new ArrayBuffer(pdf.byteLength);
      new Uint8Array(bytes).set(pdf);

      return new Response(bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "private, max-age=0, must-revalidate",
          "Content-Disposition": `${query.download ? "attachment" : "inline"}; filename="freelance-template-preview.pdf"`,
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
});
