import { describe, expect, it } from "vitest";
import { renderBillingDocumentHtml } from "@/features/freelance/billing-document-renderer";

describe("renderBillingDocumentHtml", () => {
  it("renders an invoice document with totals", () => {
    const html = renderBillingDocumentHtml({
      kind: "invoice",
      issuer: {
        legalName: "Studio Jobio",
        legalForm: "SASU",
        siret: "12345678900011",
        vatNumber: "FR00123456789",
        addressLine1: "10 rue de Paris",
        addressLine2: null,
        postalCode: "75001",
        city: "Paris",
        countryCode: "FR",
        email: "contact@jobio.fr",
        phone: "+33123456789",
        website: null,
        iban: "FR7600000000000000000000000",
        bic: "AGRIFRPP",
        paymentTermsInDays: 30,
        latePenaltyRate: 10,
        latePenaltyFlatFeeEur: 40,
      },
      counterparty: {
        displayName: "ACME",
        legalName: "ACME SARL",
        email: "contact@acme.test",
        phone: "+33911111111",
        addressLine1: "20 avenue de Lyon",
        addressLine2: null,
        postalCode: "69000",
        city: "Lyon",
        countryCode: "FR",
        vatNumber: "FR99888777666",
        siret: "99888777600012",
      },
      document: {
        number: "FAC-2026-0001",
        issueDate: new Date("2026-02-15T12:00:00.000Z"),
        dueDate: new Date("2026-03-15T12:00:00.000Z"),
        currency: "EUR",
        notes: "Merci pour votre confiance.",
        terms: "Paiement à 30 jours.",
        subtotalCents: 100000,
        discountCents: 0,
        taxCents: 20000,
        totalCents: 120000,
        paidCents: 20000,
        balanceCents: 100000,
        lines: [
          {
            description: "Accompagnement produit",
            quantity: 2,
            unitPriceCents: 50000,
            vatRatePercent: 20,
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
          },
        ],
      },
    });

    expect(html).toContain("FAC-2026-0001");
    expect(html).toContain("Studio Jobio");
    expect(html).toContain("Accompagnement produit");
    expect(html).toContain("Reste dû");
  });

  it("renders a credit note document with source invoice", () => {
    const html = renderBillingDocumentHtml({
      kind: "creditNote",
      issuer: null,
      counterparty: {
        displayName: "ACME",
        legalName: null,
        email: null,
        phone: null,
        addressLine1: "20 avenue de Lyon",
        addressLine2: null,
        postalCode: "69000",
        city: "Lyon",
        countryCode: "FR",
        vatNumber: null,
        siret: null,
      },
      document: {
        number: "AVO-2026-0001",
        sourceNumber: "FAC-2026-0001",
        reason: "Geste commercial",
        issueDate: new Date("2026-02-15T12:00:00.000Z"),
        currency: "EUR",
        notes: null,
        terms: null,
        subtotalCents: 5000,
        discountCents: 0,
        taxCents: 1000,
        totalCents: 6000,
        lines: [
          {
            description: "Geste commercial",
            quantity: 1,
            unitPriceCents: 5000,
            vatRatePercent: 20,
            subtotalCents: 5000,
            taxCents: 1000,
            totalCents: 6000,
          },
        ],
      },
    });

    expect(html).toContain("Avoir");
    expect(html).toContain("FAC-2026-0001");
    expect(html).toContain("Geste commercial");
  });

  it("applies document display preferences from billing profile", () => {
    const html = renderBillingDocumentHtml({
      kind: "invoice",
      issuer: {
        legalName: "Studio Jobio",
        legalForm: "SASU",
        siret: "12345678900011",
        vatNumber: "FR00123456789",
        addressLine1: "10 rue de Paris",
        addressLine2: null,
        postalCode: "75001",
        city: "Paris",
        countryCode: "FR",
        email: "contact@jobio.fr",
        phone: "+33123456789",
        website: "https://jobio.fr",
        iban: "FR7600000000000000000000000",
        bic: "AGRIFRPP",
        paymentTermsInDays: 30,
        latePenaltyRate: 10,
        latePenaltyFlatFeeEur: 40,
        documentPrimaryColor: "#111111",
        documentAccentColor: "#ff6600",
        documentLogoUrl: "https://cdn.jobio.fr/logo.png",
        documentFooterText: "Merci pour votre confiance",
        documentShowNotes: false,
        documentShowTerms: false,
        documentShowBankDetails: false,
        documentShowClientContact: true,
        documentShowIssuerContact: false,
        documentShowLineVat: false,
      },
      counterparty: {
        displayName: "ACME",
        legalName: "ACME SARL",
        email: "contact@acme.test",
        phone: "+33911111111",
        addressLine1: "20 avenue de Lyon",
        addressLine2: null,
        postalCode: "69000",
        city: "Lyon",
        countryCode: "FR",
        vatNumber: "FR99888777666",
        siret: "99888777600012",
      },
      document: {
        number: "FAC-2026-0042",
        issueDate: new Date("2026-02-15T12:00:00.000Z"),
        dueDate: new Date("2026-03-15T12:00:00.000Z"),
        currency: "EUR",
        notes: "Bloc notes masqué",
        terms: "Bloc conditions masqué",
        subtotalCents: 100000,
        discountCents: 0,
        taxCents: 20000,
        totalCents: 120000,
        paidCents: 0,
        balanceCents: 120000,
        lines: [
          {
            description: "Accompagnement produit",
            quantity: 2,
            unitPriceCents: 50000,
            vatRatePercent: 20,
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
          },
        ],
      },
    });

    expect(html).toContain("logo.png");
    expect(html).toContain("Merci pour votre confiance");
    expect(html).not.toContain("<h4>Notes</h4>");
    expect(html).not.toContain("<h4>Conditions</h4>");
    expect(html).not.toContain("Email: contact@jobio.fr");
    expect(html).not.toContain("IBAN");
    expect(html).not.toContain("TVA %");
  });
});
