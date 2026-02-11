"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

const columns = [
  {
    title: "A postuler",
    color: "bg-blue-500",
    cards: [
      { name: "Dev React Senior — BNP", tjm: "600\u20AC/j" },
      { name: "Fullstack Node — Qonto", tjm: "550\u20AC/j" },
    ],
  },
  {
    title: "Postul\u00E9",
    color: "bg-amber-500",
    cards: [{ name: "Lead Front — Alan", tjm: "650\u20AC/j" }],
  },
  {
    title: "Entretien",
    color: "bg-orange-500",
    cards: [{ name: "Archi Cloud — Doctolib", tjm: "700\u20AC/j" }],
  },
];

export default function DemoKanban() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-border/50 bg-card/80 flex gap-2 rounded-xl border p-3 shadow-sm backdrop-blur-sm"
    >
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${col.color}`}
              aria-hidden="true"
            />
            <span className="text-muted-foreground text-xs font-medium">
              {col.title}
            </span>
            <span className="text-muted-foreground/60 ml-auto text-[10px]">
              {col.cards.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {col.cards.map((card, cardIdx) => (
              <motion.div
                key={cardIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.3,
                  delay: colIdx * 0.15 + cardIdx * 0.1,
                }}
                className="border-border/40 bg-background/60 flex flex-col gap-1 rounded-lg border p-2"
              >
                <span className="text-foreground text-[11px] leading-tight font-medium">
                  {card.name}
                </span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                    {card.tjm}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
