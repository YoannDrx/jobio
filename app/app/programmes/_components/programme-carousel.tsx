"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProgrammeCard } from "./programme-card";

type Program = {
  id: string;
  slug: string;
  title: string;
  description: string;
  authorName: string;
  authorImage?: string | null;
  price: number;
  isFree: boolean;
  templateCount: number;
  isUnlocked: boolean;
};

type ProgrammeCarouselProps = {
  programs: Program[];
};

export function ProgrammeCarousel({ programs }: ProgrammeCarouselProps) {
  if (programs.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Aucun programme disponible
      </p>
    );
  }

  return (
    <Carousel opts={{ align: "start", loop: false }} className="w-full">
      <CarouselContent className="-ml-4">
        {programs.map((program) => (
          <CarouselItem
            key={program.id}
            className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
          >
            <ProgrammeCard program={program} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 hidden md:flex" />
      <CarouselNext className="-right-4 hidden md:flex" />
    </Carousel>
  );
}
