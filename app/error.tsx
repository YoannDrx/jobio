"use client";

import { HeaderBase } from "@/features/layout/header-base";
import { Page400 } from "@/features/page/page-400";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
        source: "app-error-boundary",
        message: error.message,
        stack: error.stack,
        route: typeof window !== "undefined" ? window.location.pathname : undefined,
        severity: "ERROR",
        context: {
          digest: error.digest,
        },
      }),
    }).catch(() => {
      // Never block UI on monitoring side-effects
    });
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <HeaderBase />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Page400 />
        <Button variant="outline" onClick={() => reset()}>
          Réessayer
        </Button>
      </div>
    </div>
  );
}
