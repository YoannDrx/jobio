import { SiteConfig } from "@/site-config";
import {
  DEFAULT_BILLING_DOCUMENT_ACCENT_COLOR,
  DEFAULT_BILLING_DOCUMENT_PRIMARY_COLOR,
  resolveBillingDocumentTemplate,
} from "./billing-document-templates";
import { formatDate } from "./billing-presenter";

export type BillingDocumentKind = "quote" | "invoice" | "creditNote";

type BillingLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  vatRatePercent: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

type BillingCounterparty = {
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
};

type BillingIssuer = {
  legalName: string;
  legalForm: string | null;
  siret: string | null;
  vatNumber: string | null;
  vatExemptionMention?: string | null;
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
  documentTemplate?: string | null;
  documentPrimaryColor?: string | null;
  documentAccentColor?: string | null;
  documentLogoUrl?: string | null;
  documentFooterText?: string | null;
  documentShowNotes?: boolean;
  documentShowTerms?: boolean;
  documentShowBankDetails?: boolean;
  documentShowClientContact?: boolean;
  documentShowIssuerContact?: boolean;
  documentShowLineVat?: boolean;
};

type BillingDocumentBase = {
  number: string | null;
  issueDate: Date;
  dueDate?: Date | null;
  validUntil?: Date | null;
  currency: string;
  notes: string | null;
  terms: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  paidCents?: number;
  balanceCents?: number;
  reason?: string | null;
  sourceNumber?: string | null;
  lines: BillingLine[];
  template?: string | null;
};

type RenderBillingDocumentInput = {
  kind: BillingDocumentKind;
  issuer: BillingIssuer | null;
  counterparty: BillingCounterparty;
  document: BillingDocumentBase;
};

type RenderPreferences = {
  template: ReturnType<typeof resolveBillingDocumentTemplate>;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  footerText: string | null;
  showNotes: boolean;
  showTerms: boolean;
  showBankDetails: boolean;
  showClientContact: boolean;
  showIssuerContact: boolean;
  showLineVat: boolean;
};

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const toText = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return "-";
  }

  return escapeHtml(value.trim());
};

const sanitizeColor = (value: string | null | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim();
  return HEX_COLOR_REGEX.test(normalized) ? normalized : fallback;
};

const sanitizeLogoUrl = (value: string | null | undefined) => {
  if (!value || value.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return escapeHtml(url.toString());
  } catch {
    return null;
  }
};

const resolvePreferences = (input: {
  issuer: BillingIssuer | null;
  document: BillingDocumentBase;
}): RenderPreferences => {
  const template = resolveBillingDocumentTemplate(
    input.document.template ?? input.issuer?.documentTemplate,
  );
  const footerText = input.issuer?.documentFooterText?.trim();

  return {
    template,
    primaryColor: sanitizeColor(
      input.issuer?.documentPrimaryColor,
      template.primaryColor || DEFAULT_BILLING_DOCUMENT_PRIMARY_COLOR,
    ),
    accentColor: sanitizeColor(
      input.issuer?.documentAccentColor,
      template.accentColor || DEFAULT_BILLING_DOCUMENT_ACCENT_COLOR,
    ),
    logoUrl: sanitizeLogoUrl(input.issuer?.documentLogoUrl),
    footerText: footerText && footerText.length > 0 ? footerText : null,
    showNotes: input.issuer?.documentShowNotes ?? true,
    showTerms: input.issuer?.documentShowTerms ?? true,
    showBankDetails: input.issuer?.documentShowBankDetails ?? true,
    showClientContact: input.issuer?.documentShowClientContact ?? true,
    showIssuerContact: input.issuer?.documentShowIssuerContact ?? true,
    showLineVat: input.issuer?.documentShowLineVat ?? true,
  };
};

const formatCurrency = (valueCents: number, currency: string) => {
  const value = valueCents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatQuantity = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
};

const documentTitle = (kind: BillingDocumentKind) => {
  if (kind === "quote") return "Devis";
  if (kind === "invoice") return "Facture";
  return "Avoir";
};

const buildAddress = (params: {
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
}) => {
  return [
    params.line1,
    params.line2,
    `${params.postalCode} ${params.city}`,
    params.countryCode,
  ]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .map((part) => escapeHtml(part.trim()))
    .join("<br />");
};

