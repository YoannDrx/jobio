"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { motion } from "motion/react";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { JOBIO_USE_CASES } from "@/features/seo/use-cases";
import { Code2, Brain, Puzzle } from "lucide-react";
import Link from "next/link";

const useCaseConfig = [
  {
    icon: Code2,
    gradient: "from-brand-cyan/5 to-brand-cyan/10",
    iconColor: "text-brand-cyan",
    iconBg: "bg-brand-cyan/10",
  },
  {
    icon: Brain,
    gradient: "from-brand-violet/5 to-brand-violet/10",
    iconColor: "text-brand-violet",
    iconBg: "bg-brand-violet/10",
  },
  {
    icon: Puzzle,
    gradient: "from-brand-amber/5 to-brand-amber/10",
    iconColor: "text-brand-amber",
    iconBg: "bg-brand-amber/10",
  },
];

const useCaseCtas = JOBIO_USE_CASES.map((item, index) => ({
  href: `/use-cases/${item.slug}`,
  title: item.persona,
  summary: item.summary,
  recommendedPlan: item.recommendedPlan,
  ...useCaseConfig[index],
}));

export function UseCasesSection() {
  const { ref, shouldAnimate } = useSectionInView();

  return (
    <section ref={ref} id="use-cases" className="py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col gap-12">
          {/* Header */}
          <motion.div
            className="flex flex-col items-center gap-2"
            variants={fadeInUp}
            initial={shouldAnimate ? "initial" : "animate"}
            animate="animate"
            transition={{ ...defaultTransition, duration: 0.5 }}
          >
            <Badge variant="default">Use cases</Badge>
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Des parcours dédiés selon ton profil freelance.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-center text-base font-medium">
              Choisis un guide orienté terrain pour voir comment Jobio se cale
              sur ton contexte: développeur, data/IA ou product/no-code.
            </p>
          </motion.div>

          {/* Use Cases Cards Grid */}
          <motion.div
            className="grid gap-4 md:grid-cols-3"
            variants={staggerContainer(0.12)}
            initial={shouldAnimate ? "initial" : "animate"}
            animate="animate"
          >
            {useCaseCtas.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`border-border/70 bg-gradient-to-br ${item.gradient} group h-full transition-all hover:shadow-lg`}
                  >
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-8 items-center justify-center rounded-lg ${item.iconBg}`}
                          >
                            <Icon className={`size-4 ${item.iconColor}`} />
                          </div>
                          <p className="font-medium">{item.title}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {item.recommendedPlan}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4 text-sm">
                        {item.summary}
                      </p>
                      <Link
                        href={item.href}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                        })}
                      >
                        Découvrir mon parcours
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
