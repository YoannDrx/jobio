"use server";

import { AI_MODELS } from "@/features/ai/ai-config";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { BillingInvoiceStatus, BillingPaymentStatus } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import {
  getPlanLimitsForPlan,
  resolvePlanLimitsForUser,
} from "@/lib/auth/stripe/plan-entitlements";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";

const generateBillingForecastInputSchema = z.object({}).optional();

const billingForecastOutputSchema = z.object({
  summary: z.string().min(20).max(700),
  forecastInvoicedEur: z.number().min(0).max(10_000_000),
  forecastCollectedEur: z.number().min(0).max(10_000_000),
  confidence: z.enum(["low", "medium", "high"]),
  risks: z.array(z.string().min(5).max(220)).max(5),
  recommendations: z.array(z.string().min(5).max(220)).min(2).max(6),
});

type MonthPoint = {
  key: string;
  label: string;
  invoicedCents: number;
  collectedCents: number;
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date: Date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "2-digit",
  }).format(date);
};

const buildMonthWindow = (count: number) => {
  const now = new Date();
  const months: Date[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    months.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
  }

  return months;
};

export const generateFreelanceBillingForecastAction = authAction
  .inputSchema(generateBillingForecastInputSchema)
  .action(async ({ ctx: { user } }) => {
    const [{ limits: planLimits }, freePlanLimits] = await Promise.all([
      resolvePlanLimitsForUser(user.id),
      getPlanLimitsForPlan("free"),
    ]);
    if (planLimits.aiRequestsPerMonth <= freePlanLimits.aiRequestsPerMonth) {
      throw new ApplicationError(
        "Projection IA disponible à partir du plan Pro.",
      );
    }

    await checkAndIncrementAIQuota(user.id);

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const monthWindow = buildMonthWindow(6);
    const fromDate =
      monthWindow[0] ?? new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [invoices, payments, quotesToValidate, overdueCount, outstandingAgg] =
      await Promise.all([
        prisma.billingInvoice.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            status: {
              not: BillingInvoiceStatus.CANCELLED,
            },
            issueDate: {
              gte: fromDate,
            },
          },
          select: {
            issueDate: true,
            totalCents: true,
            balanceCents: true,
            status: true,
          },
        }),
        prisma.billingPayment.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            status: BillingPaymentStatus.CONFIRMED,
            paidAt: {
              gte: fromDate,
            },
          },
          select: {
            paidAt: true,
            amountCents: true,
          },
        }),
        prisma.billingQuote.count({
          where: {
            userId: user.id,
            deletedAt: null,
            status: "SENT",
          },
        }),
        prisma.billingInvoice.count({
          where: {
            userId: user.id,
            deletedAt: null,
            status: BillingInvoiceStatus.OVERDUE,
            balanceCents: {
              gt: 0,
            },
          },
        }),
        prisma.billingInvoice.aggregate({
          where: {
            userId: user.id,
            deletedAt: null,
            status: {
              in: [
                BillingInvoiceStatus.ISSUED,
                BillingInvoiceStatus.PARTIALLY_PAID,
                BillingInvoiceStatus.OVERDUE,
              ],
            },
          },
          _sum: {
            balanceCents: true,
          },
        }),
      ]);

    const byMonth = new Map<string, MonthPoint>();

    for (const month of monthWindow) {
      const key = monthKey(month);
      byMonth.set(key, {
        key,
        label: monthLabel(month),
        invoicedCents: 0,
        collectedCents: 0,
      });
    }

    for (const invoice of invoices) {
      const key = monthKey(invoice.issueDate);
      const month = byMonth.get(key);
      if (!month) {
        continue;
      }
      month.invoicedCents += invoice.totalCents;
    }

    for (const payment of payments) {
      const key = monthKey(payment.paidAt);
      const month = byMonth.get(key);
      if (!month) {
        continue;
      }
      month.collectedCents += payment.amountCents;
    }

    const monthlySeries = Array.from(byMonth.values());

    const invoicedLast90Cents = invoices
      .filter((invoice) => invoice.issueDate >= ninetyDaysAgo)
      .reduce((total, invoice) => total + invoice.totalCents, 0);

    const collectedLast90Cents = payments
      .filter((payment) => payment.paidAt >= ninetyDaysAgo)
      .reduce((total, payment) => total + payment.amountCents, 0);

    const outstandingCents = outstandingAgg._sum.balanceCents ?? 0;
    const collectionRate =
      invoicedLast90Cents === 0
        ? 0
        : Math.min(1, Math.max(0, collectedLast90Cents / invoicedLast90Cents));

    const averageMonthlyInvoicedCents =
      monthlySeries.length === 0
        ? 0
        : Math.round(
            monthlySeries.reduce(
              (total, month) => total + month.invoicedCents,
              0,
            ) / monthlySeries.length,
          );

    const fallbackForecastInvoicedEur = Math.max(
      0,
      Math.round((averageMonthlyInvoicedCents * 3) / 100),
    );

    const fallbackForecastCollectedEur = Math.max(
      0,
      Math.round(
        (averageMonthlyInvoicedCents * 3 * Math.max(collectionRate, 0.45)) /
          100,
      ),
    );

    const prompt = `
Tu es un expert finance/ops pour freelances en France.
Tu dois produire une projection opérationnelle réaliste sur les 90 prochains jours.
Réponse en français, courte, concrète, orientée décision.

Contexte (en centimes sauf mention):
- CA facturé 90j: ${invoicedLast90Cents}
- CA encaissé 90j: ${collectedLast90Cents}
- Encours à encaisser: ${outstandingCents}
- Taux d'encaissement observé: ${(collectionRate * 100).toFixed(1)}%
- Devis en attente (SENT): ${quotesToValidate}
- Factures en retard: ${overdueCount}
- Série mensuelle sur 6 mois: ${JSON.stringify(monthlySeries)}

Contraintes:
- Sois prudent si l'encours et les retards sont élevés.
- Les recommandations doivent être exécutables sous 7 jours.
- forecastInvoicedEur et forecastCollectedEur sont des montants en euros sur les 90 prochains jours.
`.trim();

    try {
      const result = await generateObject({
        model: AI_MODELS.fast,
        schema: billingForecastOutputSchema,
        prompt,
        temperature: 0.2,
      });

      await prisma.aIUsage.create({
        data: {
          userId: user.id,
          feature: "BILLING_FORECAST",
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        },
      });

      return {
        generatedAt: new Date().toISOString(),
        metrics: {
          invoicedLast90Cents,
          collectedLast90Cents,
          outstandingCents,
          quotesToValidate,
          overdueCount,
          collectionRate,
        },
        monthlySeries,
        forecast: result.object,
      };
    } catch {
      return {
        generatedAt: new Date().toISOString(),
        metrics: {
          invoicedLast90Cents,
          collectedLast90Cents,
          outstandingCents,
          quotesToValidate,
          overdueCount,
          collectionRate,
        },
        monthlySeries,
        forecast: {
          summary:
            "Projection générée en mode de secours: stabiliser l'encaissement et convertir rapidement les devis en attente.",
          forecastInvoicedEur: fallbackForecastInvoicedEur,
          forecastCollectedEur: fallbackForecastCollectedEur,
          confidence: "medium" as const,
          risks: [
            "Retards de paiement susceptibles d'augmenter la tension de trésorerie.",
            "Pipeline de devis insuffisamment converti en factures émises.",
          ],
          recommendations: [
            "Prioriser les relances sur les factures en retard avec un plan de suivi à J+2/J+5.",
            "Émettre immédiatement les factures brouillon et verrouiller une date d'échéance claire.",
            "Activer un suivi hebdomadaire du taux d'encaissement et ajuster les délais client à risque.",
          ],
        },
      };
    }
  });
