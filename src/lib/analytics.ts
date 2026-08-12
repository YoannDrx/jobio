"use client";

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";
export const ANALYTICS_CONSENT_KEY = "jobio.analytics-consent.v1";

export const hasAnalyticsConsent = () =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";

export const initAnalytics = () => {
  if (typeof window !== "undefined" && POSTHOG_KEY && hasAnalyticsConsent()) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      persistence: "localStorage",
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          posthog.debug(false);
        }
      },
    });
    posthog.opt_in_capturing();
  }
};

export const setAnalyticsConsent = (consent: "granted" | "denied") => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
  if (consent === "granted") {
    initAnalytics();
    return;
  }

  posthog.opt_out_capturing();
  posthog.reset();
};

export const track = (event: string, properties?: Record<string, unknown>) => {
  try {
    if (typeof window !== "undefined" && hasAnalyticsConsent()) {
      posthog.capture(event, properties);
    }
  } catch (error) {
    // Silently fail in production, log in development
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("Analytics track error:", error);
    }
  }
};

export const identify = (userId: string, traits?: Record<string, unknown>) => {
  try {
    if (typeof window !== "undefined" && hasAnalyticsConsent()) {
      posthog.identify(userId, traits);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("Analytics identify error:", error);
    }
  }
};

export const page = (name: string, properties?: Record<string, unknown>) => {
  track("$pageview", { page: name, ...properties });
};

export const reset = () => {
  try {
    if (typeof window !== "undefined") {
      posthog.reset();
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("Analytics reset error:", error);
    }
  }
};

// Typed events for Jobio
export const AnalyticsEvents = {
  // Onboarding
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  FIRST_MISSION_CREATED: "first_mission_created",
  FIRST_FOLLOW_UP_PLANNED: "first_follow_up_planned",
  FIRST_CONTACT_CREATED: "first_contact_created",

  // Freelance Onboarding
  FREELANCE_TOUR_STARTED: "freelance_tour_started",
  FREELANCE_TOUR_COMPLETED: "freelance_tour_completed",
  FREELANCE_ONBOARDING_STEP_COMPLETED: "freelance_onboarding_step_completed",

  // Core Product
  MISSION_CREATED: "mission_created",
  MISSION_STATUS_CHANGED: "mission_status_changed",
  MISSION_ARCHIVED: "mission_archived",
  FOLLOW_UP_COMPLETED: "follow_up_completed",
  FOLLOW_UP_SNOOZED: "follow_up_snoozed",
  CONTACT_CREATED: "contact_created",
  CONTACT_IMPORTED: "contact_imported",
  SEQUENCE_APPLIED: "sequence_applied",
  CV_COACH_SESSION_STARTED: "cv_coach_session_started",
  CV_COACH_SESSION_COMPLETED: "cv_coach_session_completed",
  INVOICE_GENERATED: "invoice_generated",

  // Conversion
  PRICING_PAGE_VIEWED: "pricing_page_viewed",
  PLAN_SELECTED: "plan_selected",
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_COMPLETED: "subscription_completed",

  // Navigation
  PAGE_VIEW: "$pageview",
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
