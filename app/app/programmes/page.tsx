"use client";

import { EmptyState } from "@/components/nowts/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getProgrammesAction } from "@/features/programmes/programmes.action";
import { ProgrammeGrid } from "./_components/programme-grid";
import { BookOpen } from "lucide-react";
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

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Programmes LinkedIn</LayoutTitle>
        <LayoutDescription>
          Des templates de posts LinkedIn rédigés par des experts pour
          développer ta visibilité freelance et attirer des clients.
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent>
        {isLoading ? (
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
          <Tabs defaultValue="all" className="mt-4">
            <TabsList>
              <TabsTrigger value="all">Nos programmes</TabsTrigger>
              <TabsTrigger value="unlocked">
                Mes programmes débloqués ({unlockedPrograms.length})
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
