import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { sendEmail } from "@/lib/mail/send-email";
import BillingInvoiceOverdueEmail from "@email/billing-invoice-overdue.email";
import BillingInvoiceReminderClientEmail from "@email/billing-invoice-reminder-client.email";
import { validateCronAuthorization } from "@/lib/security/cron-auth";
import { createNotification } from "@/features/notifications/create-notification";

const REMINDER_MILESTONES = [1, 7, 14, 30] as const;

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "billing-reminders",
    route: new URL(req.url).pathname,
  });

  const authFailure = validateCronAuthorization(
    req.headers.get("authorization"),
  );
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

    // Step 1: Auto-detect and mark overdue invoices
    const newlyOverdue = await prisma.billingInvoice.findMany({
      where: {
        status: { in: ["ISSUED", "PARTIALLY_PAID"] },
        dueDate: { lt: today },
        deletedAt: null,
      },
      select: { id: true, userId: true },
    });

    if (newlyOverdue.length > 0) {
      await prisma.billingInvoice.updateMany({
        where: { id: { in: newlyOverdue.map((i) => i.id) } },
        data: { status: "OVERDUE" },
      });

      // Create audit events for each newly overdue invoice
      await Promise.all(
        newlyOverdue.map(async (invoice) =>
          prisma.billingAuditEvent.create({
            data: {
              userId: invoice.userId,
              entityType: "INVOICE",
              entityId: invoice.id,
              eventType: "STATUS_CHANGED",
              message: "Facture automatiquement marquée en retard",
              metadata: { previousStatus: "ISSUED", newStatus: "OVERDUE" },
            },
          }),
        ),
      );
    }

    // Step 2: Graduated reminders for all overdue invoices
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
            preference: true,
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

    const reminderResults = await Promise.all(
      overdueInvoices.map(async (invoice) => {
        const result = {
          freelancerEmails: 0,
          clientEmails: 0,
          notifications: 0,
        };

        if (!invoice.dueDate) return result;

        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        const isMilestone = REMINDER_MILESTONES.includes(
          daysOverdue as (typeof REMINDER_MILESTONES)[number],
        );
        if (!isMilestone) return result;

        const invoiceNumber = invoice.number ?? invoice.id;
        const totalFormatted = (invoice.totalCents / 100).toLocaleString(
          "fr-FR",
          {
            style: "currency",
            currency: "EUR",
          },
        );

        // Send freelancer reminder if preference allows
        const notifyFreelancer =
          invoice.user.preference?.notifyOverdueInvoices !== false;

        if (notifyFreelancer) {
          const invoiceUrl = `${process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr"}/freelance/invoices`;

          const [emailResult] = await Promise.all([
            sendEmail({
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
            }),
            createNotification({
              userId: invoice.user.id,
              type: "BILLING_INVOICE_OVERDUE",
              title: `Facture ${invoiceNumber} en retard`,
              message: `La facture ${invoiceNumber} pour ${invoice.client.displayName} est en retard de ${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}`,
              link: "/freelance/invoices",
              dedupeHours: 24,
            }),
          ]);

          if (!emailResult.error) result.freelancerEmails++;
          result.notifications++;
        }

        // Step 3: Send client reminder (day 7 and 30 only)
        if ((daysOverdue === 7 || daysOverdue === 30) && invoice.client.email) {
          const clientInvoiceUrl = invoice.shareToken
            ? `${process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr"}/share/invoice/${invoice.shareToken}`
            : `${process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr"}/freelance/invoices`;

          const clientEmailResult = await sendEmail({
            to: invoice.client.email,
            subject: `Rappel : Facture ${invoiceNumber} en attente de paiement`,
            html: BillingInvoiceReminderClientEmail({
              clientName: invoice.client.displayName,
              freelancerName: invoice.user.name || "Freelancer",
              invoiceNumber,
              totalFormatted,
              daysOverdue,
              invoiceUrl: clientInvoiceUrl,
            }),
          });

          if (!clientEmailResult.error) result.clientEmails++;
        }

        return result;
      }),
    );

    const emailsSentFreelancer = reminderResults.reduce(
      (sum, r) => sum + r.freelancerEmails,
      0,
    );
    const emailsSentClient = reminderResults.reduce(
      (sum, r) => sum + r.clientEmails,
      0,
    );
    const notificationsCreated = reminderResults.reduce(
      (sum, r) => sum + r.notifications,
      0,
    );

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: emailsSentFreelancer + emailsSentClient,
      details: {
        newlyOverdueCount: newlyOverdue.length,
        overdueInvoiceCount: overdueInvoices.length,
        emailsSentFreelancer,
        emailsSentClient,
        notificationsCreated,
      },
    });

    return NextResponse.json({
      newlyOverdue: newlyOverdue.length,
      overdueCount: overdueInvoices.length,
      emailsSentFreelancer,
      emailsSentClient,
      notificationsCreated,
    });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
