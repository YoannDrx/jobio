"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { useEffect, useRef } from "react";

const SCORE = 87;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_DASHOFFSET = CIRCUMFERENCE * (1 - SCORE / 100);

const criteria = [
  { label: "Skills", score: "35/40" },
  { label: "TJM", score: "15/20" },
  { label: "Profil", score: "12/15" },
  { label: "Localisation", score: "13/15" },
  { label: "Complétude", score: "12/10" },
];

function AnimatedCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      animate(motionValue, target, { duration: 1.2, ease: "easeOut" });
    }
  }, [isInView, motionValue, target]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = String(v);
      }
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <span ref={ref} className="text-foreground text-3xl font-bold tabular-nums">
      0
    </span>
  );
}

export default function DemoScoreRing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-border/50 bg-card/80 flex flex-col items-center gap-4 rounded-xl border p-5 shadow-sm backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center">
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          className="-rotate-90"
        >
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/40"
          />
          <motion.circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-emerald-500"
            stroke="currentColor"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={
              isInView
                ? { strokeDashoffset: STROKE_DASHOFFSET }
                : { strokeDashoffset: CIRCUMFERENCE }
            }
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedCounter target={SCORE} />
          <span className="text-muted-foreground text-[10px] font-medium">
            / 100
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        {criteria.map((c, i) => (
          <span key={i} className="text-muted-foreground text-[10px]">
            {c.label}{" "}
            <span className="text-foreground/80 font-semibold">{c.score}</span>
            {i < criteria.length - 1 && (
              <span className="text-muted-foreground/40 ml-1">&middot;</span>
            )}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
