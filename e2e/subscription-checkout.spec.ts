import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import Stripe from "stripe";
import { createTestAccount } from "./utils/auth-test";

test.describe("subscription checkout", { tag: "@external" }, () => {
  test("create a compliant Checkout session and activate Pro through Stripe webhooks", async ({
    page,
  }) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    expect(stripeSecretKey, "STRIPE_SECRET_KEY must use a sandbox key").toMatch(
      /^sk_test_/,
    );
    if (!stripeSecretKey?.startsWith("sk_test_")) {
      throw new Error("STRIPE_SECRET_KEY must use a sandbox key");
    }
    const stripe = new Stripe(stripeSecretKey, { typescript: true });
    const userData = await createTestAccount({
      page,
      callbackURL: "/account/billing",
    });

    try {
      await page.goto("/account/billing");
      await page.getByRole("button", { name: "Choisir Pro mensuel" }).click();
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });

      const checkoutSessionId = new URL(page.url()).pathname.match(
        /cs_test_[^/#]+/,
      )?.[0];
      expect(checkoutSessionId).toBeTruthy();
      if (!checkoutSessionId) {
        throw new Error("Stripe Checkout session id is missing from the URL");
      }

      const checkoutSession =
        await stripe.checkout.sessions.retrieve(checkoutSessionId);
      expect(checkoutSession).toMatchObject({
        mode: "subscription",
        billing_address_collection: "required",
        automatic_tax: { enabled: true },
        tax_id_collection: { enabled: true },
        metadata: {
          plan: "pro",
          billingCycle: "monthly",
        },
      });
      expect(checkoutSession.customer).toBeTruthy();
      if (!checkoutSession.customer) {
        throw new Error("Stripe Checkout customer is missing");
      }

      const customerId =
        typeof checkoutSession.customer === "string"
          ? checkoutSession.customer
          : checkoutSession.customer.id;
      const lineItems = await stripe.checkout.sessions.listLineItems(
        checkoutSession.id,
        { limit: 1 },
      );
      expect(lineItems.data[0]?.price?.lookup_key).toBe("jobio_pro_monthly_v1");
      const price = lineItems.data[0]?.price;
      if (!price) {
        throw new Error("Stripe Checkout price is missing");
      }
      const checkoutUserId = checkoutSession.metadata?.userId;
      if (!checkoutUserId) {
        throw new Error("Stripe Checkout user metadata is missing");
      }

      // Stripe explicitly prevents browser automation of Checkout. Create the
      // equivalent sandbox subscription through the API so the real Stripe
      // event stream, signature verification and webhook handler are tested.
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token: "tok_visa" },
      });
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });
      await stripe.customers.update(customerId, {
        address: {
          line1: "1 rue de Test",
          postal_code: "75001",
          city: "Paris",
          country: "FR",
        },
        invoice_settings: { default_payment_method: paymentMethod.id },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        default_payment_method: paymentMethod.id,
        metadata: {
          app: "jobio",
          userId: checkoutUserId,
          plan: "pro",
          billingCycle: "monthly",
          entryPoint: "playwright_stripe_api",
          experimentVariant: "control",
        },
      });
      expect(subscription.status).toBe("active");

      await expect
        .poll(
          async () =>
            prisma.subscription.findFirst({
              where: { user: { email: userData.email } },
            }),
          { timeout: 45000 },
        )
        .toMatchObject({
          plan: "pro",
          status: "active",
          stripeSubscriptionId: subscription.id,
        });
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { subscription: true },
      });

      if (user) {
        if (user.subscription?.stripeSubscriptionId) {
          await stripe.subscriptions.cancel(
            user.subscription.stripeSubscriptionId,
          );
          await expect
            .poll(
              async () =>
                prisma.subscription.findUnique({
                  where: { referenceId: user.id },
                  select: { status: true },
                }),
              { timeout: 30000 },
            )
            .toMatchObject({ status: "canceled" });
        }
        if (user.stripeCustomerId) {
          await stripe.customers.del(user.stripeCustomerId);
        }

        await prisma.user.delete({ where: { id: user.id } });
      }
    }
  });
});
