import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import Stripe from "stripe";
import { createTestAccount } from "./utils/auth-test";

test.describe("subscription checkout", () => {
  test.skip(
    process.env.RUN_STRIPE_E2E !== "true",
    "Set RUN_STRIPE_E2E=true with Stripe test credentials and a webhook forwarder.",
  );

  test("create customer, complete checkout and activate Pro", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/account/billing",
    });

    try {
      await page.goto("/account/billing");
      await page.getByRole("button", { name: "S'abonner au mois" }).click();
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });

      await page.locator('input[name="cardNumber"]').fill("4242424242424242");
      await page.locator('input[name="cardExpiry"]').fill("1234");
      await page.locator('input[name="cardCvc"]').fill("123");

      const billingName = page.locator('input[name="billingName"]');
      if (await billingName.isVisible()) {
        await billingName.fill("Jobio Checkout QA");
      }

      await page
        .getByRole("button", { name: /start trial|subscribe|s'abonner|payer/i })
        .click();
      await page.waitForURL(/\/account\/billing\/success/, {
        timeout: 45000,
      });
      await expect(page.getByText("Abonnement réussi !")).toBeVisible();

      await expect
        .poll(
          async () =>
            prisma.subscription.findFirst({
              where: { user: { email: userData.email } },
            }),
          { timeout: 30000 },
        )
        .toMatchObject({ plan: "pro" });
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { subscription: true },
      });

      if (user) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (stripeSecretKey) {
          const stripe = new Stripe(stripeSecretKey, { typescript: true });
          if (user.subscription?.stripeSubscriptionId) {
            await stripe.subscriptions.cancel(
              user.subscription.stripeSubscriptionId,
            );
          }
          if (user.stripeCustomerId) {
            await stripe.customers.del(user.stripeCustomerId);
          }
        }

        await prisma.user.delete({ where: { id: user.id } });
      }
    }
  });
});
