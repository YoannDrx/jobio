"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";

const TOUR_COMPLETED_KEY = "jobio-freelance-tour-completed";
const TOUR_STARTED_KEY = "jobio-freelance-tour-started";

const createTourSteps = () => [
  {
    element: `[data-tour="freelance-welcome"]`,
    popover: {
      title: "Bienvenue sur Freelance Studio",
      description:
        "Ton espace de facturation complet : devis, factures, clients, paiements et suivi URSSAF. Laisse-moi te faire le tour.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: `[data-tour="freelance-dashboard"]`,
    popover: {
      title: "Dashboard",
      description:
        "Ta vue d'ensemble : chiffre d'affaires facturé, encaissements en attente, prochaine échéance URSSAF et conformité de tes documents.",
      side: "right" as const,
    },
  },
  {
    element: `[data-tour="freelance-clients"]`,
    popover: {
      title: "Clients",
      description:
        "Crée et gère ta base clients (entreprises ou particuliers). Tu en auras besoin pour établir devis et factures conformes.",
      side: "right" as const,
    },
  },
  {
    element: `[data-tour="freelance-invoices"]`,
    popover: {
      title: "Factures",
      description:
        "Crée des factures avec l'Invoice Studio et son aperçu A4 en temps réel. Suis leur cycle de vie : Brouillon → Émise → Payée.",
      side: "right" as const,
    },
  },
  {
    element: `[data-tour="freelance-quotes"]`,
    popover: {
      title: "Devis",
      description:
        "Envoie des devis professionnels à tes clients et convertis-les en factures en un clic.",
      side: "right" as const,
    },
  },
  {
    element: `[data-tour="freelance-payments"]`,
    popover: {
      title: "Paiements",
      description:
        "Enregistre les règlements reçus (virement, carte, chèque...) et alloue-les à tes factures pour un suivi précis.",
      side: "right" as const,
    },
  },
  {
    element: `[data-tour="freelance-insights"]`,
    popover: {
      title: "URSSAF & activité",
      description:
        "Suis tes déclarations sociales, ton chiffre d'affaires cumulé, tes charges estimées et les échéances à venir.",
      side: "right" as const,
    },
  },
  {
    popover: {
      title: "C'est parti !",
      description:
        "Configure d'abord ton profil de facturation dans les Paramètres, puis crée ton premier client pour démarrer.",
    },
  },
];

export function FreelanceTour() {
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [hasStartedTour, setHasStartedTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    const started = localStorage.getItem(TOUR_STARTED_KEY);
    setHasCompletedTour(completed === "true");
    setHasStartedTour(started === "true");

    // Auto-start tour for new users
    if (!completed && !started) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      steps: createTourSteps(),
      onDestroyed: () => {
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        setHasCompletedTour(true);
        track(AnalyticsEvents.FREELANCE_TOUR_COMPLETED);
      },
      onHighlightStarted: (_element, step) => {
        if (step.element === `[data-tour="freelance-welcome"]`) {
          track(AnalyticsEvents.FREELANCE_TOUR_STARTED);
          localStorage.setItem(TOUR_STARTED_KEY, "true");
          setHasStartedTour(true);
        }
      },
    });

    driverObj.drive();
  };

  const restartTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.setItem(TOUR_STARTED_KEY, "true");
    setHasCompletedTour(false);
    startTour();
  };

  return (
    <div className="flex gap-2">
      {!hasCompletedTour && !hasStartedTour && (
        <Button variant="outline" size="sm" onClick={startTour}>
          <Play className="mr-2 size-4" />
          Démarrer le tour guidé
        </Button>
      )}
      {hasCompletedTour && (
        <Button variant="ghost" size="sm" onClick={restartTour}>
          <RotateCcw className="mr-2 size-4" />
          Revoir le tour
        </Button>
      )}
    </div>
  );
}

export function FreelanceTourButton({
  variant = "default",
}: {
  variant?: "default" | "ghost";
}) {
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      steps: createTourSteps(),
      onDestroyed: () => {
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        track(AnalyticsEvents.FREELANCE_TOUR_COMPLETED);
      },
    });

    driverObj.drive();
  };

  return (
    <Button
      variant={variant === "ghost" ? "ghost" : "outline"}
      size="sm"
      onClick={startTour}
    >
      <Play className="mr-2 size-4" />
      Tour guidé
    </Button>
  );
}
