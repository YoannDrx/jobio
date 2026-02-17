"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Typography } from "@/components/nowts/typography";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import type { Sequence } from "@/generated/prisma";

type SequenceListProps = {
  sequences: Sequence[];
  onEdit: (sequence: Sequence) => void;
  onDelete: (id: string) => void;
};

export function SequenceList({
  sequences,
  onEdit,
  onDelete,
}: SequenceListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteConfirm = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {sequences.map((sequence) => {
        const steps = sequence.steps as { delayDays: number }[];

        return (
          <Card key={sequence.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{sequence.name}</h3>
                  {sequence.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Par défaut
                    </Badge>
                  )}
                </div>
                {sequence.description && (
                  <Typography variant="muted" className="mt-1">
                    {sequence.description}
                  </Typography>
                )}
                <div className="text-muted-foreground mt-2 text-xs">
                  {steps.length} étape{steps.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(sequence)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={sequence.isDefault}
                  onClick={() => setDeleteConfirm(sequence.id)}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la séquence</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La séquence sera
              définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  handleDeleteConfirm(deleteConfirm);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
