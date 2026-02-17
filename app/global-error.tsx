"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HeaderBase } from "@/features/layout/header-base";
import { Page400 } from "@/features/page/page-400";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/monitoring/errors", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        source: "global-error-boundary",
        message: error.message,
        stack: error.stack,
        route:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        severity: "CRITICAL",
        context: {
          digest: error.digest,
        },
      }),
    }).catch(() => {
      // Ignore monitoring failure
    });
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="relative flex min-h-screen flex-col">
          <HeaderBase />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Page400 />
            <Button variant="outline" onClick={() => reset()}>
              Réessayer
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
