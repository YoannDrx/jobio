"use client";

import { Check, Clock } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingButton } from "@/features/form/submit-button";
import { AnalyticsEvents, track } from "@/lib/analytics";
import type { AppAuthPlan } from "@/lib/auth/stripe/auth-plans";
import { useSession } from "@/lib/auth-client";
import { BILLING_URL } from "@/lib/LINKS";
import { PricingFunnelEventNames } from "@/lib/pricing/pricing-funnel-event-names";
import {
  DEFAULT_PRICING_EXPERIMENT_VARIANT,
  type PricingExperimentVariant,
} from "@/lib/pricing/pricing-experiments";
import { cn } from "@/lib/utils";
import { upgradeUserAction } from "./plans.action";
import { recordPricingFunnelEventAction } from "./pricing-funnel.action";

const FEATURES_BY_PLAN = {
  free: [
    "15 missions actives, 30 contacts et 10 entreprises",
    "1 CV avec le template Classic",
    "5 requêtes IA par mois",
    "Relances manuelles et 3 templates",
    "30 jours d’historique analytics",
    "3 clients, 5 devis et 5 factures",
    "Export complet des données",
  ],
  pro: [
    "Missions et plateformes illimitées (fair use)",
    "10 positionnements, 1 000 contacts et 500 entreprises",
    "20 CV, tous les templates, ATS et Coach CV",
    "100 requêtes IA par mois",
    "Relances automatiques, 20 séquences et 100 templates",
    "Analytics sans limite d’historique",
    "Gestion, devis, factures, avoirs et paiements illimités",
    "Support email prioritaire",
  ],
} as const;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

export function PricingCard({
  plan,
  isYearly = false,
  entryPoint = "pricing",
  experimentVariant = DEFAULT_PRICING_EXPERIMENT_VARIANT,
}: {
  plan: AppAuthPlan;
  isYearly?: boolean;
  entryPoint?: string;
  experimentVariant?: PricingExperimentVariant;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const billingCycle = isYearly ? "yearly" : "monthly";
  const yearlyPrice = plan.yearlyPrice ?? plan.price * 12;
  const displayPrice = isYearly ? yearlyPrice / 12 : plan.price;
  const annualSaving = Math.max(0, plan.price * 12 - yearlyPrice);
  const features = FEATURES_BY_PLAN[plan.name as keyof typeof FEATURES_BY_PLAN];

  const { execute: upgradeUser, isPending } = useAction(upgradeUserAction, {
    onSuccess: (result) => {
      if (result.data.url) window.location.href = result.data.url;
    },
    onError: (error) => {
      toast.error(
        error.error.serverError ?? "Impossible d’ouvrir le paiement Stripe.",
      );
    },
  });
  const { execute: recordPricingEvent } = useAction(
    recordPricingFunnelEventAction,
  );

  return (
    <Card
      className={cn(
        "flex h-full flex-col pb-0",
        plan.isPopular && "border-primary relative shadow-lg",
      )}
    >
      {plan.isPopular ? (
        <Badge className="absolute top-5 right-5">Recommandé</Badge>
      ) : null}
      <CardHeader>
        <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tight">
              {formatPrice(displayPrice)} €
            </span>
            <span className="text-muted-foreground">HT/mois</span>
          </div>
          {isYearly && yearlyPrice > 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              Facturé {formatPrice(yearlyPrice)} € HT/an
              {annualSaving > 0
                ? ` — ${formatPrice(annualSaving)} € économisés`
                : ""}
            </p>
          ) : null}
          {plan.freeTrial ? (
            <div className="bg-primary/10 text-primary mt-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium">
              <Clock className="mr-1.5 size-4" />
              {plan.freeTrial.days} jours Pro sans carte
            </div>
          ) : null}
        </div>

        <ul className="flex flex-col gap-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <Check className="text-primary mt-0.5 size-4 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-6 pb-8">
        <LoadingButton
          loading={isPending}
          size="lg"
          className="w-full"
          variant={plan.isPopular ? "default" : "outline"}
          onClick={() => {
            track(AnalyticsEvents.PLAN_SELECTED, {
              plan_target: plan.name,
              billing_cycle: billingCycle,
              entry_point: entryPoint,
              experiment_variant: experimentVariant,
            });
            recordPricingEvent({
              eventType: PricingFunnelEventNames.PLAN_SELECTED,
              planTarget: plan.name,
              billingCycle,
              entryPoint,
              experimentVariant,
            });

            if (plan.price === 0) {
              router.push(session?.user ? "/job" : "/auth/signup");
              return;
            }
            if (!session?.user) {
              router.push("/auth/signup");
              return;
            }
            upgradeUser({
              plan: plan.name,
              annual: isYearly,
              successUrl: `${BILLING_URL}/success`,
              cancelUrl: `${BILLING_URL}/cancel`,
              entryPoint,
              experimentVariant,
            });
          }}
        >
          {plan.price === 0
            ? session?.user
              ? "Accéder à Jobio"
              : "Commencer l’essai Pro"
            : isYearly
              ? "Choisir Pro annuel"
              : "Choisir Pro mensuel"}
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
