"use client";

import {
  fadeInUp,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { motion } from "motion/react";

const platforms = [
  "Malt",
  "Comet",
  "Freelance.com",
  "Crème de la Crème",
  "LeHibou",
  "Talent.io",
  "Kicklox",
  "Free-Work",
  "Club Freelance",
  "Iziday",
  "Mindquest",
  "Hays",
  "Externatic",
];

export function PlatformLogosSection() {
  const { ref, shouldAnimate } = useSectionInView();

  return (
    <section ref={ref} className="bg-muted/30 py-8 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        {/* Title */}
        <motion.div
          className="text-center"
          variants={fadeInUp}
          initial={shouldAnimate ? "initial" : "animate"}
          whileInView="animate"
          viewport={{ once: true, margin: "-40px" }}
          transition={defaultTransition}
        >
          <p className="text-muted-foreground text-sm font-medium">
            Compatible avec +15 plateformes freelance
          </p>
        </motion.div>

        {/* Infinite scrolling ribbon */}
        <div className="marquee-mask relative mt-6 overflow-hidden">
          <div
            className="marquee-track flex w-max gap-8 px-4"
            style={{ animation: "marquee-scroll 25s linear infinite" }}
          >
            {[...platforms, ...platforms].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-muted-foreground hover:text-foreground text-sm font-medium whitespace-nowrap transition-opacity duration-200"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
