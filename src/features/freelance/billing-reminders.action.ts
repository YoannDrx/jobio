"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/send-email";
import BillingInvoiceReminderClientEmail from "@email/billing-invoice-reminder-client.email";
import { z } from "zod";

export const sendManualReminderAction = authAction
  .inputSchema(z.object({ invoiceId: z.string() }))
  .action(async ({ parsedInput: { invoiceId }, ctx: { user } }) => {
    const invoice = await prisma.billingInvoice.findFirst({
      where: { id: invoiceId, userId: user.id, deletedAt: null },
      include: {
        client: {
          select: { displayName: true, email: true },
        },
      },
    });

    if (!invoice) {
      throw new ApplicationError("Facture introuvable");
    }

    if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") {
      throw new ApplicationError(
        "Impossible d'envoyer un rappel pour une facture brouillon ou annulée",
      );
    }

    if (!invoice.client.email) {
      throw new ApplicationError("Le client n'a pas d'adresse email");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysOverdue = invoice.dueDate
      ? Math.max(
          0,
          Math.floor(
            (today.getTime() - new Date(invoice.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    const invoiceNumber = invoice.number ?? invoice.id;
    const totalFormatted = (invoice.totalCents / 100).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });

    const invoiceUrl = invoice.shareToken
      ? `${process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr"}/share/invoice/${invoice.shareToken}`
      : `${process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr"}/job/gestion/invoices`;

    await sendEmail({
      to: invoice.client.email,
      subject: `Rappel : Facture ${invoiceNumber} en attente de paiement`,
      html: BillingInvoiceReminderClientEmail({
        clientName: invoice.client.displayName,
        freelancerName: user.name || "Freelancer",
        invoiceNumber,
        totalFormatted,
        daysOverdue,
        invoiceUrl,
      }),
    });

    return { sent: true, to: invoice.client.email };
  });
