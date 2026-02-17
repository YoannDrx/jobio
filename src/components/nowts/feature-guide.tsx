"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

type FeatureGuideProps = {
  title: string;
  children: ReactNode;
};

export function FeatureGuide({ title, children }: FeatureGuideProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <HelpCircle className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <div className="text-muted-foreground text-sm">{children}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
