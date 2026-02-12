"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Briefcase,
  ListOrdered,
  Mail,
  MessageCircle,
  UserRound,
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
    hasContact: boolean;
    hasFollowUp: boolean;
    hasSentEmail: boolean;
    completedSteps: number;
    totalSteps: number;
    extendedChecklistEnabled?: boolean;
    isDismissed: boolean;
  };
};

export function OnboardingWizard({ status }: OnboardingWizardProps) {
  const [dismissed, setDismissed] = useState(status.isDismissed);

  const foundationSteps = [
    {
      icon: Settings,
      title: "Crée ton profil",
      description: "Configure ton profil freelance et tes spécialisations",
      href: "/app/profiles",
      completed: status.hasProfile,
    },
    {
      icon: Settings,
      title: "Sélectionne tes plateformes",
      description: "Ajoute les plateformes où tu prospèctes",
      href: "/app/prospection",
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

  const activationSteps = [
    {
      icon: UserRound,
      title: "Associe un contact",
      description: "Crée un contact lié à une mission active",
      href: "/app/contacts",
      completed: status.hasContact,
    },
    {
      icon: MessageCircle,
      title: "Planifie une relance",
      description: "Ajoute une relance pour matérialiser ton process",
      href: "/app/follow-ups",
      completed: status.hasFollowUp,
    },
    {
      icon: Mail,
      title: "Envoie un premier email",
      description: "Valide le cycle complet mission → action → envoi",
      href: "/app/emails",
      completed: status.hasSentEmail,
    },
  ];

  const showActivation = status.extendedChecklistEnabled ?? true;
  const steps = showActivation
    ? [...foundationSteps, ...activationSteps]
    : foundationSteps;
  const completedCount = status.completedSteps;
  const totalSteps = status.totalSteps;
  const isComplete = completedCount === totalSteps;
  const nextStep = steps.find((step) => !step.completed);

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

      {nextStep ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/10">
          <p className="text-sm font-medium">
            Prochaine priorité: {nextStep.title}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {nextStep.description}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
            Fondations
          </p>
          <div className="flex flex-col gap-3">
            {foundationSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Link key={`foundation-${index}`} href={step.href}>
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
                      <div className="text-muted-foreground flex-shrink-0">
                        →
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {showActivation ? (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
              Activation commerciale
            </p>
            <div className="flex flex-col gap-3">
              {activationSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Link key={`activation-${index}`} href={step.href}>
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
                        <div className="text-muted-foreground flex-shrink-0">
                          →
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
