"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
  { border: string; badge: string; glow: string }
> = {
  "se-lancer-linkedin": {
    border: "border-t-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    glow: "group-hover:shadow-emerald-500/10",
  },
  "attirer-clients": {
    border: "border-t-violet-500",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    glow: "group-hover:shadow-violet-500/10",
  },
  "personal-branding": {
    border: "border-t-pink-500",
    badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    glow: "group-hover:shadow-pink-500/10",
  },
  "exploser-croissance": {
    border: "border-t-orange-500",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    glow: "group-hover:shadow-orange-500/10",
  },
};

const DEFAULT_STYLE = {
  border: "border-t-primary",
  badge: "bg-primary/10 text-primary",
  glow: "group-hover:shadow-primary/10",
};

export function ProgrammeCard({ program }: ProgrammeCardProps) {
  const style = PROGRAM_STYLES[program.slug] ?? DEFAULT_STYLE;

  return (
    <Card
      className={`group border-t-4 ${style.border} ${style.glow} flex h-full flex-col transition-shadow hover:shadow-lg`}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
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
          {program.isUnlocked && (
            <Badge
              variant="secondary"
              className="border-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle className="size-3" />
              Débloqué
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{program.title}</CardTitle>
        <p className="text-muted-foreground text-xs">
          par {program.authorName}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {program.description}
        </p>

        <div className="text-muted-foreground mt-auto flex items-center gap-1.5 text-sm">
          <BookOpen className="size-3.5" />
          <span>{program.templateCount} templates</span>
        </div>
      </CardContent>

      <CardFooter>
        {program.isUnlocked ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/app/programmes/${program.slug}`}>
              Voir les templates
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/app/programmes/${program.slug}`}>
              <Lock className="size-4" />
              {program.isFree
                ? "Débloquer gratuitement"
                : `Débloquer pour ${(program.price / 100).toFixed(0)} €`}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
