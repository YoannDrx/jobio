import type { Transition, Variants } from "motion/react";

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

export const staggerContainer = (stagger = 0.1): Variants => ({
  animate: { transition: { staggerChildren: stagger } },
});

export const defaultTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94],
};
