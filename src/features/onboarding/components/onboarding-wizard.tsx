"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Briefcase, Settings, Zap } from "lucide-react";

type OnboardingWizardProps = {
  status: {
    hasProfile: boolean;
    hasPlatforms: boolean;
    hasMission: boolean;
  };
};

export function OnboardingWizard({ status }: OnboardingWizardProps) {
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
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const isComplete = completedCount === 3;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Onboarding</h3>
          {isComplete && (
            <span className="text-sm font-medium text-green-600">Complété</span>
          )}
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link key={index} href={step.href}>
              <div className="hover:bg-muted/50 flex cursor-pointer gap-4 rounded-lg border p-4 transition-colors">
                <div className="flex flex-shrink-0 items-center justify-center">
                  {step.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Icon className="text-muted-foreground h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
                {step.completed ? (
                  <Zap className="h-5 w-5 flex-shrink-0 text-green-500" />
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
