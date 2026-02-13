"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscribePushSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

const unsubscribePushSchema = z.object({
  endpoint: z.string().url(),
});

export const subscribePushAction = authAction
  .inputSchema(subscribePushSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await prisma.pushSubscription.upsert({
      where: { endpoint: parsedInput.endpoint },
      create: {
        userId: user.id,
        endpoint: parsedInput.endpoint,
        p256dh: parsedInput.p256dh,
        auth: parsedInput.auth,
      },
      update: {
        p256dh: parsedInput.p256dh,
        auth: parsedInput.auth,
      },
    });

    return { subscribed: true };
  });

export const unsubscribePushAction = authAction
  .inputSchema(unsubscribePushSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: parsedInput.endpoint,
        userId: user.id,
      },
    });

    return { unsubscribed: true };
  });

export const getPushStatusAction = authAction.action(
  async ({ ctx: { user } }) => {
    const count = await prisma.pushSubscription.count({
      where: { userId: user.id },
    });

    return { enabled: count > 0 };
  },
);
