export type BillingLineInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPercent?: number;
  vatRatePercent?: number;
};

export type BillingComputedLine = {
  position: number;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountPercent: number;
  vatRatePercent: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

export type BillingComputedTotals = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
};

const clampPercent = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
};

const roundCents = (value: number) => {
  return Math.round(value);
};

export const computeLineAmounts = (line: BillingLineInput) => {
  const quantity = line.quantity > 0 ? line.quantity : 1;
  const unitPriceCents = Math.max(0, roundCents(line.unitPriceCents));
  const discountPercent = clampPercent(line.discountPercent ?? 0, 0);
  const vatRatePercent = clampPercent(line.vatRatePercent ?? 20, 20);

  const grossCents = roundCents(quantity * unitPriceCents);
  const discountCents = roundCents((grossCents * discountPercent) / 100);
  const subtotalCents = Math.max(0, grossCents - discountCents);
  const taxCents = roundCents((subtotalCents * vatRatePercent) / 100);
  const totalCents = subtotalCents + taxCents;

  return {
    quantity,
    unitPriceCents,
    discountPercent,
    vatRatePercent,
    grossCents,
    discountCents,
    subtotalCents,
    taxCents,
    totalCents,
  };
};

export const computeDocumentLines = (lines: BillingLineInput[]) => {
  return lines.map((line, index): BillingComputedLine => {
    const amounts = computeLineAmounts(line);

    return {
      position: index,
      description: line.description,
      quantity: amounts.quantity,
      unitPriceCents: amounts.unitPriceCents,
      discountPercent: amounts.discountPercent,
      vatRatePercent: amounts.vatRatePercent,
      subtotalCents: amounts.subtotalCents,
      taxCents: amounts.taxCents,
      totalCents: amounts.totalCents,
    };
  });
};

export const computeDocumentTotals = (
  lines: BillingComputedLine[],
): BillingComputedTotals => {
  let subtotalCents = 0;
  let taxCents = 0;

  for (const line of lines) {
    subtotalCents += line.subtotalCents;
    taxCents += line.taxCents;
  }

  const totalCents = subtotalCents + taxCents;
  const discountCents = lines.reduce((acc, line) => {
    const gross = roundCents(line.quantity * line.unitPriceCents);
    return acc + Math.max(0, gross - line.subtotalCents);
  }, 0);

  return {
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
  };
};

export const formatCentsToEuro = (value: number) => {
  return (value / 100).toFixed(2);
};
