"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";

export const generateQuoteShareTokenAction = authAction
  .inputSchema(z.object({ quoteId: z.string() }))
  .action(async ({ parsedInput: { quoteId }, ctx: { user } }) => {
    const quote = await prisma.billingQuote.findFirst({
      where: { id: quoteId, userId: user.id, deletedAt: null },
    });

    if (!quote) throw new ApplicationError("Devis introuvable");

    const token = nanoid(32);
    await prisma.billingQuote.update({
      where: { id: quoteId },
      data: { shareToken: token },
    });

    return { token, url: `/p/quote/${token}` };
  });

export const generateInvoiceShareTokenAction = authAction
  .inputSchema(z.object({ invoiceId: z.string() }))
  .action(async ({ parsedInput: { invoiceId }, ctx: { user } }) => {
    const invoice = await prisma.billingInvoice.findFirst({
      where: { id: invoiceId, userId: user.id, deletedAt: null },
    });

    if (!invoice) throw new ApplicationError("Facture introuvable");

    const token = nanoid(32);
    await prisma.billingInvoice.update({
      where: { id: invoiceId },
      data: { shareToken: token },
    });

    return { token, url: `/p/invoice/${token}` };
  });
