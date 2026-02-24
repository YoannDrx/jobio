"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";

const workflow = [
  {
    title: "Capture",
    detail:
      "Tu colles une URL ou un texte d'annonce. Jobio transforme la mission en fiche exploitable.",
  },
  {
    title: "Qualification",
    detail:
      "Le score IA et ton profil freelance t'aident à prioriser rapidement les opportunités pertinentes.",
  },
  {
    title: "Exécution",
    detail:
      "Tu pilotes le pipeline, déclenches des séquences de relance et gardes une trace complète.",
  },
  {
    title: "Optimisation",
    detail:
      "Tu analyses tes résultats, identifies les plateformes rentables et ajustes ton process.",
  },
];

export function WorkflowSection() {
  const { ref, isInView, shouldAnimate } = useSectionInView();

  const containerVariants = useMemo(() => staggerContainer(0.1), []);

  return (
    <section ref={ref} className="py-16 lg:py-24">
      <div className="container mx-auto w-full max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <Badge variant="outline">Workflow</Badge>
          <h2 className="text-3xl font-bold lg:text-4xl">
            De l'offre repérée au contrat signé, en 4 étapes.
          </h2>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden items-start gap-0 lg:flex">
          {workflow.map((item, index) => (
            <React.Fragment key={item.title}>
              {/* Node */}
              <motion.div
                className="flex flex-1 flex-col items-center text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  shouldAnimate && isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.8 }
                }
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: index * 0.25,
                }}
              >
                <div className="from-primary to-brand-emerald flex size-12 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white">
                  {index + 1}
                </div>
                <p className="mt-3 font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-1 max-w-[200px] text-sm">
                  {item.detail}
                </p>
              </motion.div>

              {/* Connector Line */}
              {index < workflow.length - 1 && (
                <motion.div
                  className="from-brand-cyan to-brand-emerald mt-6 h-0.5 flex-1 bg-gradient-to-r"
                  initial={{ scaleX: 0 }}
                  animate={
                    shouldAnimate && isInView ? { scaleX: 1 } : { scaleX: 0 }
                  }
                  transition={{
                    duration: 1.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: index * 0.25,
                  }}
                  style={{ transformOrigin: "left" }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile Timeline */}
        <motion.div
          className="flex flex-col gap-6 lg:hidden"
          variants={containerVariants}
          initial="initial"
          animate={shouldAnimate && isInView ? "animate" : "initial"}
        >
          {workflow.map((item, index) => (
            <motion.div
              key={item.title}
              className="flex gap-4"
              variants={fadeInUp}
              transition={defaultTransition}
            >
              <div className="flex flex-col items-center">
                <div className="from-primary to-brand-emerald flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white">
                  {index + 1}
                </div>
                {index < workflow.length - 1 && (
                  <div className="from-brand-cyan to-brand-emerald mt-2 h-16 w-0.5 bg-gradient-to-b" />
                )}
              </div>
              <div className="pb-6">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
