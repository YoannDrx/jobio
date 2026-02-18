"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function FreelanceContentWrapper({ children }: PropsWithChildren) {
  const { state } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 px-1.5 pt-0 pb-4 sm:px-2.5 lg:px-3.5",
        state === "expanded" && "mx-auto w-full max-w-5xl",
      )}
    >
      {children}
    </div>
  );
}
