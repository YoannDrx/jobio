"use server";

import { authAction, rateLimitedAuthAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerUrl } from "@/lib/server-url";
import {
  getProgramCatalogEntry,
  getProgramStripePriceId,
  PROGRAM_PRICE,
} from "@/lib/stripe/billing-catalog";
import {
  getProgramDetailSchema,
  unlockFreeProgramSchema,
  createProgramCheckoutSchema,
  getLinkedInTemplateSchema,
  verifyProgramPurchaseSchema,
} from "./programmes.schema";

const getCheckoutSuccessUrl = (path: string) => {
  const separator = path.includes("?") ? "&" : "?";
  return `${getServerUrl()}${path}${separator}session_id={CHECKOUT_SESSION_ID}`;
};

export const getProgrammesAction = authAction.action(
  async ({ ctx: { user } }) => {
    const programs = await prisma.linkedInProgram.findMany({
      orderBy: { order: "asc" },
      include: {
        purchases: {
          where: { userId: user.id, status: "completed" },
          select: { id: true },
        },
      },
    });

    return programs.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      authorName: p.authorName,
      authorImage: p.authorImage,
      price: p.price,
      currency: p.currency,
      isFree: p.isFree,
      templateCount: p.templateCount,
      coverImage: p.coverImage,
      order: p.order,
      isUnlocked: p.purchases.length > 0,
    }));
  },
);

export const getProgramDetailAction = authAction
  .inputSchema(getProgramDetailSchema)
  .action(async ({ parsedInput: { slug }, ctx: { user } }) => {
    const program = await prisma.linkedInProgram.findUnique({
      where: { slug },
      include: {
        templates: { orderBy: { order: "asc" } },
        purchases: {
          where: { userId: user.id, status: "completed" },
          select: { id: true },
        },
      },
    });

    if (!program) {
      throw new ActionError("Programme introuvable");
    }

    const isUnlocked = program.purchases.length > 0;

    return {
      id: program.id,
      slug: program.slug,
      title: program.title,
      description: program.description,
      longDescription: program.longDescription,
      authorName: program.authorName,
      authorImage: program.authorImage,
      price: program.price,
      currency: program.currency,
      isFree: program.isFree,
      templateCount: program.templateCount,
      coverImage: program.coverImage,
      isUnlocked,
      templates: program.templates.map((t) => ({
        id: t.id,
        title: t.title,
        hook: t.hook,
        body: isUnlocked ? t.body : null,
        tips: isUnlocked ? t.tips : null,
        category: t.category,
        order: t.order,
      })),
    };
  });

export const unlockFreeProgramAction = authAction
  .inputSchema(unlockFreeProgramSchema)
  .action(async ({ parsedInput: { programId }, ctx: { user } }) => {
    const program = await prisma.linkedInProgram.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new ActionError("Programme introuvable");
    }

    if (!program.isFree) {
      throw new ActionError("Ce programme n'est pas gratuit");
    }

    await prisma.programPurchase.upsert({
      where: {
        userId_programId: { userId: user.id, programId },
      },
      update: { status: "completed" },
      create: {
        userId: user.id,
        programId,
        status: "completed",
        amount: 0,
        currency: "eur",
      },
    });

    return { success: true };
  });

