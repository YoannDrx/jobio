import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { HeroShowcase } from "./hero-showcase";

export function HeroSection() {
  const analyticsHistoryDays = getPlanLimits("pro").analyticsHistoryDays;

  return (
    <section className="relative isolate">
      <div className="relative flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center overflow-hidden px-6 lg:px-8">
        <div className="bg-brand-cyan/25 pointer-events-none absolute top-20 left-[8%] size-64 rounded-full blur-[90px]" />
        <div className="pointer-events-none absolute top-40 right-[10%] size-72 rounded-full bg-emerald-500/25 blur-[90px]" />
        <div className="pointer-events-none absolute bottom-20 left-1/3 size-80 rounded-full bg-amber-500/20 blur-[90px]" />

        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">
            Le cockpit commercial des freelances tech
          </Badge>

          <div className="mt-6">
            <h1 className="text-5xl font-bold tracking-tight text-balance sm:text-7xl">
              Trouve. Relance. Signe.
            </h1>
          </div>

          <p className="text-muted-foreground mt-6 text-lg font-medium text-pretty sm:text-xl/8">
            Jobio structure ton pipeline freelance pour que chaque opportunité
            devienne un contrat.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/auth/signup"
              className={buttonVariants({ size: "lg", variant: "default" })}
            >
              <span className="inline-flex items-center gap-2">
                Commencer gratuitement
                <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link
              href="#features"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Voir les fonctionnalités
            </Link>
          </div>

          <p className="text-muted-foreground mt-6 text-sm font-medium">
            Gratuit pour commencer · Setup en 2 min · Tes données restent les
            tiennes
          </p>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <ChevronDown className="text-muted-foreground/50 size-6" />
        </div>
      </div>

      <HeroShowcase analyticsHistoryDays={analyticsHistoryDays} />
    </section>
  );
}
