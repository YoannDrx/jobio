"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  fadeInUp,
  fadeInLeft,
  staggerContainer,
  defaultTransition,
} from "@/features/landing/motion-variants";
import { useSectionInView } from "@/features/landing/use-section-in-view";
import { motion } from "motion/react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const { ref, shouldAnimate } = useSectionInView();

  return (
    <section
      ref={ref}
      className="bg-muted/30 mx-auto w-full max-w-6xl px-4 py-14 lg:px-8 lg:py-20"
    >
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        {/* Left: Header */}
        <motion.div
          className="flex flex-col gap-3"
          variants={fadeInLeft}
          initial={shouldAnimate ? "initial" : "animate"}
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ ...defaultTransition, duration: 0.5 }}
        >
          <Badge className="w-fit">FAQ</Badge>
          <h2 className="font-caption text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            Tout ce que tu veux savoir avant de te lancer.
          </p>
        </motion.div>

        {/* Right: Accordion */}
        <motion.div
          variants={staggerContainer(0.06)}
          initial={shouldAnimate ? "initial" : "animate"}
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
        >
          <Card className="border-border/70">
            <CardContent className="p-2 sm:p-4">
              <Accordion type="single" collapsible>
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    variants={fadeInUp}
                    transition={defaultTransition}
                  >
                    <AccordionItem value={`faq-${index}`}>
                      <AccordionTrigger className="px-2 text-left text-base">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground px-2 text-sm">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
