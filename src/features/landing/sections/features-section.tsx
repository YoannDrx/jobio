"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LazyLandingDemo } from "@/features/landing/demos/lazy-landing-demo";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { motion } from "motion/react";
import {
  Layers3,
  Bot,
  Clock3,
  ChartNoAxesCombined,
  ListChecks,
} from "lucide-react";

const pillars = [
  {
    icon: Layers3,
    title: "Pipeline lisible",
    description:
      "Chaque mission a sa place. Kanban + scoring pour prioriser ce qui mérite ton attention.",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
  },
  {
    icon: Bot,
    title: "IA contextuelle",
    description:
      "Parsing d'annonces, scoring de match, génération d'emails. L'IA travaille pendant que tu décides.",
    color: "text-brand-violet",
    bg: "bg-brand-violet/10",
  },
  {
    icon: Clock3,
    title: "Relances cadencées",
    description:
      "Séquences automatiques, templates personnalisés. Zéro deal oublié, zéro relance manuelle.",
    color: "text-brand-amber",
    bg: "bg-brand-amber/10",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Pilotage concret",
    description:
      "Taux de conversion, TJM moyen, plateformes performantes. Les chiffres qui orientent tes décisions.",
    color: "text-brand-emerald",
    bg: "bg-brand-emerald/10",
  },
];

export function FeaturesSection() {
  const { ref, shouldAnimate } = useSectionInView();

  return (
    <section
      ref={ref}
      id="features"
      className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-8 lg:py-20"
    >
      <div className="flex flex-col gap-14 lg:gap-20">
        {/* Header */}
        <motion.div
          className="flex flex-col items-center gap-2"
          variants={fadeInUp}
          initial={shouldAnimate ? "initial" : "animate"}
          animate="animate"
          transition={{ ...defaultTransition, duration: 0.5 }}
        >
          <Badge variant="default">Features</Badge>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            4 piliers. Un seul objectif : signer plus.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-center text-base font-medium">
            De la découverte d'une mission à la signature du contrat, chaque
            étape est structurée, mesurée et optimisable.
          </p>
        </motion.div>

        {/* Pillar Cards Grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2"
          variants={staggerContainer(0.1)}
          initial={shouldAnimate ? "initial" : "animate"}
          animate="animate"
        >
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={idx}
                variants={fadeInUp}
                transition={defaultTransition}
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="group h-full">
                    <CardHeader>
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg ${pillar.bg} transition-transform group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <Icon className={`size-4 ${pillar.color}`} />
                      </div>
                      <CardTitle className="mt-3">{pillar.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {pillar.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Demo Cards */}
        <motion.div
          className="grid gap-6 lg:grid-cols-2"
          variants={staggerContainer(0.1)}
          initial={shouldAnimate ? "initial" : "animate"}
          animate="animate"
        >
          {/* Left: Analytics demo */}
          <motion.div variants={fadeInUp} transition={defaultTransition}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Analytics en temps réel</CardTitle>
              </CardHeader>
              <CardContent>
                <LazyLandingDemo demo="analytics" skeletonClassName="h-80" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Expected Results */}
          <motion.div variants={fadeInUp} transition={defaultTransition}>
            <Card className="from-brand-cyan/10 via-brand-violet/10 to-brand-emerald/10 h-full bg-gradient-to-br">
              <CardHeader>
                <CardTitle>Résultat attendu</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <p className="text-foreground text-lg font-semibold">
                  Plus de régularité, plus de conversions, moins d'oubli.
                </p>
                <div className="space-y-3">
                  {[
                    "Aucune opportunité ne passe à travers les mailles",
                    "Des relances cohérentes et opportunes",
                    "Des données pour ajuster ta stratégie",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <ListChecks className="text-brand-cyan size-5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
