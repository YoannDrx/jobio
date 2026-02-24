"use client";

import { buttonVariants } from "@/components/ui/button";
import { fadeInScale } from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function FinalCtaSection() {
  const { ref, shouldAnimate } = useSectionInView();

  return (
    <section
      ref={ref}
      className="mx-auto w-full max-w-7xl px-4 pb-16 lg:px-8 lg:pb-20"
    >
      <motion.div
        className="relative overflow-hidden rounded-3xl border p-8 sm:p-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(34,211,238,0.1), rgba(16,185,129,0.1), rgba(139,92,246,0.1), rgba(34,211,238,0.1))",
          backgroundSize: "300% 100%",
        }}
        animate={
          shouldAnimate
            ? { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
            : {}
        }
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        variants={fadeInScale}
        initial={shouldAnimate ? "initial" : "animate"}
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            animate={
              shouldAnimate
                ? {
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="text-primary mb-3 size-5" />
          </motion.div>
          <h2 className="font-caption text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Prêt à transformer ta prospection en système de conversion ?
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Rejoins les freelances qui ne laissent plus aucune opportunité leur
            échapper.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/auth/signup"
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                Créer mon compte
                <ArrowRight className="size-4" />
              </Link>
            </motion.div>
            <Link
              href="/about"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
