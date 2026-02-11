"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { useEffect, useRef } from "react";

const stats = [
  { label: "Taux de r\u00E9ponse", value: 85, color: "bg-emerald-500" },
  { label: "Missions sign\u00E9es", value: 62, color: "bg-primary" },
  { label: "Entretiens d\u00E9croch\u00E9s", value: 78, color: "bg-brand-cyan" },
];

function AnimatedPercent({
  target,
  isInView,
  delay,
}: {
  target: number;
  isInView: boolean;
  delay: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      animate(motionValue, target, {
        duration: 1,
        delay,
        ease: "easeOut",
      });
    }
  }, [isInView, motionValue, target, delay]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${v}%`;
      }
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <span
      ref={ref}
      className="text-foreground text-sm font-semibold tabular-nums"
    >
      0%
    </span>
  );
}

export default function DemoAnalytics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-border/50 bg-card/80 flex flex-col gap-5 rounded-xl border p-5 shadow-sm backdrop-blur-sm"
    >
      {/* Hero stat */}
      <div className="flex flex-col items-center gap-1">
        <AnimatedBigPercent target={85} isInView={isInView} />
        <span className="text-muted-foreground text-xs font-medium">
          Taux de r\u00E9ponse
        </span>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {stat.label}
              </span>
              <AnimatedPercent
                target={stat.value}
                isInView={isInView}
                delay={i * 0.15}
              />
            </div>
            <div className="bg-muted/50 h-2 w-full overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: `${stat.value}%` } : { width: 0 }}
                transition={{
                  duration: 1,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
                className={`h-full rounded-full ${stat.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AnimatedBigPercent({
  target,
  isInView,
}: {
  target: number;
  isInView: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      animate(motionValue, target, { duration: 1.2, ease: "easeOut" });
    }
  }, [isInView, motionValue, target]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${v}%`;
      }
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <span ref={ref} className="text-foreground text-4xl font-bold tabular-nums">
      0%
    </span>
  );
}
