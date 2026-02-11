"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Unlock, BookOpen } from "lucide-react";
import Link from "next/link";

type ProgrammeCardProps = {
  program: {
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
};

const PROGRAM_COLORS: Record<string, string> = {
  "se-lancer-linkedin":
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "attirer-clients": "bg-violet-500/10 text-violet-500 border-violet-500/20",
  "personal-branding": "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "exploser-croissance":
    "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const PROGRAM_ACCENT: Record<string, string> = {
  "se-lancer-linkedin": "from-emerald-500/20 to-emerald-500/5",
  "attirer-clients": "from-violet-500/20 to-violet-500/5",
  "personal-branding": "from-pink-500/20 to-pink-500/5",
  "exploser-croissance": "from-orange-500/20 to-orange-500/5",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProgrammeCard({ program }: ProgrammeCardProps) {
  const colorClass =
    PROGRAM_COLORS[program.slug] ??
    "bg-primary/10 text-primary border-primary/20";
  const accentClass =
    PROGRAM_ACCENT[program.slug] ?? "from-primary/20 to-primary/5";

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      {/* Gradient header */}
      <div className={`bg-gradient-to-b ${accentClass} px-5 pt-5 pb-6`}>
        <div className="flex items-start justify-between">
          <Badge variant="outline" className={colorClass}>
            {program.isFree
              ? "Gratuit"
              : `${(program.price / 100).toFixed(0)}€`}
          </Badge>
          {/* Author avatar */}
          <div className="bg-muted flex size-10 items-center justify-center rounded-full text-xs font-semibold">
            {getInitials(program.authorName)}
          </div>
        </div>
        <h3 className="mt-3 text-lg leading-tight font-bold">
          {program.title}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          par {program.authorName}
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-5">
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {program.description}
        </p>

        <div className="flex items-center gap-2">
          <BookOpen className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">
            {program.templateCount} templates
          </span>
        </div>

        {/* Status + CTA */}
        <div className="mt-auto">
          {program.isUnlocked ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/app/programmes/${program.slug}`}>
                <Unlock className="size-4" />
                Voir les templates
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href={`/app/programmes/${program.slug}`}>
                <Lock className="size-4" />
                {program.isFree
                  ? "Débloquer gratuitement"
                  : `Débloquer pour ${(program.price / 100).toFixed(0)}€`}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
