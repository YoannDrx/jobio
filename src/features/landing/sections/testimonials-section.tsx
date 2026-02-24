"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { motion } from "motion/react";
import {
  fadeInUp,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { Quote, Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  initials: string;
  color: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Thomas R.",
    role: "Dev React freelance",
    quote:
      "Avant Jobio, je perdais 2h par semaine à suivre mes missions dans Notion. Maintenant tout est au même endroit et je ne rate plus aucune relance.",
    initials: "TR",
    color: "bg-brand-cyan",
  },
  {
    name: "Sarah M.",
    role: "Data Engineer freelance",
    quote:
      "Le scoring IA m'a fait gagner un temps fou. Je sais tout de suite si une mission vaut le coup.",
    initials: "SM",
    color: "bg-brand-violet",
  },
  {
    name: "Alex P.",
    role: "Product Manager freelance",
    quote:
      "La facturation intégrée, c'est le game changer. Plus besoin de jongler entre 3 outils.",
    initials: "AP",
    color: "bg-brand-emerald",
  },
];

export const TestimonialsSection = () => {
  const { ref, isInView, shouldAnimate } = useSectionInView();

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
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
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
              <Card className="border-border/70 h-full">
                <CardContent className="flex flex-col gap-4 p-6">
                  <motion.div
                    initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : {}}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                      delay: index * 0.1,
                    }}
                  >
                    <Quote className="text-primary/20 size-8" />
                  </motion.div>

                  <p className="text-sm leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>

                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={shouldAnimate ? { scale: 0 } : { scale: 1 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          delay: i * 0.06,
                        }}
                      >
                        <Star className="fill-brand-amber text-brand-amber size-4" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 border-t pt-4">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full text-sm font-bold text-white ${testimonial.color}`}
                    >
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
