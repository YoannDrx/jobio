"use client";

import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/nowts/typography";
import { motion } from "motion/react";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Thomas R.",
    role: "Dev React freelance",
    quote:
      "Avant Jobio, je perdais 2h par semaine à suivre mes missions dans Notion. Maintenant tout est au même endroit et je ne rate plus aucune relance.",
  },
  {
    name: "Sarah M.",
    role: "Data Engineer freelance",
    quote:
      "Le scoring IA m'a fait gagner un temps fou. Je sais tout de suite si une mission vaut le coup.",
  },
  {
    name: "Alex P.",
    role: "Product Manager freelance",
    quote:
      "La facturation intégrée, c'est le game changer. Plus besoin de jongler entre 3 outils.",
  },
];

export const TestimonialsSection = () => {
  const { ref, isInView } = useSectionInView();

  return (
    <section ref={ref} className="bg-muted/30 py-16 lg:py-24" id="testimonials">
      <div className="container mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="mb-12 flex flex-col items-center gap-2 text-center">
          <Badge>Témoignages</Badge>
          <Typography variant="h2" className="max-w-2xl">
            Ils ont adopté Jobio.
          </Typography>
          <Typography variant="muted" className="max-w-lg text-base">
            Retours de freelances qui utilisent Jobio au quotidien.
          </Typography>
        </div>

        <motion.div
          className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3"
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          variants={staggerContainer(0.15)}
          transition={defaultTransition}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              transition={defaultTransition}
            >
              <div className="border-border/40 flex h-full flex-col justify-between rounded-xl border p-6">
                <p className="text-foreground/80 text-sm leading-relaxed">
                  &laquo;&nbsp;{testimonial.quote}&nbsp;&raquo;
                </p>
                <div className="border-border/30 mt-5 border-t pt-4">
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
