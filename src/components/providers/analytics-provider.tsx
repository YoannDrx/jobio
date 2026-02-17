"use client";

import { useEffect } from "react";
import { initAnalytics, identify, page } from "@/lib/analytics";
import { useSession } from "@/lib/auth-client";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Identify user when session changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const userId = session?.user?.id;
    if (userId) {
      identify(userId, {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        email: session?.user?.email,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        name: session?.user?.name,
      });
    }
  }, [session]);

  // Track page views
  useEffect(() => {
    const handleRouteChange = () => {
      page(window.location.pathname);
    };

    handleRouteChange();

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  return <>{children}</>;
}
