"use client";

import { motion } from "motion/react";

const columns = [
  {
    title: "A postuler",
    count: 2,
    dot: "bg-blue-400",
    headerBorder: "border-blue-400/40",
    cards: [
      {
        name: "Dev React Senior",
        company: "BNP Paribas",
        tjm: "600\u20AC/j",
        score: 87,
        scoreColor: "text-emerald-400",
        tags: ["React", "TypeScript"],
      },
      {
        name: "Fullstack Node",
        company: "Qonto",
        tjm: "550\u20AC/j",
        score: 72,
        scoreColor: "text-amber-400",
        tags: ["Node.js", "PostgreSQL"],
      },
    ],
  },
  {
    title: "Postul\u00E9",
    count: 1,
    dot: "bg-amber-400",
    headerBorder: "border-amber-400/40",
    cards: [
      {
        name: "Lead Front",
        company: "Alan",
        tjm: "650\u20AC/j",
        score: 91,
        scoreColor: "text-emerald-400",
        tags: ["React", "Design System"],
      },
    ],
  },
  {
    title: "Entretien",
    count: 1,
    dot: "bg-orange-400",
    headerBorder: "border-orange-400/40",
    cards: [
      {
        name: "Archi Cloud",
        company: "Doctolib",
        tjm: "700\u20AC/j",
        score: 95,
        scoreColor: "text-emerald-400",
        tags: ["AWS", "Terraform"],
      },
    ],
  },
  {
    title: "Gagn\u00E9",
    count: 1,
    dot: "bg-emerald-400",
    headerBorder: "border-emerald-400/40",
    cards: [
      {
        name: "Tech Lead",
        company: "Swile",
        tjm: "680\u20AC/j",
        score: 93,
        scoreColor: "text-emerald-400",
        tags: ["React", "Node.js"],
      },
    ],
  },
];

export default function DemoKanban() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14] shadow-2xl"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-500/70" />
          <div className="size-2.5 rounded-full bg-amber-500/70" />
          <div className="size-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <span className="ml-2 text-[10px] font-medium text-white/30">
          Pipeline missions
        </span>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 p-4">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex min-w-0 flex-1 flex-col gap-2.5">
            {/* Column header */}
            <div
              className={`flex items-center gap-2 border-b pb-2 ${col.headerBorder}`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${col.dot}`}
                aria-hidden="true"
              />
              <span className="truncate text-[11px] font-semibold text-white/80">
                {col.title}
              </span>
              <span className="ml-auto shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/40">
                {col.count}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
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
                  className="group flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.05]"
                >
                  {/* Title + Score */}
                  <div className="flex items-start justify-between gap-1">
                    <span className="min-w-0 truncate text-[11px] leading-tight font-semibold text-white/90">
                      {card.name}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] font-bold ${card.scoreColor}`}
                    >
                      {card.score}
                    </span>
                  </div>

                  {/* Company */}
                  <span className="text-[10px] text-white/40">
                    {card.company}
                  </span>

                  {/* Tags + TJM */}
                  <div className="flex flex-wrap items-center gap-1">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-medium text-white/50"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] font-semibold text-cyan-400/80">
                      {card.tjm}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
