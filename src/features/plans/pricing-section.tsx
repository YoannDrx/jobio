"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PricingFunnelEventNames } from "@/lib/pricing/pricing-funnel-event-names";
import {
  DEFAULT_PRICING_EXPERIMENT_VARIANT,
  PRICING_EXPERIMENT_QUERY_PARAM,
  PRICING_EXPERIMENT_STORAGE_KEY,
  PRICING_EXPERIMENT_VARIANTS,
  normalizePricingExperimentVariant,
  type PricingExperimentVariant,
} from "@/lib/pricing/pricing-experiments";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { isPlanAvailableForNewSubscription } from "@/config/product-features";
import { cn } from "@/lib/utils";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { SiteConfig } from "@/site-config";
import { PricingCard } from "./pricing-card";
import { recordPricingFunnelEventAction } from "./pricing-funnel.action";

const PRICING_VARIANT_COPY: Record<
  PricingExperimentVariant,
  {
    title: string;
    description: string;
  }
> = {
  control: {
    title: "Choisis ton plan",
    description:
      "Sélectionne le plan adapté à tes besoins. Change à tout moment.",
  },
  value_stack: {
    title: "Un plan qui couvre tout ton flux freelance",
    description:
      "Prospection, CV IA, relances et facturation dans un seul espace de travail.",
  },
  roi_focus: {
    title: "Gagne du temps et sécurise ton chiffre d'affaires",
    description:
      "Passe de la capture mission à la facturation plus vite, avec un pilotage clair.",
  },
};

const PRICING_ENTRY_POINT_QUERY_PARAM = "pe";
const normalizeEntryPoint = (value: string | null): string | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9_-]{2,64}$/.test(normalized)) return null;
  return normalized;
};

const resolvePricingExperimentVariant = (): PricingExperimentVariant => {
  if (typeof window === "undefined") {
    return DEFAULT_PRICING_EXPERIMENT_VARIANT;
  }

  try {
    const fromQuery = normalizePricingExperimentVariant(
      new URLSearchParams(window.location.search).get(
        PRICING_EXPERIMENT_QUERY_PARAM,
      ),
    );
    if (fromQuery) {
      window.localStorage.setItem(PRICING_EXPERIMENT_STORAGE_KEY, fromQuery);
      return fromQuery;
    }

    const fromStorage = normalizePricingExperimentVariant(
      window.localStorage.getItem(PRICING_EXPERIMENT_STORAGE_KEY),
    );
    if (fromStorage) {
      return fromStorage;
    }

    const assigned =
      PRICING_EXPERIMENT_VARIANTS[
        Math.floor(Math.random() * PRICING_EXPERIMENT_VARIANTS.length)
      ];
    window.localStorage.setItem(PRICING_EXPERIMENT_STORAGE_KEY, assigned);
    return assigned;
  } catch {
    return DEFAULT_PRICING_EXPERIMENT_VARIANT;
  }
};

const resolvePricingEntryPoint = (defaultEntryPoint: string): string => {
  if (typeof window === "undefined") {
    return defaultEntryPoint;
  }

  const fromQuery = normalizeEntryPoint(
    new URLSearchParams(window.location.search).get(
      PRICING_ENTRY_POINT_QUERY_PARAM,
    ),
  );
  return fromQuery ?? defaultEntryPoint;
};

export function Pricing({ entryPoint = "landing" }: { entryPoint?: string }) {
  const { ref, isInView, shouldAnimate } = useSectionInView();
  const [isYearly, setIsYearly] = useState(false);
  const [experimentVariant, setExperimentVariant] =
    useState<PricingExperimentVariant | null>(null);
  const [resolvedEntryPoint, setResolvedEntryPoint] = useState(entryPoint);
  const hasTrackedView = useRef(false);
  const { execute: recordPricingEvent } = useAction(
    recordPricingFunnelEventAction,
  );

  useEffect(() => {
    setResolvedEntryPoint(resolvePricingEntryPoint(entryPoint));
    setExperimentVariant(resolvePricingExperimentVariant());
  }, [entryPoint]);

  useEffect(() => {
    if (!experimentVariant) return;
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;

    recordPricingEvent({
      eventType: PricingFunnelEventNames.PRICING_PAGE_VIEWED,
      entryPoint: resolvedEntryPoint,
      planCurrent: "free",
      experimentVariant,
    });
  }, [resolvedEntryPoint, experimentVariant, recordPricingEvent]);

  const copy =
    PRICING_VARIANT_COPY[
      experimentVariant ?? DEFAULT_PRICING_EXPERIMENT_VARIANT
    ];

  const availablePlans = AUTH_PLANS.filter(
    (plan) =>
      !plan.isHidden &&
      (plan.price === 0 || isPlanAvailableForNewSubscription(plan.name)),
  );

  const maxYearlyDiscount = Math.max(
    ...availablePlans
      .filter((plan) => plan.price > 0 && plan.yearlyPrice)
      .map((plan) => {
        const yearlyPrice = plan.yearlyPrice ?? plan.price * 12;
        const annualCost = plan.price * 12;
        if (annualCost <= 0) return 0;
        return Math.round(((annualCost - yearlyPrice) / annualCost) * 100);
      })
      .filter((discount) => discount > 0),
    0,
  );

  return (
    <section
      ref={ref}
      className="from-background to-muted/20 w-full bg-gradient-to-b py-12 md:py-24 lg:py-32"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {copy.title}
            </h2>
            <p className="text-muted-foreground max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {copy.description}
            </p>
          </div>

          <div className="bg-muted/50 mt-8 flex items-center space-x-4 rounded-full p-2">
            <span
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                !isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              Mensuel
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <div
              className={cn(
                "flex items-center rounded-full px-4 py-2 transition-all duration-200",
                isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <span className="text-sm font-medium">Annuel</span>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary ml-2"
              >
                -{maxYearlyDiscount}%
              </Badge>
            </div>
          </div>
        </div>

        <motion.div
          className="mt-16 grid gap-8 lg:gap-12"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
          variants={staggerContainer(0.12)}
          initial={shouldAnimate ? "initial" : "animate"}
          animate={isInView ? "animate" : undefined}
        >
          {availablePlans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              transition={defaultTransition}
            >
              <PricingCard
                plan={plan}
                isYearly={isYearly}
                entryPoint={resolvedEntryPoint}
                experimentVariant={
                  experimentVariant ?? DEFAULT_PRICING_EXPERIMENT_VARIANT
                }
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Tous les plans incluent l'accès produit. Le niveau de support évolue
            selon le plan.
          </p>
          <p className="text-muted-foreground mt-2">
            Besoin d'un plan sur mesure ?{" "}
            <Link
              href={`mailto:${SiteConfig.supportEmail}`}
              className="text-primary font-medium hover:underline"
            >
              Contacte-nous
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
