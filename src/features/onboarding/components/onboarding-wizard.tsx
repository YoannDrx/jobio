"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Circle,
  Briefcase,
  ListOrdered,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { dismissOnboardingAction } from "@/features/onboarding/onboarding.action";
import { useState } from "react";
import { toast } from "sonner";

type OnboardingWizardProps = {
  status: {
    hasProfile: boolean;
    hasPlatforms: boolean;
    hasMission: boolean;
    hasSequence: boolean;
    isDismissed: boolean;
  };
};

export function OnboardingWizard({ status }: OnboardingWizardProps) {
  const [dismissed, setDismissed] = useState(status.isDismissed);

  const steps = [
    {
      icon: Settings,
      title: "Crée ton profil",
      description: "Configure ton profil freelance et tes spécialisations",
      href: "/app/profiles",
      completed: status.hasProfile,
    },
    {
      icon: Circle,
      title: "Sélectionne tes plateformes",
      description: "Ajoute les plateformes où tu prospèctes",
      href: "/app/platforms",
      completed: status.hasPlatforms,
    },
    {
      icon: Briefcase,
      title: "Capture ta première mission",
      description: "Ajoute une mission pour commencer le suivi",
      href: "/app/pipeline",
      completed: status.hasMission,
    },
    {
      icon: ListOrdered,
      title: "Crée ta première séquence de relance",
      description: "Automatise tes relances avec une séquence personnalisée",
      href: "/app/sequences",
      completed: status.hasSequence,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const isComplete = completedCount === totalSteps;

  if (dismissed || isComplete) {
    return null;
  }

  const handleDismiss = async () => {
    try {
      await resolveActionResult(dismissOnboardingAction());
      setDismissed(true);
    } catch {
      toast.error("Erreur lors de la fermeture");
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">
            Pour bien démarrer ({completedCount}/{totalSteps})
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => void handleDismiss()}
          >
            <X className="size-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${(completedCount / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link key={index} href={step.href}>
              <div className="hover:bg-muted/50 flex cursor-pointer gap-4 rounded-lg border p-4 transition-colors">
                <div className="flex flex-shrink-0 items-center justify-center">
                  {step.completed ? (
                    <CheckCircle2 className="size-6 text-green-500" />
                  ) : (
                    <Icon className="text-muted-foreground size-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
                {step.completed ? (
                  <Zap className="size-5 flex-shrink-0 text-green-500" />
                ) : (
                  <div className="text-muted-foreground flex-shrink-0">→</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
