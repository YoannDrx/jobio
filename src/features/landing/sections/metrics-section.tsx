"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { useEffect, useState } from "react";

const metrics = [
  {
    value: 3,
    suffix: "x",
    label: "Plus de missions suivies en simultanée",
    color: "text-brand-cyan",
  },
  {
    value: 60,
    prefix: "-",
    suffix: "%",
    label: "De temps sur le suivi administratif",
    color: "text-brand-emerald",
  },
  {
    value: 40,
    prefix: "+",
    suffix: "%",
    label: "De taux de réponse avec les séquences",
    color: "text-brand-violet",
  },
  {
    value: 2,
    suffix: " min",
    label: "Pour capturer et qualifier une mission",
    color: "text-brand-amber",
  },
];

function AnimatedCounter({
  value,
  prefix,
  suffix,
  color,
  shouldAnimate,
  isInView,
}: {
  value: number;
  prefix?: string;
  suffix: string;
  color: string;
  shouldAnimate: boolean;
  isInView: boolean;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView || !shouldAnimate) {
      setDisplayValue(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 2,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    return () => controls.stop();
  }, [isInView, shouldAnimate, value, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    return () => unsubscribe();
  }, [rounded]);

  return (
    <span
      className={`font-caption text-4xl font-bold tracking-tight sm:text-5xl ${color}`}
    >
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

export function MetricsSection() {
  const { ref, shouldAnimate, isInView } = useSectionInView();

  return (
    <section ref={ref} className="py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-2 gap-8 lg:grid-cols-4"
          variants={staggerContainer(0.12)}
          initial={shouldAnimate ? "initial" : "animate"}
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          transition={defaultTransition}
        >
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              className="flex flex-col items-center gap-2 text-center"
              variants={fadeInUp}
            >
              <AnimatedCounter
                value={metric.value}
                prefix={metric.prefix}
                suffix={metric.suffix}
                color={metric.color}
                shouldAnimate={shouldAnimate}
                isInView={isInView}
              />
              <p className="text-muted-foreground text-sm">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
