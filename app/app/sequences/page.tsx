"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/nowts/empty-state";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createSequenceAction,
  updateSequenceAction,
  deleteSequenceAction,
  getSequencesAction,
} from "@/features/sequences/sequences.action";
import { SequenceForm } from "@/features/sequences/components/sequence-form";
import { SequenceList } from "@/features/sequences/components/sequence-list";
import type { CreateSequenceInput } from "@/features/sequences/sequences.schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ListOrdered, Plus } from "lucide-react";
import { toast } from "sonner";
import { FeatureGuide } from "@/components/nowts/feature-guide";
import type { Sequence } from "@/generated/prisma";

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sequence | null>(null);

  const fetchSequences = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(getSequencesAction({}));
      setSequences(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSequences();
  }, [fetchSequences]);

  const handleCreate = async (data: CreateSequenceInput) => {
    try {
      await resolveActionResult(createSequenceAction(data));
      toast.success("Séquence créée avec succès");
      setShowForm(false);
      void fetchSequences();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleUpdate = async (data: CreateSequenceInput) => {
    if (!editing) return;
    try {
      await resolveActionResult(
        updateSequenceAction({
          id: editing.id,
          ...data,
        }),
      );
      toast.success("Séquence mise à jour");
      setShowForm(false);
      setEditing(null);
      void fetchSequences();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleEdit = (sequence: Sequence) => {
    setEditing(sequence);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await resolveActionResult(deleteSequenceAction({ id }));
      toast.success("Séquence supprimée");
      void fetchSequences();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <div className="flex items-center gap-1">
          <LayoutTitle>Séquences ({sequences.length})</LayoutTitle>
          <FeatureGuide title="Séquences">
            <p>
              Une séquence est un plan de relance automatique en plusieurs
              étapes. Par exemple : Email J+3, Relance J+7, Appel J+14.
            </p>
            <p>
              Crée une séquence, puis applique-la depuis une mission. Les
              relances seront créées automatiquement.
            </p>
          </FeatureGuide>
        </div>
        <LayoutDescription>
          Automatise tes relances avec des plans de suivi en plusieurs étapes.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="size-4" />
          Nouvelle séquence
        </Button>
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : sequences.length === 0 ? (
          <EmptyState
            icon={ListOrdered}
            title="Aucune séquence"
            description="Crée ta première séquence pour automatiser tes relances."
            action={{
              label: "Créer une séquence",
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <SequenceList
            sequences={sequences}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </LayoutContent>

      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier la séquence" : "Nouvelle séquence"}
            </DialogTitle>
          </DialogHeader>
          <SequenceForm
            key={editing?.id ?? "new"}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    description: editing.description ?? "",
                    steps: editing.steps as CreateSequenceInput["steps"],
                  }
                : undefined
            }
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCloseForm}
            submitLabel={editing ? "Modifier" : "Créer la séquence"}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
