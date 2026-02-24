"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getProgramDetailAction,
  verifyProgramPurchaseAction,
} from "@/features/programmes/programmes.action";
import { ProgrammeUnlockButton } from "../_components/programme-unlock-button";
import { TemplateDetailSheet } from "../_components/template-detail-sheet";
import { TemplateItem } from "../_components/template-item";
import { ArrowLeft, BookOpen, CheckCircle2, Sparkles } from "lucide-react";
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

const PROGRAM_COLORS: Record<
  string,
  { border: string; badge: string; accent: string; templateNum: string }
> = {
  "se-lancer-linkedin": {
    border: "border-t-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accent: "text-emerald-600 dark:text-emerald-400",
    templateNum: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  "attirer-clients": {
    border: "border-t-violet-500",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    accent: "text-violet-600 dark:text-violet-400",
    templateNum: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  "personal-branding": {
    border: "border-t-pink-500",
    badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    accent: "text-pink-600 dark:text-pink-400",
    templateNum: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  },
  "exploser-croissance": {
    border: "border-t-orange-500",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    accent: "text-orange-600 dark:text-orange-400",
    templateNum: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
};

const DEFAULT_COLOR = {
  border: "border-t-primary",
  badge: "bg-primary/10 text-primary",
  accent: "text-primary",
  templateNum: "bg-primary/10 text-primary",
};

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
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
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

  const color = PROGRAM_COLORS[program.slug] ?? DEFAULT_COLOR;

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
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-1">
          <Link href="/job/programmes">
            <ArrowLeft className="size-4" />
            Retour aux programmes
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={`${color.badge} border-none font-semibold`}
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
            className={`${color.badge} gap-1.5 border-none`}
          >
            <BookOpen className="size-3" />
            {program.templateCount} templates
          </Badge>
          {program.isUnlocked && (
            <Badge
              variant="default"
              className="gap-1 bg-emerald-600 text-white"
            >
              <CheckCircle2 className="size-3" />
              Débloqué
            </Badge>
          )}
        </div>
        <LayoutTitle>{program.title}</LayoutTitle>
        <LayoutDescription>par {program.authorName}</LayoutDescription>
      </LayoutHeader>

      <LayoutContent className="flex flex-col gap-6">
        {/* Long description */}
        {program.longDescription && (
          <Card className={`border-t-4 ${color.border} p-6`}>
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
          <div key={cat}>
            <h3 className="mb-3 text-lg font-semibold">
              {CATEGORY_LABELS[cat] ?? cat}
              <span className="text-muted-foreground ml-2 text-sm font-normal">
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
                  accentColor={color.templateNum}
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
