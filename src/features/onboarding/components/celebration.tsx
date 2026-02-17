"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function Celebration({
  duration = 3000,
  particleCount = 100,
}: {
  duration?: number;
  particleCount?: number;
}) {
  useEffect(() => {
    const end = Date.now() + duration;

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

    const frame = () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    confetti({
      particleCount: particleCount,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    });

    // Side cannons
    frame();

    return () => {
      confetti.reset();
    };
  }, [duration, particleCount]);

  return null;
}

export function triggerCelebration(options?: {
  duration?: number;
  particleCount?: number;
}) {
  const { duration = 3000, particleCount = 100 } = options ?? {};

  const end = Date.now() + duration;
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  const frame = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  confetti({
    particleCount: particleCount,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors,
  });

  frame();
}
