"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout, LayoutContent, LayoutHeader } from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getProgramDetailAction,
  verifyProgramPurchaseAction,
} from "@/features/programmes/programmes.action";
import { ProgrammeUnlockButton } from "../_components/programme-unlock-button";
import { TemplateDetailSheet } from "../_components/template-detail-sheet";
import { TemplateItem } from "../_components/template-item";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Template = {
  id: string;
  title: string;
  hook: string;
  body: string | null;
  tips: string | null;
  category: string | null;
  order: number;
};

type ProgramDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string | null;
  authorName: string;
  authorImage: string | null;
  price: number;
  currency: string;
  isFree: boolean;
  templateCount: number;
  coverImage: string | null;
  isUnlocked: boolean;
  templates: Template[];
};

const PROGRAM_GRADIENTS: Record<string, string> = {
  "se-lancer-linkedin": "from-emerald-500/15 via-emerald-400/5 to-transparent",
  "attirer-clients": "from-violet-500/15 via-violet-400/5 to-transparent",
  "personal-branding": "from-pink-500/15 via-pink-400/5 to-transparent",
  "exploser-croissance": "from-orange-500/15 via-orange-400/5 to-transparent",
};

const PROGRAM_ACCENTS: Record<
  string,
  { text: string; bg: string; initials: string; templateNum: string }
> = {
  "se-lancer-linkedin": {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    initials:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
    templateNum: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  "attirer-clients": {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    initials:
      "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/20",
    templateNum: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  "personal-branding": {
    text: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10",
    initials:
      "bg-pink-500/15 text-pink-700 dark:text-pink-300 ring-pink-500/20",
    templateNum: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  },
  "exploser-croissance": {
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    initials:
      "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/20",
    templateNum: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
};

const DEFAULT_ACCENT = {
  text: "text-primary",
  bg: "bg-primary/10",
  initials: "bg-primary/15 text-primary ring-primary/20",
  templateNum: "bg-primary/10 text-primary",
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

const CATEGORY_LABELS: Record<string, string> = {
  general: "Templates",
  introduction: "Introduction",
  "formats-viraux": "Formats viraux",
  "tech-cyber": "Posts tech / cybersécurité",
  "it-carriere": "Posts IT / carrière",
  "posts-avances": "Posts avancés",
};

export default function ProgrammeDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchProgram = useCallback(async () => {
    try {
      const result = await resolveActionResult(
        getProgramDetailAction({ slug: params.slug }),
      );
      setProgram(result);
    } catch {
      toast.error("Erreur lors du chargement du programme");
    } finally {
      setIsLoading(false);
    }
  }, [params.slug]);

  // Verify purchase if returning from Stripe
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      void resolveActionResult(verifyProgramPurchaseAction({ sessionId }))
        .then(() => {
          toast.success(
            "Achat confirmé ! Les templates sont maintenant disponibles.",
          );
          void fetchProgram();
        })
        .catch(() => {
          // Webhook may process later
        });
    }
  }, [searchParams, fetchProgram]);

  useEffect(() => {
    void fetchProgram();
  }, [fetchProgram]);

  const handleTemplateClick = (template: Template) => {
    if (!program?.isUnlocked) return;
    setSelectedTemplate(template);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <Layout size="lg">
        <LayoutHeader>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </LayoutHeader>
        <LayoutContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </LayoutContent>
      </Layout>
    );
  }

  if (!program) {
    return (
      <Layout size="lg">
        <LayoutContent>
          <p className="text-muted-foreground py-12 text-center">
            Programme introuvable
          </p>
        </LayoutContent>
      </Layout>
    );
  }

  const gradient =
    PROGRAM_GRADIENTS[program.slug] ??
    "from-primary/15 via-primary/5 to-transparent";
  const accent = PROGRAM_ACCENTS[program.slug] ?? DEFAULT_ACCENT;

  // Group templates by category
  const categories = program.templates.reduce<Record<string, Template[]>>(
    (acc, t) => {
      const cat = t.category ?? "general";
      acc[cat] = [...(acc[cat] ?? []), t];
      return acc;
    },
    {},
  );

  return (
    <Layout size="lg">
      <LayoutHeader>
        {/* Hero banner */}
        <div
          className={`relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} p-8 md:p-10`}
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground mb-4 -ml-2 gap-1.5"
          >
            <Link href="/job/programmes">
              <ArrowLeft className="size-4" />
              Retour aux programmes
            </Link>
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
            {/* Author avatar */}
            <div
              className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ring-2 ${accent.initials}`}
            >
              {getInitials(program.authorName)}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`${accent.bg} ${accent.text} border-none font-semibold`}
                >
                  {program.isFree ? (
                    <>
                      <Sparkles className="size-3" />
                      Gratuit
                    </>
                  ) : (
                    `${(program.price / 100).toFixed(0)}€`
                  )}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`${accent.bg} ${accent.text} gap-1.5 border-none`}
                >
                  <BookOpen className="size-3" />
                  {program.templateCount} templates
                </Badge>
                {program.isUnlocked && (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-none bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="size-3" />
                    Débloqué
                  </Badge>
                )}
              </div>

              <h1 className="font-caption text-2xl font-bold tracking-tight md:text-3xl">
                {program.title}
              </h1>

              <p className="text-muted-foreground text-sm">
                par {program.authorName}
              </p>
            </div>
          </div>
        </div>
      </LayoutHeader>

      <LayoutContent className="flex flex-col gap-6">
        {/* About the author */}
        <Card className="flex flex-row items-start gap-4 p-6">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accent.bg}`}
          >
            <User className={`size-5 ${accent.text}`} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">
              À propos de {program.authorName}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {program.description}
            </p>
          </div>
        </Card>

        {/* Long description */}
        {program.longDescription && (
          <Card
            className="border-l-4 p-6"
            style={{ borderLeftColor: "hsl(var(--primary))" }}
          >
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {program.longDescription}
            </p>
          </Card>
        )}

        {/* Unlock CTA */}
        {!program.isUnlocked && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-8">
            <p className="text-muted-foreground text-sm">
              Débloque ce programme pour accéder aux {program.templateCount}{" "}
              templates
            </p>
            <ProgrammeUnlockButton
              programId={program.id}
              programSlug={program.slug}
              isFree={program.isFree}
              price={program.price}
            />
          </div>
        )}

        {/* Templates list by category */}
        {Object.entries(categories).map(([cat, templates]) => (
          <div key={cat} className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <span
                className={`flex size-7 items-center justify-center rounded-lg ${accent.bg}`}
              >
                <BookOpen className={`size-3.5 ${accent.text}`} />
              </span>
              {CATEGORY_LABELS[cat] ?? cat}
              <span className="text-muted-foreground text-sm font-normal">
                ({templates.length})
              </span>
            </h3>
            <Card className="divide-border divide-y overflow-hidden py-0">
              {templates.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  isUnlocked={program.isUnlocked}
                  onClick={() => handleTemplateClick(template)}
                  accentColor={accent.templateNum}
                />
              ))}
            </Card>
          </div>
        ))}
      </LayoutContent>

      {/* Template detail sheet */}
      <TemplateDetailSheet
        template={selectedTemplate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Layout>
  );
}
