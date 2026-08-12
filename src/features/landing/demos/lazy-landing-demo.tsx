"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import {
  type ComponentType,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

type LandingDemoKind = "kanban" | "score-ring" | "sequence" | "analytics";

const DemoKanban = dynamic(async () => import("./demo-kanban"));
const DemoScoreRing = dynamic(async () => import("./demo-score-ring"));
const DemoSequence = dynamic(async () => import("./demo-sequence"));
const DemoAnalytics = dynamic(async () => import("./demo-analytics"));

const DEMO_COMPONENTS: Record<LandingDemoKind, ComponentType> = {
  kanban: DemoKanban,
  "score-ring": DemoScoreRing,
  sequence: DemoSequence,
  analytics: DemoAnalytics,
};

type LazyLandingDemoProps = {
  demo: LandingDemoKind;
  skeletonClassName?: string;
};

function DemoSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border/50 bg-card/70 animate-pulse rounded-xl border",
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function LazyLandingDemo({
  demo,
  skeletonClassName,
}: LazyLandingDemoProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [shouldRenderDemo, setShouldRenderDemo] = useState(false);

  useEffect(() => {
    const element = anchorRef.current;

    if (!element || shouldRenderDemo) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setShouldRenderDemo(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderDemo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px 0px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldRenderDemo]);

  const DemoComponent = DEMO_COMPONENTS[demo];

  return (
    <div ref={anchorRef}>
      {shouldRenderDemo ? (
        <Suspense fallback={<DemoSkeleton className={skeletonClassName} />}>
          <DemoComponent />
        </Suspense>
      ) : (
        <DemoSkeleton className={skeletonClassName} />
      )}
    </div>
  );
}
