"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";

const TOUR_COMPLETED_KEY = "jobio-tour-completed";
const TOUR_STARTED_KEY = "jobio-tour-started";

const createTourSteps = () => [
  {
    element: `[data-tour="welcome"]`,
    popover: {
      title: "Bienvenue sur Jobio ! 👋",
      description:
        "Ton cockpit commercial pour gérer ta prospection freelance. Laisse-moi te faire un rapide tour.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: `[data-tour="dashboard"]`,
    popover: {
      title: "Ton Dashboard",
      description:
        "Ici tu vois tes actions urgentes du jour : relances à faire, missions à suivre.",
      side: "bottom" as const,
    },
  },
  {
    element: `[data-tour="pipeline-nav"]`,
    popover: {
      title: "Pipeline de missions",
      description:
        "Capture et suis toutes tes missions en cours. Glisse-les d'étape en étape.",
      side: "right" as const,
    },
  },
  {
    element: `[data-tour="contacts-nav"]`,
    popover: {
      title: "Carnet de contacts",
      description: "Gère tes contacts pros : recruteurs, clients, réseau.",
      side: "right" as const,
    },
  },
  {
    element: `[data-tour="followups-nav"]`,
    popover: {
      title: "Relances",
      description:
        "Ne laisse aucune opportunité filer. Planifie et suis tes relances.",
      side: "right" as const,
    },
  },
  {
    popover: {
      title: "C'est parti ! 🚀",
      description:
        "Crée ta première mission pour démarrer. Le coach va t'accompagner !",
    },
  },
];

export function OnboardingTour() {
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [hasStartedTour, setHasStartedTour] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
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
        // Tour completed or closed
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        setHasCompletedTour(true);
        track(AnalyticsEvents.ONBOARDING_COMPLETED);
      },
      onHighlightStarted: (element, step) => {
        if (step.element === `[data-tour="welcome"]`) {
          track(AnalyticsEvents.ONBOARDING_STARTED);
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

  // Don't show button if tour is in progress (driver handles this)
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

export function OnboardingTourButton({
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
        track(AnalyticsEvents.ONBOARDING_COMPLETED);
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
