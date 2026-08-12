"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Settings,
  Users,
  BookText,
  Receipt,
  HandCoins,
  BarChart3,
  X,
  Zap,
} from "lucide-react";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { dismissFreelanceOnboardingAction } from "@/features/freelance/onboarding/freelance-onboarding.action";
import { useState } from "react";
import { toast } from "sonner";

type FreelanceOnboardingWizardProps = {
  status: {
    hasProfile: boolean;
    hasClient: boolean;
    hasCatalogItem: boolean;
    hasIssuedInvoice: boolean;
    hasPayment: boolean;
    hasUrssafConfig: boolean;
    completedSteps: number;
    totalSteps: number;
    isDismissed: boolean;
    isComplete: boolean;
  };
};

export function FreelanceOnboardingWizard({
  status,
}: FreelanceOnboardingWizardProps) {
  const [dismissed, setDismissed] = useState(status.isDismissed);

  const configurationSteps = [
    {
      icon: Settings,
      title: "Configure ton profil de facturation",
      description:
        "Renseigne tes informations légales, SIRET et coordonnées bancaires",
      href: "/job/gestion/settings",
      completed: status.hasProfile,
    },
    {
      icon: Users,
      title: "Ajoute ton premier client",
      description: "Crée un client pour pouvoir émettre des devis et factures",
      href: "/job/gestion/clients",
      completed: status.hasClient,
    },
    {
      icon: BookText,
      title: "Crée un article au catalogue",
      description:
        "Ajoute une prestation type pour gagner du temps sur tes documents",
      href: "/job/gestion/catalog",
      completed: status.hasCatalogItem,
    },
  ];

  const billingCycleSteps = [
    {
      icon: Receipt,
      title: "Émets ta première facture",
      description:
        "Crée et émets une facture pour valider ton workflow complet",
      href: "/job/gestion/invoices",
      completed: status.hasIssuedInvoice,
    },
    {
      icon: HandCoins,
      title: "Enregistre un premier paiement",
      description:
        "Confirme un règlement reçu pour boucler le cycle facturation",
      href: "/job/gestion/payments",
      completed: status.hasPayment,
    },
    {
      icon: BarChart3,
      title: "Configure tes déclarations URSSAF",
      description: "Définis ton type de déclaration et ton taux de cotisation",
      href: "/job/gestion/insights",
      completed: status.hasUrssafConfig,
    },
  ];

  const steps = [...configurationSteps, ...billingCycleSteps];
  const completedCount = status.completedSteps;
  const totalSteps = status.totalSteps;
  const isComplete = completedCount === totalSteps;
  const nextStep = steps.find((step) => !step.completed);

  if (dismissed || isComplete) {
    return null;
  }

  const handleDismiss = async () => {
    try {
      await resolveActionResult(dismissFreelanceOnboardingAction());
      setDismissed(true);
    } catch {
      toast.error("Erreur lors de la fermeture");
    }
  };

  const renderStep = (
    step: (typeof steps)[number],
    index: number,
    keyPrefix: string,
  ) => {
    const Icon = step.icon;
    return (
      <Link key={`${keyPrefix}-${index}`} href={step.href}>
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
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
          {step.completed ? (
            <Zap className="size-5 flex-shrink-0 text-green-500" />
          ) : (
            <div className="text-muted-foreground flex-shrink-0">→</div>
          )}
        </div>
      </Link>
    );
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

      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
            Configuration
          </p>
          <div className="flex flex-col gap-3">
            {configurationSteps.map((step, index) =>
              renderStep(step, index, "config"),
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
            Premier cycle de facturation
          </p>
          <div className="flex flex-col gap-3">
            {billingCycleSteps.map((step, index) =>
              renderStep(step, index, "billing"),
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
