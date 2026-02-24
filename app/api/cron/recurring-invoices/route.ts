import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { sendEmail } from "@/lib/mail/send-email";
import BillingRecurringGeneratedEmail from "@email/billing-recurring-generated.email";
import { validateCronAuthorization } from "@/lib/security/cron-auth";
import {
  computeDocumentLines,
  computeDocumentTotals,
} from "@/features/freelance/billing-math";
import { computeNextInvoiceDate } from "@/features/freelance/billing-recurring.action";
import { createBillingAuditEvent } from "@/features/freelance/billing-audit";
import type { BillingLineInput } from "@/features/freelance/billing-math";

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "recurring-invoices",
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

    const dueRecurrings = await prisma.billingRecurringInvoice.findMany({
      where: {
        isActive: true,
        nextInvoiceDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
        client: { deletedAt: null },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        client: {
          select: {
            id: true,
            displayName: true,
            paymentTermsInDays: true,
          },
        },
      },
    });

    const results = await Promise.allSettled(
      dueRecurrings.map(async (recurring) => {
        const templateLines = recurring.lines as unknown as BillingLineInput[];
        const computedLines = computeDocumentLines(templateLines);
        const totals = computeDocumentTotals(computedLines);

        const issueDate = new Date();
        const paymentTerms = recurring.client.paymentTermsInDays ?? 30;
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + paymentTerms);

        await prisma.$transaction(async (tx) => {
          const invoice = await tx.billingInvoice.create({
            data: {
              userId: recurring.userId,
              clientId: recurring.clientId,
              status: "DRAFT",
              issueDate,
              dueDate,
              currency: recurring.currency,
              documentTemplate: recurring.documentTemplate,
              notes: recurring.notes,
              terms: recurring.terms,
              subtotalCents: totals.subtotalCents,
              discountCents: totals.discountCents,
              taxCents: totals.taxCents,
              totalCents: totals.totalCents,
              lines: {
                create: computedLines.map((line) => ({
                  position: line.position,
                  description: line.description,
                  quantity: line.quantity,
                  unitPriceCents: line.unitPriceCents,
                  discountPercent: line.discountPercent,
                  vatRatePercent: line.vatRatePercent,
                  subtotalCents: line.subtotalCents,
                  taxCents: line.taxCents,
                  totalCents: line.totalCents,
                })),
              },
            },
          });

          const nextDate = computeNextInvoiceDate(
            recurring.nextInvoiceDate,
            recurring.frequency,
          );

          await tx.billingRecurringInvoice.update({
            where: { id: recurring.id },
            data: {
              generatedCount: { increment: 1 },
              nextInvoiceDate: nextDate,
              lastGeneratedAt: new Date(),
            },
          });

          await createBillingAuditEvent(tx, {
            userId: recurring.userId,
            entityType: "RECURRING_INVOICE",
            entityId: recurring.id,
            eventType: "CREATED",
            message: `Facture brouillon générée depuis récurrence "${recurring.name}"`,
            metadata: { invoiceId: invoice.id },
          });
        });

        const totalFormatted = (totals.totalCents / 100).toLocaleString(
          "fr-FR",
          {
            style: "currency",
            currency: "EUR",
          },
        );

        await sendEmail({
          to: recurring.user.email,
          subject: `Facture récurrente générée : ${recurring.name}`,
          html: BillingRecurringGeneratedEmail({
            freelancerName: recurring.user.name || "Freelancer",
            recurringName: recurring.name,
            clientName: recurring.client.displayName,
            totalFormatted,
            invoicesUrl: `${process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr"}/freelance/invoices`,
          }),
        });
      }),
    );

    const generatedCount = results.filter(
      (r) => r.status === "fulfilled",
    ).length;

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: generatedCount,
      details: {
        dueRecurringsCount: dueRecurrings.length,
        generatedCount,
      },
    });

    return NextResponse.json({
      generated: generatedCount,
      dueCount: dueRecurrings.length,
    });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
