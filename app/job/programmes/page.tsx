"use client";

import { EmptyState } from "@/components/nowts/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, LayoutContent, LayoutHeader } from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getProgrammesAction } from "@/features/programmes/programmes.action";
import { ProgrammeGrid } from "./_components/programme-grid";
import { BookOpen, Library, Sparkles, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function ProgrammesPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrograms = useCallback(async () => {
    try {
      const result = await resolveActionResult(getProgrammesAction());
      setPrograms(result);
    } catch {
      toast.error("Erreur lors du chargement des programmes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

  const unlockedPrograms = programs.filter((p) => p.isUnlocked);
  const totalTemplates = programs.reduce((sum, p) => sum + p.templateCount, 0);

  return (
    <Layout size="lg">
      <LayoutHeader>
        {/* Hero section */}
        <div className="relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/10 via-pink-500/5 to-orange-500/10 p-8 md:p-10">
          <div className="relative z-10 flex max-w-2xl flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15">
                <Library className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h1 className="font-caption text-2xl font-bold tracking-tight md:text-3xl">
                Programmes LinkedIn
              </h1>
            </div>
            <p className="text-muted-foreground max-w-lg text-sm leading-relaxed md:text-base">
              Des templates de posts LinkedIn rédigés par des experts pour
              développer ta visibilité freelance et attirer des clients.
            </p>
            {!isLoading && programs.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Badge
                  variant="secondary"
                  className="gap-1.5 border-none bg-violet-500/10 px-3 py-1 text-violet-600 dark:text-violet-400"
                >
                  <BookOpen className="size-3.5" />
                  {totalTemplates} templates
                </Badge>
                <Badge
                  variant="secondary"
                  className="gap-1.5 border-none bg-pink-500/10 px-3 py-1 text-pink-600 dark:text-pink-400"
                >
                  <Sparkles className="size-3.5" />
                  {programs.length} programmes
                </Badge>
                {unlockedPrograms.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 border-none bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <Unlock className="size-3.5" />
                    {unlockedPrograms.length} débloqué
                    {unlockedPrograms.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </LayoutHeader>

      <LayoutContent>
        {isLoading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucun programme disponible"
            description="Les programmes LinkedIn seront bientôt disponibles."
          />
        ) : (
          <Tabs defaultValue="all" className="mt-6">
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5">
                <Library className="size-3.5" />
                Tous les programmes
              </TabsTrigger>
              <TabsTrigger value="unlocked" className="gap-1.5">
                <Unlock className="size-3.5" />
                Débloqués ({unlockedPrograms.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <ProgrammeGrid programs={programs} />
            </TabsContent>
            <TabsContent value="unlocked" className="mt-6">
              {unlockedPrograms.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Aucun programme débloqué"
                  description="Débloque ton premier programme pour accéder aux templates LinkedIn."
                />
              ) : (
                <ProgrammeGrid programs={unlockedPrograms} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </LayoutContent>
    </Layout>
  );
}