export const createProgramCheckoutAction = rateLimitedAuthAction(
  "program-checkout",
  5,
  300,
)
  .inputSchema(createProgramCheckoutSchema)
  .action(
    async ({
      parsedInput: { programId, successUrl, cancelUrl },
      ctx: { user },
    }) => {
      const program = await prisma.linkedInProgram.findUnique({
        where: { id: programId },
      });

      if (!program) throw new ActionError("Programme introuvable");
      if (program.isFree) throw new ActionError("Ce programme est gratuit");
      const stripePriceId = getProgramStripePriceId(program.slug);
      if (!stripePriceId) throw new ActionError("Prix Stripe non configuré");

      const catalogEntry = getProgramCatalogEntry(program.slug);
      if (!catalogEntry) {
        throw new ActionError("Programme payant absent du catalogue Jobio");
      }

      const stripePrice = await stripe.prices.retrieve(stripePriceId);
      if (
        !stripePrice.active ||
        stripePrice.type !== "one_time" ||
        stripePrice.lookup_key !== catalogEntry.sku ||
        stripePrice.unit_amount !== PROGRAM_PRICE.unitAmount ||
        stripePrice.currency !== PROGRAM_PRICE.currency ||
        stripePrice.tax_behavior !== PROGRAM_PRICE.taxBehavior ||
        stripePrice.metadata.slug !== program.slug
      ) {
        throw new ActionError(
          "Ce programme est temporairement indisponible. Réessaie plus tard.",
        );
      }

      // Check if already purchased
      const existing = await prisma.programPurchase.findUnique({
        where: { userId_programId: { userId: user.id, programId } },
      });
      if (existing?.status === "completed") {
        throw new ActionError("Programme déjà acheté");
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true, email: true },
      });

      const session = await stripe.checkout.sessions.create({
        customer: dbUser?.stripeCustomerId ?? undefined,
        customer_email: !dbUser?.stripeCustomerId
          ? (dbUser?.email ?? undefined)
          : undefined,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        mode: "payment",
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        tax_id_collection: { enabled: true },
        customer_update: dbUser?.stripeCustomerId
          ? { address: "auto", name: "auto" }
          : undefined,
        custom_text: {
          submit: {
            message:
              "Paiement sécurisé pour Jobio, service édité par Yodev — Yoann Andrieux. Prix hors taxes ; le total est confirmé avant paiement.",
          },
        },
        success_url: getCheckoutSuccessUrl(successUrl),
        cancel_url: `${getServerUrl()}${cancelUrl}`,
        metadata: {
          type: "linkedin_program",
          programId: program.id,
          userId: user.id,
          slug: program.slug,
          sku: catalogEntry.sku,
          catalogVersion: "1",
        },
      });

      if (!session.url)
        throw new ActionError(
          "Erreur lors de la création de la session de paiement",
        );

      return { url: session.url };
    },
  );

export const getLinkedInTemplateAction = authAction
  .inputSchema(getLinkedInTemplateSchema)
  .action(async ({ parsedInput: { templateId }, ctx: { user } }) => {
    const template = await prisma.linkedInTemplate.findUnique({
      where: { id: templateId },
      include: {
        program: {
          include: {
            purchases: {
              where: { userId: user.id, status: "completed" },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!template) throw new ActionError("Template introuvable");

    const isUnlocked = template.program.purchases.length > 0;

    return {
      id: template.id,
      title: template.title,
      hook: template.hook,
      body: isUnlocked ? template.body : null,
      tips: isUnlocked ? template.tips : null,
      category: template.category,
      programTitle: template.program.title,
      isUnlocked,
    };
  });

export const verifyProgramPurchaseAction = authAction
  .inputSchema(verifyProgramPurchaseSchema)
  .action(async ({ parsedInput: { sessionId }, ctx: { user } }) => {
    const purchase = await prisma.programPurchase.findFirst({
      where: { stripeSessionId: sessionId, userId: user.id },
      include: { program: { select: { slug: true, title: true } } },
    });

    if (!purchase) {
      // Webhook may not have processed yet, check Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      const metadata = session.metadata;
      const programId = metadata?.programId;
      if (
        metadata &&
        session.mode === "payment" &&
        metadata.type === "linkedin_program" &&
        metadata.userId === user.id &&
        session.payment_status === "paid" &&
        session.amount_subtotal === PROGRAM_PRICE.unitAmount &&
        session.currency === PROGRAM_PRICE.currency &&
        programId
      ) {
        const completed = await prisma.programPurchase.upsert({
          where: {
            userId_programId: {
              userId: user.id,
              programId,
            },
          },
          update: {
            status: "completed",
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
            amount: session.amount_subtotal,
            currency: session.currency,
          },
          create: {
            userId: user.id,
            programId,
            status: "completed",
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
            amount: session.amount_subtotal,
            currency: session.currency,
          },
          include: { program: { select: { slug: true, title: true } } },
        });

        return {
          status: completed.status,
          programSlug: completed.program.slug,
          programTitle: completed.program.title,
        };
      }

      throw new ActionError("Achat introuvable");
    }

    return {
      status: purchase.status,
      programSlug: purchase.program.slug,
      programTitle: purchase.program.title,
    };
  });
