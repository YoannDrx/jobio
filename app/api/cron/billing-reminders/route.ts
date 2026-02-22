import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { sendEmail } from "@/lib/mail/send-email";
import BillingInvoiceOverdueEmail from "@email/billing-invoice-overdue.email";
import { validateCronAuthorization } from "@/lib/security/cron-auth";

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "billing-reminders",
    route: new URL(req.url).pathname,
  });

  const authFailure = validateCronAuthorization(req.headers.get("authorization"));
  if (authFailure) {
    await finishCronJobRun(run?.id, {
      status: authFailure.status === 401 ? "UNAUTHORIZED" : "FAILED",
      errorMessage: authFailure.logMessage,
    });
    return NextResponse.json(
      { error: authFailure.publicError },
      { status: authFailure.status },
    );
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all overdue invoices that haven't been deleted
    const overdueInvoices = await prisma.billingInvoice.findMany({
      where: {
        status: "OVERDUE",
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    const emailPromises = overdueInvoices
      .filter((invoice) => {
        if (!invoice.dueDate) {
          return false;
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Only send email for daysOverdue = 7 or 14 to avoid spam
        return daysOverdue === 7 || daysOverdue === 14;
      })
      .map(async (invoice) => {
        // Calculate days overdue (recalculate for use in email)
        const dueDate = new Date(invoice.dueDate as Date);
        dueDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Format total
        const totalFormatted = (invoice.totalCents / 100).toLocaleString(
          "fr-FR",
          {
            style: "currency",
            currency: "EUR",
          },
        );

        // Build invoice URL
        const invoiceUrl = `${process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr"}/freelance/invoices`;

        // Send email to freelancer
        const invoiceNumber = invoice.number ?? invoice.id;
        return sendEmail({
          to: invoice.user.email,
          subject: `Rappel : Facture ${invoiceNumber} en retard de paiement`,
          html: BillingInvoiceOverdueEmail({
            freelancerName: invoice.user.name || "Freelancer",
            clientName: invoice.client.displayName,
            invoiceNumber,
            totalFormatted,
            daysOverdue,
            invoiceUrl,
          }),
        });
      });

    const results = await Promise.all(emailPromises);
    const emailsSent = results.filter((result) => !result.error).length;

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: emailsSent,
      details: {
        overdueInvoiceCount: overdueInvoices.length,
        emailsSent,
      },
    });

    return NextResponse.json({
      sent: emailsSent,
      overdueCount: overdueInvoices.length,
    });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
