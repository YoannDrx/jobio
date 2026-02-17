"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function LinkedInImportGuide() {
  const steps = [
    {
      title: "Ouvre ton profil LinkedIn",
      description:
        'Connecte-toi sur LinkedIn et accède à ton profil en cliquant sur "Voir le profil".',
    },
    {
      title: 'Clique sur "Plus" → "Enregistrer au format PDF"',
      description:
        'Sur ton profil, clique sur le bouton "Plus" (ou "More") situé sous ta photo, puis sélectionne "Enregistrer au format PDF".',
    },
    {
      title: "Télécharge le PDF",
      description:
        "LinkedIn va générer un PDF complet de ton profil. Télécharge-le sur ton ordinateur.",
    },
    {
      title: "Importe le PDF dans Jobio",
      description:
        "Reviens sur l'onglet \"PDF\" et glisse le fichier téléchargé dans la zone d'import.",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          L&apos;export PDF LinkedIn contient toutes les informations de ton
          profil dans un format structuré, ce qui permet une extraction plus
          fiable qu&apos;un simple copier-coller.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3">
            <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
              {index + 1}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
