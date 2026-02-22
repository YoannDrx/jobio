"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import type { AppAuthPlan } from "@/lib/auth/stripe/auth-plans";
import {
  ADDITIONAL_FEATURES,
  LIMITS_CONFIG,
} from "@/lib/auth/stripe/auth-plans";
import { BILLING_URL } from "@/lib/LINKS";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { LoadingButton } from "../form/submit-button";
import { upgradeUserAction } from "./plans.action";

const BOOLEAN_FEATURES = new Set([
  "cvTemplatesAll",
  "cvCoachAI",
  "atsScoring",
  "autoFollowUps",
  "csvExport",
  "aiEmailGeneration",
  "aiLinkedinAudit",
]);

const NUMERIC_FEATURES = [
  "missions",
  "profiles",
  "contacts",
  "platforms",
  "companies",
  "billingClients",
  "billingQuotes",
  "billingInvoices",
  "billingCatalogItems",
  "aiRequestsPerMonth",
  "analyticsHistoryDays",
  "cvDocuments",
  "sequences",
  "messageTemplates",
];

export function PricingCard({
  plan,
  isYearly,
}: {
  plan: AppAuthPlan;
  isYearly?: boolean;
}) {
  // Get the current user
  const { data: session } = useSession();

  const { execute: upgradeUser, isPending } = useAction(upgradeUserAction, {
    onSuccess: (result) => {
      if (result.data.url) {
        window.location.href = result.data.url;
      }
    },
    onError: (error) => {
      toast.error(error.error.serverError ?? "Failed to upgrade plan");
    },
  });

  // Calculate pricing details
  const monthlyPrice = plan.price;
  const yearlyPrice = plan.yearlyPrice ?? plan.price * 12;
  const displayPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
  const originalPrice = isYearly ? monthlyPrice : null;

  // Calculate discount percentage
  const calculateDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const annualCost = monthlyPrice * 12;
    const discount = ((annualCost - yearlyPrice) / annualCost) * 100;
    return Math.round(discount);
  };

  const discount = calculateDiscount(plan.price, plan.yearlyPrice ?? 0);
  const planLimitEntries = Object.entries(plan.limits) as [string, number][];
  const numericLimitEntries = planLimitEntries.filter(
    ([key, value]) => NUMERIC_FEATURES.includes(key) && value > 0,
  );
  const booleanLimitEntries = planLimitEntries.filter(
    ([key, value]) => BOOLEAN_FEATURES.has(key) && value >= 1,
  );
  const additionalFeatures =
    ADDITIONAL_FEATURES[plan.name as keyof typeof ADDITIONAL_FEATURES];

  return (
    <Card
      className={cn(
        "flex flex-col pb-0 transition-all duration-200 hover:shadow-lg",
        plan.isPopular && "border-primary relative overflow-hidden shadow-md",
      )}
    >
      {plan.isPopular && (
        <div className="absolute top-5 right-0">
          <div className="bg-primary text-primary-foreground rounded-l-full px-4 py-1 text-xs font-semibold">
            Le plus populaire
          </div>
        </div>
      )}

      <CardHeader className={cn("pb-0")}>
        <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
        <CardDescription className="mt-1.5">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-6">
        <div className="mb-8">
          <div className="flex items-baseline">
            <span className="text-5xl font-bold tracking-tight">
              {displayPrice}
            </span>
            <span className="text-3xl font-bold">€</span>
            <span className="text-muted-foreground ml-1.5">/mois</span>
          </div>

          {isYearly && originalPrice !== null && originalPrice > 0 && (
            <div className="mt-2 flex items-center">
              <span className="text-muted-foreground mr-2 line-through">
                {originalPrice}€/mois
              </span>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                Économise {discount}%
              </Badge>
            </div>
          )}

          {isYearly && yearlyPrice > 0 && (
            <p className="text-muted-foreground mt-2 text-sm">
              Facturé {yearlyPrice}€ par an
            </p>
          )}

          {plan.freeTrial && (
            <div className="bg-primary/10 text-primary mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium">
              <Clock className="mr-1.5 size-3.5" />
              {plan.freeTrial.days} jours d'essai gratuit
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h4 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Inclus dans le plan
          </h4>

          <div className="space-y-5">
            {plan.name === "pro" && (
              <p className="text-primary text-sm font-medium italic">
                Tout le plan Free +
              </p>
            )}
            {plan.name === "ultra" && (
              <p className="text-primary text-sm font-medium italic">
                Tout le plan Pro +
              </p>
            )}

            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Capacités
              </p>
              <ul className="space-y-4">
                {numericLimitEntries.map(([key, value]) => {
                  const limitConfig =
                    LIMITS_CONFIG[key as keyof typeof LIMITS_CONFIG];
                  const Icon = limitConfig.icon;

                  return (
                    <li key={key} className="flex items-start">
                      <div className="text-primary mt-0.5 mr-3 size-5 shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {limitConfig.getLabel(value as number)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {limitConfig.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Fonctionnalités incluses
              </p>
              <ul className="space-y-4">
                {booleanLimitEntries.map(([key, value]) => {
                  const limitConfig =
                    LIMITS_CONFIG[key as keyof typeof LIMITS_CONFIG];
                  const Icon = limitConfig.icon;

                  return (
                    <li key={key} className="flex items-start">
                      <div className="text-primary mt-0.5 mr-3 size-5 shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {limitConfig.getLabel(value as number)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {limitConfig.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
                {additionalFeatures.map((feature, index) => {
                  const Icon = feature.icon;

                  return (
                    <li key={index} className="flex items-start">
                      <div className="text-primary mt-0.5 mr-3 size-5 shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium">{feature.label}</p>
                        <p className="text-muted-foreground text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-6 pb-8">
        <LoadingButton
          loading={isPending}
          size="lg"
          className={cn(
            "w-full text-base font-medium",
            plan.isPopular ? "bg-primary hover:bg-primary/90" : "",
          )}
          onClick={() => {
            if (plan.price === 0) {
              if (session?.user) {
                window.location.href = "/job";
                return;
              }
              window.location.href = "/auth/signup";
              return;
            }

            if (!session?.user) {
              toast.error("Connecte-toi pour changer ton plan");
              return;
            }

            upgradeUser({
              plan: plan.name,
              annual: isYearly,
              successUrl: `${BILLING_URL}/success`,
              cancelUrl: `${BILLING_URL}/cancel`,
            });
          }}
        >
          {plan.price === 0
            ? session?.user
              ? "Accéder à Jobio"
              : "Commencer gratuitement"
            : isYearly
              ? "S'abonner à l'année"
              : "S'abonner au mois"}
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
