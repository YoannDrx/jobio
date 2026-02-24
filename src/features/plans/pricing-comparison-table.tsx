"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PRICING_COMPARISON_CATEGORIES } from "./pricing-matrix";

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="flex items-center justify-center">
        <Check className="size-4 text-green-600" />
      </span>
    ) : (
      <span className="flex items-center justify-center">
        <X className="text-muted-foreground/40 size-4" />
      </span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function PricingComparisonTable() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set([PRICING_COMPARISON_CATEGORIES[0].name]),
  );

  const toggle = (name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Sticky plan header */}
      <div className="bg-background/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="grid grid-cols-[1fr_repeat(3,80px)] gap-1 px-4 py-3 sm:grid-cols-[1fr_repeat(3,minmax(100px,1fr))]">
          <div />
          <div className="text-muted-foreground text-center text-xs font-semibold tracking-wider uppercase">
            Free
          </div>
          <div className="text-primary text-center text-xs font-semibold tracking-wider uppercase">
            Pro
          </div>
          <div className="text-muted-foreground text-center text-xs font-semibold tracking-wider uppercase">
            Ultra
          </div>
        </div>
      </div>

      {/* Categories */}
      {PRICING_COMPARISON_CATEGORIES.map((category) => {
        const isOpen = openCategories.has(category.name);

        return (
          <div
            key={category.name}
            className="border-border/50 overflow-hidden rounded-lg border"
          >
            {/* Category header — clickable */}
            <button
              type="button"
              onClick={() => toggle(category.name)}
              className={cn(
                "hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                isOpen && "bg-muted/30",
              )}
            >
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
              <span className="text-sm font-semibold">{category.name}</span>
              <span className="text-muted-foreground/60 ml-auto text-xs">
                {category.features.length}
              </span>
            </button>

            {/* Expandable feature rows */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="overflow-hidden"
                >
                  <div className="border-t">
                    {category.features.map((feature, idx) => (
                      <div
                        key={`${category.name}-${idx}`}
                        className={cn(
                          "grid grid-cols-[1fr_repeat(3,80px)] gap-1 px-4 py-3 sm:grid-cols-[1fr_repeat(3,minmax(100px,1fr))]",
                          idx !== category.features.length - 1 &&
                            "border-border/30 border-b",
                        )}
                      >
                        <span className="text-muted-foreground text-sm">
                          {feature.name}
                        </span>
                        <div className="text-center">
                          <FeatureValue value={feature.free} />
                        </div>
                        <div className="bg-primary/5 -my-3 flex items-center justify-center rounded-sm py-3">
                          <FeatureValue value={feature.pro} />
                        </div>
                        <div className="text-center">
                          <FeatureValue value={feature.ultra} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
