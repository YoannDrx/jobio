"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { BookOpen, CheckCircle, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

type ProgrammeCardProps = {
  program: {
    id: string;
    slug: string;
    title: string;
    description: string;
    authorName: string;
    price: number;
    isFree: boolean;
    templateCount: number;
    isUnlocked: boolean;
  };
};

const PROGRAM_STYLES: Record<
  string,
  {
    gradient: string;
    badge: string;
    accent: string;
    initials: string;
    cta: string;
  }
> = {
  "se-lancer-linkedin": {
    gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accent: "text-emerald-600 dark:text-emerald-400",
    initials:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
    cta: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  "attirer-clients": {
    gradient: "from-violet-500/20 via-violet-400/10 to-transparent",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    accent: "text-violet-600 dark:text-violet-400",
    initials:
      "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/20",
    cta: "bg-violet-600 hover:bg-violet-700 text-white",
  },
  "personal-branding": {
    gradient: "from-pink-500/20 via-pink-400/10 to-transparent",
    badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    accent: "text-pink-600 dark:text-pink-400",
    initials:
      "bg-pink-500/15 text-pink-700 dark:text-pink-300 ring-pink-500/20",
    cta: "bg-pink-600 hover:bg-pink-700 text-white",
  },
  "exploser-croissance": {
    gradient: "from-orange-500/20 via-orange-400/10 to-transparent",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    accent: "text-orange-600 dark:text-orange-400",
    initials:
      "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/20",
    cta: "bg-orange-600 hover:bg-orange-700 text-white",
  },
};

const DEFAULT_STYLE = {
  gradient: "from-primary/20 via-primary/10 to-transparent",
  badge: "bg-primary/10 text-primary",
  accent: "text-primary",
  initials: "bg-primary/15 text-primary ring-primary/20",
  cta: "bg-primary hover:bg-primary/90 text-primary-foreground",
};

function getInitials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProgrammeCard({ program }: ProgrammeCardProps) {
  const style = PROGRAM_STYLES[program.slug] ?? DEFAULT_STYLE;

  return (
    <Link href={`/job/programmes/${program.slug}`} className="group block">
      <Card className="relative flex h-full flex-col overflow-hidden border-0 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {/* Gradient header */}
        <div
          className={`bg-gradient-to-b ${style.gradient} absolute inset-x-0 top-0 h-28`}
        />

        <CardHeader className="relative z-10 pb-2">
          {/* Avatar + badges row */}
          <div className="flex items-start justify-between">
            <div
              className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ring-2 ${style.initials}`}
            >
              {getInitials(program.authorName)}
            </div>
            <div className="flex items-center gap-1.5">
              {program.isUnlocked && (
                <Badge
                  variant="secondary"
                  className="border-none bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle className="size-3" />
                  Débloqué
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={`${style.badge} border-none font-semibold`}
              >
                {program.isFree ? (
                  <>
                    <Sparkles className="size-3" />
                    Gratuit
                  </>
                ) : (
                  `${(program.price / 100).toFixed(0)} €`
                )}
              </Badge>
            </div>
          </div>

          {/* Title + author */}
          <div className="mt-3 flex flex-col gap-1">
            <h3 className="text-base leading-tight font-semibold tracking-tight">
              {program.title}
            </h3>
            <p className="text-muted-foreground text-xs">
              par {program.authorName}
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-1 flex-col gap-3 pt-0">
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {program.description}
          </p>

          <div
            className={`mt-auto flex items-center gap-1.5 text-sm font-medium ${style.accent}`}
          >
            <BookOpen className="size-3.5" />
            <span>{program.templateCount} templates</span>
          </div>
        </CardContent>

        <CardFooter className="relative z-10 pt-0">
          {program.isUnlocked ? (
            <Button variant="outline" className="w-full" size="sm">
              Voir les templates
            </Button>
          ) : (
            <Button className={`w-full ${style.cta}`} size="sm">
              {program.isFree ? (
                <>
                  <Sparkles className="size-3.5" />
                  Débloquer gratuitement
                </>
              ) : (
                <>
                  <Lock className="size-3.5" />
                  Débloquer pour {(program.price / 100).toFixed(0)} €
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

export { PROGRAM_STYLES, DEFAULT_STYLE };
