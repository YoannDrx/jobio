import { type BillingSequenceKind, type Prisma } from "@/generated/prisma";

type ReserveBillingNumberInput = {
  userId: string;
  kind: BillingSequenceKind;
  date?: Date;
};

const PREFIX_BY_KIND: Record<BillingSequenceKind, string> = {
  QUOTE: "DEV",
  INVOICE: "FAC",
  CREDIT_NOTE: "AVO",
};

export const reserveBillingDocumentNumber = async (
  tx: Prisma.TransactionClient,
  input: ReserveBillingNumberInput,
) => {
  const date = input.date ?? new Date();
  const year = date.getFullYear();

  const sequence = await tx.billingNumberingSequence.upsert({
    where: {
      userId_kind_year: {
        userId: input.userId,
        kind: input.kind,
        year,
      },
    },
    create: {
      userId: input.userId,
      kind: input.kind,
      year,
      nextCounter: 2,
    },
    update: {
      nextCounter: {
        increment: 1,
      },
    },
    select: {
      nextCounter: true,
    },
  });

  const currentCounter = sequence.nextCounter - 1;
  const counter = String(currentCounter).padStart(4, "0");

  return `${PREFIX_BY_KIND[input.kind]}-${year}-${counter}`;
};
