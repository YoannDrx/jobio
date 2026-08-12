"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ANALYTICS_CONSENT_KEY,
  hasAnalyticsConsent,
  identify,
  initAnalytics,
  page,
  setAnalyticsConsent,
} from "@/lib/analytics";
import { useSession } from "@/lib/auth-client";
import type { ReactNode } from "react";

type Consent = "granted" | "denied" | null;

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    setConsent(stored === "granted" || stored === "denied" ? stored : null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (consent !== "granted") return;
    initAnalytics();
  }, [consent]);

  useEffect(() => {
    if (consent !== "granted" || !hasAnalyticsConsent()) return;
    const userId = session?.user.id;
    if (userId) identify(userId);
  }, [consent, session?.user.id]);

  useEffect(() => {
    if (consent === "granted" && hasAnalyticsConsent()) page(pathname);
  }, [consent, pathname]);

  const chooseConsent = (value: Exclude<Consent, null>) => {
    setAnalyticsConsent(value);
    setConsent(value);
  };

  return (
    <>
      {children}
      {isReady && consent === null ? (
        <Card className="fixed right-4 bottom-4 left-4 z-[100] mx-auto max-w-2xl shadow-2xl">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <p className="text-muted-foreground flex-1 text-sm">
              Avec ton accord, Jobio utilise PostHog pour comprendre les
              parcours et améliorer le produit. Aucun analytics n’est chargé
              avant ton choix.{" "}
              <Link className="underline" href="/legal/cookies">
                En savoir plus
              </Link>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => chooseConsent("denied")}>
                Refuser
              </Button>
              <Button onClick={() => chooseConsent("granted")}>Accepter</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
