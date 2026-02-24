"use client";

import { motion } from "motion/react";
import { Shield, Lock, Download } from "lucide-react";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";

const badges = [
  {
    icon: Shield,
    label: "Hébergé en Europe",
    description: "Données stockées sur des serveurs européens conformes RGPD.",
  },
  {
    icon: Lock,
    label: "Données chiffrées",
    description:
      "Chiffrement en transit et au repos pour protéger tes informations.",
  },
  {
    icon: Download,
    label: "Export à tout moment",
    description:
      "Récupère ou supprime tes données quand tu veux, sans friction.",
  },
];

export function TrustSection() {
  const { ref, isInView, shouldAnimate } = useSectionInView();

  return (
    <section ref={ref} className="py-12 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <motion.div
          className="grid gap-6 sm:grid-cols-3"
          variants={staggerContainer(0.1)}
          initial={shouldAnimate ? "initial" : "animate"}
          animate={isInView ? "animate" : "initial"}
        >
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={idx}
                className="flex flex-col items-center gap-3 text-center"
                variants={fadeInUp}
                transition={defaultTransition}
              >
                <motion.div
                  initial={
                    shouldAnimate
                      ? { scale: 0.8, opacity: 0 }
                      : { scale: 1, opacity: 1 }
                  }
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
                    <Icon className="text-primary size-5" />
                  </div>
                </motion.div>
                <p className="font-medium">{badge.label}</p>
                <p className="text-muted-foreground max-w-xs text-sm">
                  {badge.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
