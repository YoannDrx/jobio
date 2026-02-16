"use client";

import { useCallback } from "react";
import { track, AnalyticsEvents, type AnalyticsEvent } from "@/lib/analytics";

export const useTrackEvent = () => {
  const trackEvent = useCallback(
    (event: AnalyticsEvent | string, properties?: Record<string, unknown>) => {
      track(event, properties);
    },
    [],
  );

  const trackOnboardingStep = useCallback((step: number, stepName: string) => {
    track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, {
      step,
      step_name: stepName,
    });
  }, []);

  const trackFirstMission = useCallback(() => {
    track(AnalyticsEvents.FIRST_MISSION_CREATED);
  }, []);

  const trackFirstFollowUp = useCallback(() => {
    track(AnalyticsEvents.FIRST_FOLLOW_UP_PLANNED);
  }, []);

  const trackFirstContact = useCallback(() => {
    track(AnalyticsEvents.FIRST_CONTACT_CREATED);
  }, []);

  return {
    trackEvent,
    trackOnboardingStep,
    trackFirstMission,
    trackFirstFollowUp,
    trackFirstContact,
  };
};
