"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PricingFunnelEventNames } from "@/lib/pricing/pricing-funnel-event-names";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { cn } from "@/lib/utils";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PricingCard } from "./pricing-card";
import { recordPricingFunnelEventAction } from "./pricing-funnel.action";

export function Pricing({ entryPoint = "landing" }: { entryPoint?: string }) {
  const [isYearly, setIsYearly] = useState(false);
  const hasTrackedView = useRef(false);
  const { execute: recordPricingEvent } = useAction(recordPricingFunnelEventAction);

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;

    recordPricingEvent({
      eventType: PricingFunnelEventNames.PRICING_PAGE_VIEWED,
      entryPoint,
      planCurrent: "free",
    });
  }, [entryPoint, recordPricingEvent]);

  const maxYearlyDiscount = Math.max(
    ...AUTH_PLANS.filter((plan) => plan.price > 0 && plan.yearlyPrice)
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
    <section className="from-background to-muted/20 w-full bg-gradient-to-b py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Choisis ton plan
            </h2>
            <p className="text-muted-foreground max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Sélectionne le plan adapté à tes besoins. Change à tout moment.
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

        <div
          className="mt-16 grid gap-8 lg:gap-12"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {AUTH_PLANS.filter((p) => !p.isHidden).map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isYearly={isYearly}
              entryPoint={entryPoint}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Tous les plans incluent l'accès produit. Le niveau de support
            évolue selon le plan.
          </p>
          <p className="text-muted-foreground mt-2">
            Besoin d'un plan sur mesure ?{" "}
            <Link
              href="mailto:hello@jobio.fr"
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
