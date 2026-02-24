"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LazyLandingDemo } from "@/features/landing/demos/lazy-landing-demo";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card className="border-white/30 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/25">
      <CardContent className="p-4">
        <p className="font-caption text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}

export function HeroSection() {
  const { ref, shouldAnimate } = useSectionInView();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const proPlanLimits = getPlanLimits("pro");

  const stats = [
    { value: "15+", label: "Plateformes freelance suivies" },
    { value: "< 5 min", label: "Pour capturer une mission" },
    {
      value: `${proPlanLimits.analyticsHistoryDays} j`,
      label: "Historique analytics en Pro",
    },
    { value: "24/7", label: "Visibilité sur ton pipeline" },
  ];

  return (
    <section ref={ref} className="relative isolate">
      {/* ── Above the fold: full viewport height ── */}
      <div className="relative flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center overflow-hidden px-6 lg:px-8">
        {/* Animated blobs background */}
        <motion.div
          className="bg-brand-cyan/25 pointer-events-none absolute top-20 left-[8%] size-64 rounded-full blur-[90px]"
          animate={
            shouldAnimate ? { x: [0, 30, -20, 0], y: [0, -20, 15, 0] } : {}
          }
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute top-40 right-[10%] size-72 rounded-full bg-emerald-500/25 blur-[90px]"
          animate={
            shouldAnimate ? { x: [0, -40, 20, 0], y: [0, 30, -20, 0] } : {}
          }
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-20 left-1/3 size-80 rounded-full bg-amber-500/20 blur-[90px]"
          animate={
            shouldAnimate ? { x: [0, 25, -30, 0], y: [0, -30, 10, 0] } : {}
          }
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Hero copy */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={staggerContainer(0.1)}
          initial={shouldAnimate ? "initial" : "animate"}
          animate="animate"
          transition={defaultTransition}
        >
          <motion.div
            variants={fadeInUp}
            transition={{ ...defaultTransition, delay: 0.1 }}
          >
            <Badge variant="secondary">
              Le cockpit commercial des freelances tech
            </Badge>
          </motion.div>

          <div className="mt-6">
            <motion.h1
              className="text-5xl font-bold tracking-tight text-balance sm:text-7xl"
              variants={fadeInUp}
              transition={{ ...defaultTransition, delay: 0.2 }}
            >
              Trouve. Relance. Signe.
            </motion.h1>
          </div>

          <motion.p
            className="text-muted-foreground mt-6 text-lg font-medium text-pretty sm:text-xl/8"
            variants={fadeInUp}
            transition={{ ...defaultTransition, delay: 0.45 }}
          >
            Jobio structure ton pipeline freelance pour que chaque opportunité
            devienne un contrat.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
            variants={fadeInUp}
            transition={{ ...defaultTransition, delay: 0.55 }}
          >
            <Link
              href="/auth/signup"
              className={buttonVariants({ size: "lg", variant: "default" })}
            >
              <motion.span
                className="inline-flex items-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Commencer gratuitement
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="size-4" />
                </motion.span>
              </motion.span>
            </Link>
            <Link
              href="#features"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Voir les fonctionnalités
            </Link>
          </motion.div>

          <motion.p
            className="text-muted-foreground mt-6 text-sm font-medium"
            variants={fadeInUp}
            transition={{ ...defaultTransition, delay: 0.65 }}
          >
            Gratuit pour commencer · Setup en 2 min · Tes données restent les
            tiennes
          </motion.p>
        </motion.div>

        {/* Scroll chevron */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.div
            animate={shouldAnimate ? { y: [0, 6, 0] } : {}}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ChevronDown className="text-muted-foreground/50 size-6" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Below the fold: stats + demos ── */}
      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-24">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
          variants={staggerContainer(0.08)}
          initial={shouldAnimate ? "initial" : "animate"}
          animate="animate"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              transition={defaultTransition}
            >
              <StatCard value={stat.value} label={stat.label} />
            </motion.div>
          ))}
        </motion.div>

        {/* Demo section with parallax */}
        <div ref={heroRef} className="mt-12 sm:mt-16">
          <motion.div
            className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"
            initial={shouldAnimate ? "initial" : "animate"}
            animate="animate"
          >
            {/* Left: Kanban demo */}
            <motion.div style={{ y: y1 }}>
              <LazyLandingDemo demo="kanban" skeletonClassName="h-96" />
            </motion.div>

            {/* Right column: Score ring + Sequence */}
            <motion.div style={{ y: y2 }} className="flex flex-col gap-4">
              <div className="rounded-xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-medium">Score de mission</span>
                </div>
                <LazyLandingDemo demo="score-ring" skeletonClassName="h-48" />
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Séquences de relance
                  </span>
                </div>
                <LazyLandingDemo demo="sequence" skeletonClassName="h-48" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
