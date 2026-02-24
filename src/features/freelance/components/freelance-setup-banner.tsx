"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Check } from "lucide-react";
import Link from "next/link";

type Step = {
  number: number;
  label: string;
};

const SETUP_STEPS: Step[] = [
  { number: 1, label: "Informations légales" },
  { number: 2, label: "Coordonnées professionnelles" },
  { number: 3, label: "Préférences documentaires" },
];

type FreelanceSetupBannerProps = {
  completedSteps?: number;
};

export function FreelanceSetupBanner({
  completedSteps = 0,
}: FreelanceSetupBannerProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="text-primary mt-0.5 size-5" />
          </div>

          <div className="flex-grow">
            <h3 className="text-foreground text-sm font-semibold">
              Configure ton profil de facturation
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Pour créer des devis et factures conformes, tu dois d'abord
              renseigner tes informations légales.
            </p>

            <div className="mt-4 space-y-2">
              {SETUP_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex items-center gap-3 text-sm"
                >
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      completedSteps >= step.number
                        ? "bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground border"
                    }`}
                  >
                    {completedSteps >= step.number ? (
                      <Check className="size-3" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={
                      completedSteps >= step.number
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button asChild size="sm" className="gap-2">
                <Link href="/freelance/settings">
                  Configurer maintenant
                  <span className="text-xs">→</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
