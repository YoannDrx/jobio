"use server";

import { PricingFunnelEventType } from "@/generated/prisma";
import { action } from "@/lib/actions/safe-actions";
import { getSession } from "@/lib/auth/auth-user";
import { capturePricingFunnelEvent } from "@/lib/pricing/pricing-funnel-events";
import { z } from "zod";

const pricingFunnelEventSchema = z.object({
  eventType: z.nativeEnum(PricingFunnelEventType),
  planCurrent: z.string().min(2).max(32).optional(),
  planTarget: z.string().min(2).max(32).optional(),
  billingCycle: z.string().min(2).max(16).optional(),
  entryPoint: z.string().min(2).max(64).optional(),
  featureKey: z.string().min(2).max(64).optional(),
  experimentVariant: z.string().min(2).max(32).optional(),
});

export const recordPricingFunnelEventAction = action
  .inputSchema(pricingFunnelEventSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession();

    await capturePricingFunnelEvent({
      eventType: parsedInput.eventType,
      userId: session?.user.id ?? null,
      planCurrent: parsedInput.planCurrent ?? null,
      planTarget: parsedInput.planTarget ?? null,
      billingCycle: parsedInput.billingCycle ?? null,
      entryPoint: parsedInput.entryPoint ?? null,
      featureKey: parsedInput.featureKey ?? null,
      experimentVariant: parsedInput.experimentVariant ?? null,
    });

    return {
      success: true,
    };
  });
