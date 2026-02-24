"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { Target, FileText, Receipt, Check } from "lucide-react";

const productSuites = [
  {
    id: "prospection",
    icon: Target,
    title: "Prospection & Dashboard",
    description:
      "Un cockpit complet pour visualiser, prioriser et convertir tes opportunités freelance.",
    bullets: [
      "Pipeline missions (Kanban + liste + filtres avancés)",
      "CRM contacts avec interactions et scoring relationnel",
      "Relances manuelles + automatiques + séquences",
      "Analytics de conversion, vélocité et performance plateformes",
    ],
    gradient: "from-brand-cyan/20 to-brand-cyan/5",
    iconColor: "text-brand-cyan",
  },
  {
    id: "cv-studio",
    icon: FileText,
    title: "CV Studio IA",
    description:
      "Crée, optimise et adapte tes CV pour chaque mission avec l'aide de l'IA.",
    bullets: [
      "CV Master centralisé par profil freelance",
      "Éditeur CV Lab multi-documents avec versions",
      "ATS scoring et recommandations d'amélioration",
      "Coach CV IA (plan Ultra) + export PDF",
    ],
    gradient: "from-brand-violet/20 to-brand-violet/5",
    iconColor: "text-brand-violet",
  },
  {
    id: "billing",
    icon: Receipt,
    title: "Freelance Billing",
    description: "Gère l'administratif sans quitter ton flux de prospection.",
    bullets: [
      "Clients, devis, factures, paiements et catalogue",
      "Registres exports et suivi déclaratif",
      "Dépenses (factures, notes de frais, trajets)",
      "Prévision IA de trésorerie et conformité",
    ],
    gradient: "from-brand-emerald/20 to-brand-emerald/5",
    iconColor: "text-brand-emerald",
  },
];

export function ProductSuitesSection() {
  const { ref, isInView, shouldAnimate } = useSectionInView();
  const [activeTab, setActiveTab] = useState(0);

  const containerVariants = staggerContainer(0.06);

  return (
    <section ref={ref} className="bg-muted/30 py-16 lg:py-24">
      <div className="container mx-auto w-full max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12 flex flex-col items-center gap-3 text-center"
          initial="initial"
          animate={shouldAnimate && isInView ? "animate" : "initial"}
          variants={fadeInUp}
          transition={defaultTransition}
        >
          <Badge variant="outline">Suites produit</Badge>
          <h2 className="text-3xl font-bold lg:text-4xl">
            Un seul outil, de la mission à la facture.
          </h2>
        </motion.div>

        {/* Tab Bar */}
        <motion.div
          className="mb-12 flex justify-center"
          initial="initial"
          animate={shouldAnimate && isInView ? "animate" : "initial"}
          variants={fadeInUp}
          transition={{ ...defaultTransition, delay: 0.1 }}
        >
          <div className="bg-muted/50 relative flex gap-1 overflow-x-auto rounded-lg p-1 sm:overflow-visible">
            {productSuites.map((suite, index) => (
              <button
                key={suite.id}
                onClick={() => setActiveTab(index)}
                className="relative z-10 flex-1 rounded-md px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
              >
                {activeTab === index && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="bg-background absolute inset-0 rounded-md shadow-sm"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{suite.title}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {(() => {
              const suite = productSuites[activeTab];
              return (
                <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-2xl font-semibold tracking-tight">
                      {suite.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                      {suite.description}
                    </p>
                    <motion.ul
                      className="mt-2 flex flex-col gap-3"
                      variants={containerVariants}
                      initial="initial"
                      animate="animate"
                    >
                      {suite.bullets.map((bullet) => (
                        <motion.li
                          key={bullet}
                          variants={fadeInUp}
                          className="flex items-start gap-2.5"
                        >
                          <Check className="text-brand-emerald mt-0.5 size-4 shrink-0" />
                          <span className="text-sm">{bullet}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>

                  {/* Right Column - Icon Card */}
                  <div
                    className={`flex items-center justify-center rounded-2xl bg-gradient-to-br p-8 ${suite.gradient}`}
                  >
                    <suite.icon
                      className={`size-24 ${suite.iconColor} opacity-30`}
                    />
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
