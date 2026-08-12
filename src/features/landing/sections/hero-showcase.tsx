"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LazyLandingDemo } from "@/features/landing/demos/lazy-landing-demo";
import {
  defaultTransition,
  fadeInUp,
  staggerContainer,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type HeroShowcaseProps = {
  analyticsHistoryDays: number;
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card className="border-white/30 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/25">
      <CardContent className="p-4">
        <p className="font-caption text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}

export function HeroShowcase({ analyticsHistoryDays }: HeroShowcaseProps) {
  const { ref, isInView, shouldAnimate } = useSectionInView();
  const previewRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: previewRef,
    offset: ["start start", "end start"],
  });

  const kanbanY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const sideY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const stats = [
    { value: "15+", label: "Plateformes freelance suivies" },
    { value: "< 5 min", label: "Pour capturer une mission" },
    {
      value: `${analyticsHistoryDays} j`,
      label: "Historique analytics en Pro",
    },
    { value: "24/7", label: "Visibilité sur ton pipeline" },
  ];

  return (
    <div
      ref={ref}
      className="mx-auto max-w-7xl px-6 pb-16 [contain-intrinsic-size:auto_900px] [content-visibility:auto] lg:px-8 lg:pb-24"
    >
      <motion.div
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
        variants={staggerContainer(0.08)}
        initial={shouldAnimate ? "initial" : "animate"}
        animate={!shouldAnimate || isInView ? "animate" : "initial"}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeInUp}
            transition={defaultTransition}
          >
            <StatCard value={stat.value} label={stat.label} />
          </motion.div>
        ))}
      </motion.div>

      <div ref={previewRef} className="mt-12 sm:mt-16">
        <motion.div
          className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"
          initial={shouldAnimate ? "initial" : "animate"}
          animate={!shouldAnimate || isInView ? "animate" : "initial"}
        >
          <motion.div style={{ y: kanbanY }}>
            <LazyLandingDemo demo="kanban" skeletonClassName="h-96" />
          </motion.div>

          <motion.div style={{ y: sideY }} className="flex flex-col gap-4">
            <div className="rounded-xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm font-medium">Score de mission</span>
              </div>
              <LazyLandingDemo demo="score-ring" skeletonClassName="h-48" />
            </div>
            <div className="rounded-xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm font-medium">
                  Séquences de relance
                </span>
              </div>
              <LazyLandingDemo demo="sequence" skeletonClassName="h-48" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
