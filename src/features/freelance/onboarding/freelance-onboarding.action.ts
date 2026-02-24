"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getFreelanceOnboardingStatusAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [
      billingProfile,
      clientCount,
      catalogItemCount,
      issuedInvoiceCount,
      paymentCount,
      userData,
    ] = await Promise.all([
      prisma.billingProfile.findUnique({
        where: { userId: user.id },
        select: {
          legalName: true,
          siret: true,
          urssafDeclarationType: true,
        },
      }),
      prisma.billingClient.count({
        where: { userId: user.id, deletedAt: null },
      }),
      prisma.billingCatalogItem.count({
        where: { userId: user.id },
      }),
      prisma.billingInvoice.count({
        where: { userId: user.id, deletedAt: null, status: { not: "DRAFT" } },
      }),
      prisma.billingPayment.count({
        where: { userId: user.id, deletedAt: null },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { freelanceOnboardingDismissed: true },
      }),
    ]);

    const hasProfile = Boolean(
      billingProfile?.legalName && billingProfile.siret,
    );
    const hasClient = clientCount > 0;
    const hasCatalogItem = catalogItemCount > 0;
    const hasIssuedInvoice = issuedInvoiceCount > 0;
    const hasPayment = paymentCount > 0;
    const hasUrssafConfig = Boolean(billingProfile?.urssafDeclarationType);

    const completedSteps = [
      hasProfile,
      hasClient,
      hasCatalogItem,
      hasIssuedInvoice,
      hasPayment,
      hasUrssafConfig,
    ].filter(Boolean).length;

    const totalSteps = 6;
    const isComplete = completedSteps === totalSteps;

    return {
      hasProfile,
      hasClient,
      hasCatalogItem,
      hasIssuedInvoice,
      hasPayment,
      hasUrssafConfig,
      completedSteps,
      totalSteps,
      isDismissed: userData?.freelanceOnboardingDismissed ?? false,
      isComplete,
    };
  },
);

export const dismissFreelanceOnboardingAction = authAction
  .inputSchema(z.void())
  .action(async ({ ctx: { user } }) => {
    await prisma.user.update({
      where: { id: user.id },
      data: { freelanceOnboardingDismissed: true },
    });
    return { success: true };
  });
