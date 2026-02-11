"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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

export default function ProgrammeDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
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

  // Group templates by category if they have one
  const categories = program.templates.reduce<Record<string, Template[]>>(
    (acc, t) => {
      const cat = t.category ?? "general";
      acc[cat] = [...(acc[cat] ?? []), t];
      return acc;
    },
    {},
  );

  const CATEGORY_LABELS: Record<string, string> = {
    general: "Templates",
    "formats-viraux": "Formats viraux",
    "tech-cyber": "Posts tech / cybersécurité",
    "it-carriere": "Posts IT / carrière",
    "posts-avances": "Posts avancés",
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-1">
          <Link href="/app/programmes">
            <ArrowLeft className="size-4" />
            Retour aux programmes
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {program.isFree
              ? "Gratuit"
              : `${(program.price / 100).toFixed(0)}€`}
          </Badge>
          {program.isUnlocked && (
            <Badge variant="default" className="gap-1 bg-emerald-600">
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
          <Card className="p-6">
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {program.longDescription}
            </p>
          </Card>
        )}

        {/* Unlock CTA */}
        {!program.isUnlocked && (
          <div className="flex justify-center py-4">
            <ProgrammeUnlockButton
              programId={program.id}
              programSlug={program.slug}
              isFree={program.isFree}
              price={program.price}
            />
          </div>
        )}

        {/* Templates list */}
        {Object.entries(categories).map(([cat, templates]) => (
          <div key={cat}>
            <h3 className="mb-3 text-lg font-semibold">
              {CATEGORY_LABELS[cat] ?? cat}
            </h3>
            <Card className="divide-border divide-y overflow-hidden">
              {templates.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  isUnlocked={program.isUnlocked}
                  onClick={() => handleTemplateClick(template)}
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