const buildIssuerBlock = (
  issuer: BillingIssuer | null,
  preferences: RenderPreferences,
) => {
  if (!issuer) {
    return `
      <div class="block">
        <h3>Émetteur</h3>
        <p class="muted">Profil de facturation non configuré</p>
      </div>
    `;
  }

  const legalMeta = [
    issuer.legalForm,
    issuer.siret ? `SIRET ${issuer.siret}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  const contacts: string[] = [];
  if (preferences.showIssuerContact) {
    contacts.push(`<p>Email: ${toText(issuer.email)}</p>`);
    contacts.push(`<p>Tél: ${toText(issuer.phone)}</p>`);
    contacts.push(`<p>Site: ${toText(issuer.website)}</p>`);
  }

  const vatDisplay = issuer.vatNumber
    ? `TVA: ${toText(issuer.vatNumber)}`
    : issuer.vatExemptionMention
      ? toText(issuer.vatExemptionMention)
      : "TVA: -";

  return `
    <div class="block">
      <h3>Émetteur</h3>
      <p><strong>${toText(issuer.legalName)}</strong></p>
      <p>${legalMeta ? escapeHtml(legalMeta) : "-"}</p>
      <p>${buildAddress({
        line1: issuer.addressLine1,
        line2: issuer.addressLine2,
        postalCode: issuer.postalCode,
        city: issuer.city,
        countryCode: issuer.countryCode,
      })}</p>
      ${contacts.join("\n")}
      <p>${vatDisplay}</p>
    </div>
  `;
};

const buildCounterpartyBlock = (
  counterparty: BillingCounterparty,
  preferences: RenderPreferences,
) => {
  const legalMeta = [
    counterparty.legalName,
    counterparty.siret ? `SIRET ${counterparty.siret}` : null,
    counterparty.vatNumber ? `TVA ${counterparty.vatNumber}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  const contacts: string[] = [];
  if (preferences.showClientContact) {
    contacts.push(`<p>Email: ${toText(counterparty.email)}</p>`);
    contacts.push(`<p>Tél: ${toText(counterparty.phone)}</p>`);
  }

  return `
    <div class="block">
      <h3>Client</h3>
      <p><strong>${toText(counterparty.displayName)}</strong></p>
      <p>${legalMeta ? escapeHtml(legalMeta) : "-"}</p>
      <p>${buildAddress({
        line1: counterparty.addressLine1,
        line2: counterparty.addressLine2,
        postalCode: counterparty.postalCode,
        city: counterparty.city,
        countryCode: counterparty.countryCode,
      })}</p>
      ${contacts.join("\n")}
    </div>
  `;
};

const buildLinesTable = (params: {
  lines: BillingLine[];
  currency: string;
  showLineVat: boolean;
}) => {
  const rows = params.lines
    .map(
      (line, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${toText(line.description)}</td>
        <td class="right">${formatQuantity(line.quantity)}</td>
        <td class="right">${formatCurrency(line.unitPriceCents, params.currency)}</td>
        ${
          params.showLineVat
            ? `<td class="right">${line.vatRatePercent.toFixed(2)}%</td><td class="right">${formatCurrency(line.taxCents, params.currency)}</td>`
            : ""
        }
        <td class="right">${formatCurrency(line.subtotalCents, params.currency)}</td>
        <td class="right">${formatCurrency(line.totalCents, params.currency)}</td>
      </tr>
    `,
    )
    .join("\n");

  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th class="right">Qté</th>
          <th class="right">PU HT</th>
          ${
            params.showLineVat
              ? '<th class="right">TVA %</th><th class="right">Montant TVA</th>'
              : ""
          }
          <th class="right">Total HT</th>
          <th class="right">Total TTC</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const buildSummaryBlock = (params: {
  kind: BillingDocumentKind;
  document: BillingDocumentBase;
  currency: string;
}) => {
  const lines = [
    `
      <tr>
        <td>Sous-total HT</td>
        <td class="right">${formatCurrency(params.document.subtotalCents, params.currency)}</td>
      </tr>
    `,
    `
      <tr>
        <td>Remises</td>
        <td class="right">${formatCurrency(params.document.discountCents, params.currency)}</td>
      </tr>
    `,
    `
      <tr>
        <td>TVA</td>
        <td class="right">${formatCurrency(params.document.taxCents, params.currency)}</td>
      </tr>
    `,
    `
      <tr class="total">
        <td>Total TTC</td>
        <td class="right">${formatCurrency(params.document.totalCents, params.currency)}</td>
      </tr>
    `,
  ];

  if (params.kind === "invoice") {
    lines.push(
      `
      <tr>
        <td>Déjà encaissé</td>
        <td class="right">${formatCurrency(params.document.paidCents ?? 0, params.currency)}</td>
      </tr>
      `,
    );
    lines.push(
      `
      <tr class="total">
        <td>Reste dû</td>
        <td class="right">${formatCurrency(params.document.balanceCents ?? 0, params.currency)}</td>
      </tr>
      `,
    );
  }

  return `
    <table class="summary">
      <tbody>
        ${lines.join("\n")}
      </tbody>
    </table>
  `;
};

const buildMetadata = (params: {
  kind: BillingDocumentKind;
  document: BillingDocumentBase;
}) => {
  const pieces = [
    `<p><strong>${documentTitle(params.kind)}</strong> ${toText(params.document.number)}</p>`,
    `<p>Date d'émission: ${formatDate(params.document.issueDate)}</p>`,
  ];

  if (params.kind === "quote") {
    pieces.push(
      `<p>Valide jusqu'au: ${formatDate(params.document.validUntil ?? null)}</p>`,
    );
  }

  if (params.kind === "invoice") {
    pieces.push(
      `<p>Date d'échéance: ${formatDate(params.document.dueDate ?? null)}</p>`,
    );
  }

  if (params.kind === "creditNote") {
    pieces.push(
      `<p>Facture d'origine: ${toText(params.document.sourceNumber)}</p>`,
    );
    pieces.push(`<p>Motif: ${toText(params.document.reason)}</p>`);
  }

  return `<div class="meta">${pieces.join("\n")}</div>`;
};

const buildOptionalBlocks = (params: {
  document: BillingDocumentBase;
  preferences: RenderPreferences;
}) => {
  const blocks: string[] = [];

  if (params.preferences.showNotes) {
    blocks.push(`
      <div class="notes">
        <h4>Notes</h4>
        <p>${toText(params.document.notes)}</p>
      </div>
    `);
  }

  if (params.preferences.showTerms) {
    blocks.push(`
      <div class="notes">
        <h4>Conditions</h4>
        <p>${toText(params.document.terms)}</p>
      </div>
    `);
  }

  return blocks.join("\n");
};

const buildFooter = (
  issuer: BillingIssuer | null,
  preferences: RenderPreferences,
) => {
  if (!issuer) {
    return `<p class="muted">Mentions légales indisponibles (profil de facturation incomplet).</p>`;
  }

  const pieces: string[] = [];

  if (preferences.showBankDetails) {
    if (issuer.iban) {
      pieces.push(`IBAN ${issuer.iban}`);
    }

    if (issuer.bic) {
      pieces.push(`BIC ${issuer.bic}`);
    }
  }

  if (issuer.latePenaltyRate !== null) {
    pieces.push(`Pénalités de retard: ${issuer.latePenaltyRate.toFixed(2)}%`);
  }

  if (issuer.latePenaltyFlatFeeEur) {
    pieces.push(
      `Indemnité forfaitaire de recouvrement: ${issuer.latePenaltyFlatFeeEur} €`,
    );
  }

  const footerRows: string[] = [];

  if (pieces.length === 0) {
    footerRows.push(`<p class="muted">Aucune mention complémentaire</p>`);
  } else {
    footerRows.push(
      `<p class="muted">${pieces.map((piece) => escapeHtml(piece)).join(" · ")}</p>`,
    );
  }

  if (preferences.footerText) {
    footerRows.push(
      `<p class="muted">${escapeHtml(preferences.footerText)}</p>`,
    );
  }

  return footerRows.join("\n");
};

const buildBrandBlock = (preferences: RenderPreferences) => {
  if (preferences.logoUrl) {
    return `<img src="${preferences.logoUrl}" alt="Logo" class="logo" />`;
  }

  return `
    <div class="brand-fallback">
      <span class="brand-icon" aria-hidden="true"></span>
      <span class="brand-name">${escapeHtml(SiteConfig.title)}</span>
    </div>
  `;
};

export function renderBillingDocumentHtml(input: RenderBillingDocumentInput) {
  const preferences = resolvePreferences({
    issuer: input.issuer,
    document: input.document,
  });
  const optionalBlocks = buildOptionalBlocks({
    document: input.document,
    preferences,
  });
  const templateClass = `template-${preferences.template.id}`;
  const headerClass = `header-${preferences.template.headerLayout}`;
  const bannerClass = `banner-${preferences.template.bannerStyle}`;

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${documentTitle(input.kind)} ${toText(input.document.number)}</title>
    <style>
      :root {
        --primary-color: ${preferences.primaryColor};
        --accent-color: ${preferences.accentColor};
      }
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ${preferences.template.fontFamily};
        color: var(--primary-color);
        background: #ffffff;
        line-height: 1.45;
      }
      .sheet {
        position: relative;
        overflow: hidden;
        width: 100%;
        margin: 0 auto;
      }
      .header {
        display: grid;
        grid-template-columns: 1fr minmax(220px, 260px);
        gap: 16px;
        align-items: start;
        padding-bottom: 14px;
        border-bottom: 1px solid #e2e8f0;
      }
      .header-left {
        min-width: 0;
      }
      .header-right {
        text-align: right;
      }
      .logo {
        max-width: 420px;
        max-height: 200px;
        object-fit: contain;
      }
      .brand-fallback {
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }
      .brand-icon {
        width: 88px;
        height: 88px;
        border-radius: 12px;
        background: var(--primary-color);
        position: relative;
      }
      .brand-icon::before {
        content: "";
        position: absolute;
        left: 20px;
        top: 24px;
        width: 48px;
        height: 30px;
        border-radius: 5px;
        background: #ffffff;
      }
      .brand-icon::after {
        content: "";
        position: absolute;
        left: 40px;
        top: 34px;
        width: 18px;
        height: 10px;
        border: 3px solid var(--primary-color);
        border-top: none;
        border-right: none;
        transform: rotate(-45deg);
      }
      .brand-name {
        font-size: 52px;
        line-height: 1;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .title {
        color: var(--primary-color);
        font-size: 25px;
        font-weight: 700;
        letter-spacing: 0.01em;
        margin: 10px 0 4px 0;
      }
      .meta p,
      .block p,
      .footer p {
        margin: 2px 0;
        font-size: 12px;
      }
      .meta {
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        display: inline-block;
        max-width: 100%;
      }
      .muted { color: #64748b; }
      .participants {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .block {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px;
      }
      .block h3 {
        margin: 0 0 6px 0;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-color);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      table th,
      table td {
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 6px;
        font-size: 11px;
        vertical-align: top;
      }
      table th {
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--accent-color);
        font-weight: 600;
      }
      .right { text-align: right; }
      .content {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 14px;
      }
      .summary td {
        border-bottom: 1px solid #e2e8f0;
        font-size: 12px;
        padding: 7px 4px;
      }
      .summary .total td {
        font-size: 13px;
        font-weight: 700;
      }
      .notes {
        margin-top: 10px;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        padding: 8px;
      }
      .notes h4 {
        margin: 0 0 6px;
        font-size: 11px;
        text-transform: uppercase;
        color: var(--accent-color);
      }
      .notes p {
        margin: 0;
        font-size: 11px;
        white-space: pre-wrap;
      }
      .footer {
        margin-top: 16px;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
      }
      .header-compact {
        grid-template-columns: 1fr 220px;
      }
      .header-stacked {
        grid-template-columns: 1fr;
      }
      .header-stacked .header-right {
        text-align: left;
      }
      .banner-soft-wave::before {
        content: "";
        position: absolute;
        top: -72px;
        right: -92px;
        width: 390px;
        height: 190px;
        background: radial-gradient(circle at center, var(--accent-color), transparent 70%);
        border-radius: 44% 56% 62% 38%;
        opacity: 0.28;
        pointer-events: none;
      }
      .banner-geo::before {
        content: "";
        position: absolute;
        top: -110px;
        right: -55px;
        width: 250px;
        height: 250px;
        background: linear-gradient(140deg, var(--accent-color), transparent 72%);
        clip-path: polygon(50% 0%, 100% 35%, 80% 100%, 0 84%, 0 20%);
        opacity: 0.35;
        pointer-events: none;
      }
      .banner-ribbon .header {
        border-top: 10px solid var(--accent-color);
        padding-top: 8px;
      }
      .template-midnight-glass {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 220px);
      }
      .template-stone-minimal table th {
        color: #475569;
      }
      .template-coral-ribbon .summary .total td {
        color: #be123c;
      }
      .template-amber-grid table th,
      .template-amber-grid .block h3 {
        color: #b45309;
      }
      .template-plum-column .title {
        letter-spacing: 0.03em;
      }
    </style>
  </head>
  <body>
    <main class="sheet ${templateClass} ${headerClass} ${bannerClass}">
      <header class="header">
        <div class="header-left">
          <div class="brand">
            ${buildBrandBlock(preferences)}
          </div>
          <h1 class="title">${documentTitle(input.kind)}</h1>
        </div>
        <div class="header-right">
          ${buildMetadata({ kind: input.kind, document: input.document })}
        </div>
      </header>

      <section class="participants">
        ${buildIssuerBlock(input.issuer, preferences)}
        ${buildCounterpartyBlock(input.counterparty, preferences)}
      </section>

      <section class="content">
        <div>
          ${buildLinesTable({
            lines: input.document.lines,
            currency: input.document.currency,
            showLineVat: preferences.showLineVat,
          })}
          ${optionalBlocks}
        </div>
        <div>
          ${buildSummaryBlock({
            kind: input.kind,
            document: input.document,
            currency: input.document.currency,
          })}
        </div>
      </section>

      <footer class="footer">
        ${buildFooter(input.issuer, preferences)}
      </footer>
    </main>
  </body>
</html>
  `.trim();
}
