"use client";

import { Badge } from "@/components/ui/badge";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { AnimatePresence, motion } from "motion/react";
import {
  Layers3,
  MailX,
  BarChart3,
  FileText,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

const comparisons = [
  {
    icon: Layers3,
    pain: "3 tableurs, 2 Notion, 1 Google Sheet",
    label: "Suivi missions",
    solution: "Un pipeline unique avec Kanban et scoring IA",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/20",
  },
  {
    icon: MailX,
    pain: "Relances oubliées, deals qui s'évaporent",
    label: "Relances",
    solution: "Séquences automatiques qui ne laissent rien passer",
    color: "text-brand-violet",
    bg: "bg-brand-violet/10",
    border: "border-brand-violet/20",
  },
  {
    icon: BarChart3,
    pain: "Aucune idée de ce qui convertit vraiment",
    label: "Conversion",
    solution: "Taux de conversion et vélocité en temps réel",
    color: "text-brand-emerald",
    bg: "bg-brand-emerald/10",
    border: "border-brand-emerald/20",
  },
  {
    icon: FileText,
    pain: "Le même CV copié-collé partout",
    label: "CV",
    solution: "CV adapté par mission avec coaching IA",
    color: "text-brand-amber",
    bg: "bg-brand-amber/10",
    border: "border-brand-amber/20",
  },
  {
    icon: Receipt,
    pain: "Facturation sur un outil séparé, rien de relié",
    label: "Facturation",
    solution: "Devis et factures intégrés au pipeline",
    color: "text-brand-rose",
    bg: "bg-brand-rose/10",
    border: "border-brand-rose/20",
  },
];

const chaosRotations = [-2.5, 1.8, -1.2, 2.4, -1.8];

export function BeforeAfterSection() {
  const { ref, shouldAnimate } = useSectionInView();
  const [showSolution, setShowSolution] = useState(false);

  return (
    <section ref={ref} className="bg-muted/30 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center gap-10">
          {/* Header */}
          <motion.div
            className="flex flex-col items-center gap-4 text-center"
            variants={fadeInUp}
            initial={shouldAnimate ? "initial" : "animate"}
            animate="animate"
            transition={{ ...defaultTransition, duration: 0.5 }}
          >
            <Badge>Transformation</Badge>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Le même freelance. Un système différent.
            </h2>
          </motion.div>

          {/* Toggle */}
          <motion.div
            variants={fadeInUp}
            initial={shouldAnimate ? "initial" : "animate"}
            animate="animate"
            transition={{ ...defaultTransition, delay: 0.15 }}
          >
            <div className="bg-muted/80 relative flex rounded-full border p-1">
              <button
                onClick={() => setShowSolution(false)}
                className="relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors"
              >
                {!showSolution && (
                  <motion.div
                    layoutId="toggle-bg"
                    className="bg-background absolute inset-0 rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`relative z-10 ${!showSolution ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Le quotidien sans outil
                </span>
              </button>
              <button
                onClick={() => setShowSolution(true)}
                className="relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors"
              >
                {showSolution && (
                  <motion.div
                    layoutId="toggle-bg"
                    className="bg-background absolute inset-0 rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`relative z-10 ${showSolution ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Avec Jobio
                </span>
              </button>
            </div>
          </motion.div>

          {/* Cards grid */}
          <motion.div
            className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-5"
            variants={staggerContainer(0.06)}
            initial={shouldAnimate ? "initial" : "animate"}
            animate="animate"
          >
            {comparisons.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  variants={fadeInUp}
                  transition={defaultTransition}
                >
                  <motion.div
                    className={`relative flex h-full flex-col gap-3 rounded-xl border p-5 transition-colors duration-300 ${
                      showSolution
                        ? `${item.border} ${item.bg}`
                        : "border-border/50 bg-card/50"
                    }`}
                    animate={
                      shouldAnimate
                        ? {
                            rotate: showSolution ? 0 : chaosRotations[index],
                            scale: showSolution ? 1 : 0.97,
                          }
                        : {}
                    }
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Icon + Label */}
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={
                          shouldAnimate
                            ? {
                                scale: showSolution ? 1 : 0.85,
                                opacity: showSolution ? 1 : 0.5,
                              }
                            : {}
                        }
                        transition={{ duration: 0.3 }}
                      >
                        <Icon
                          className={`size-5 transition-colors duration-300 ${showSolution ? item.color : "text-muted-foreground"}`}
                        />
                      </motion.div>
                      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        {item.label}
                      </span>
                    </div>

                    {/* Content swap */}
                    <div className="relative min-h-[3.5rem]">
                      <AnimatePresence mode="wait">
                        {showSolution ? (
                          <motion.p
                            key="solution"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="text-foreground text-sm leading-relaxed font-medium"
                          >
                            {item.solution}
                          </motion.p>
                        ) : (
                          <motion.p
                            key="pain"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="text-muted-foreground text-sm leading-relaxed"
                          >
                            {item.pain}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Transformation arrow */}
                    <motion.div
                      className="mt-auto flex items-center gap-1.5"
                      animate={
                        shouldAnimate
                          ? {
                              opacity: showSolution ? 1 : 0.3,
                              x: showSolution ? 0 : -4,
                            }
                          : {}
                      }
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowRight
                        className={`size-3.5 transition-colors duration-300 ${showSolution ? item.color : "text-muted-foreground/40"}`}
                      />
                      <span
                        className={`text-xs font-medium transition-colors duration-300 ${showSolution ? item.color : "text-muted-foreground/40"}`}
                      >
                        {showSolution ? "Résolu" : "Point de friction"}
                      </span>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
