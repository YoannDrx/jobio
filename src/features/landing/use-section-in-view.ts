import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function useSectionInView(options?: {
  once?: boolean;
  margin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    margin: (options?.margin ?? "-80px") as any,
  });
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldAnimate(!mq.matches);

    const handler = (e: MediaQueryListEvent) => setShouldAnimate(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return { ref, isInView, shouldAnimate };
}
