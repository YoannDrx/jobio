"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const steps = [
  {
    delay: "J+3",
    label: "Email de suivi",
    done: true,
  },
  {
    delay: "J+7",
    label: "Appel t\u00E9l\u00E9phonique",
    done: true,
  },
  {
    delay: "J+14",
    label: "Relance finale",
    done: false,
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 8.5L6.5 11L12 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DemoSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-border/50 bg-card/80 flex flex-col gap-0 rounded-xl border p-5 shadow-sm backdrop-blur-sm"
    >
      {steps.map((step, i) => (
        <div key={i} className="flex items-stretch gap-3">
          {/* Timeline column */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={
                isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
              }
              transition={{
                duration: 0.3,
                delay: i * 0.4 + 0.2,
                ease: "easeOut",
              }}
              className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
                step.done
                  ? "border-emerald-500 bg-emerald-500/15"
                  : "border-muted-foreground/30 bg-muted/40"
              }`}
            >
              {step.done ? (
                <CheckIcon className="size-4 text-emerald-500" />
              ) : (
                <span className="bg-muted-foreground/40 size-2 rounded-full" />
              )}
            </motion.div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.4 + 0.4,
                  ease: "easeOut",
                }}
                className={`w-0.5 flex-1 origin-top ${
                  step.done ? "bg-emerald-500/40" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{
              duration: 0.3,
              delay: i * 0.4 + 0.3,
              ease: "easeOut",
            }}
            className={`flex flex-col pb-5 ${!step.done ? "opacity-50" : ""}`}
          >
            <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              {step.delay}
            </span>
            <span
              className={`text-sm font-medium ${
                step.done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
