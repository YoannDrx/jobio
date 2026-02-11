"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/features/form/submit-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { createFollowUpAction } from "../follow-ups.action";
import { getSequencesAction } from "@/features/sequences/sequences.action";
import type { Sequence } from "@/generated/prisma";
import type { SequenceStep } from "@/features/sequences/sequences.schema";

type FollowUpType = "EMAIL" | "CALL" | "MESSAGE" | "MEETING";

type ApplySequenceDialogProps = {
  missionId: string;
  missionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
};

function getTypeIcon(type: FollowUpType): ReactNode {
  switch (type) {
    case "EMAIL":
      return <Mail className="size-3" />;
    case "CALL":
      return <Phone className="size-3" />;
    default:
      return <Calendar className="size-3" />;
  }
}

export function ApplySequenceDialog({
  missionId,
  missionTitle,
  open,
  onOpenChange,
  onApplied,
}: ApplySequenceDialogProps) {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const loadSequences = async () => {
      try {
        const result = await resolveActionResult(getSequencesAction({}));
        setSequences(result);
        if (result.length > 0) {
          setSelectedSequenceId(result[0].id);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors du chargement",
        );
      }
    };

    if (open) {
      void loadSequences();
    }
  }, [open]);

  const selectedSequence = sequences.find((s) => s.id === selectedSequenceId);

  const handleApply = async () => {
    if (!selectedSequence) return;

    setIsApplying(true);
    try {
      const today = new Date();

      const createRequests: Promise<unknown>[] = [];

      const steps = selectedSequence.steps as SequenceStep[];
      for (const step of steps) {
        const scheduledAt = new Date(today);
        scheduledAt.setDate(scheduledAt.getDate() + step.delayDays);

        createRequests.push(
          resolveActionResult(
            createFollowUpAction({
              missionId,
              type: step.type as FollowUpType,
              title: step.title,
              scheduledAt,
            }),
          ),
        );
      }
      await Promise.all(createRequests);

      toast.success(`${steps.length} relances créées avec succès`);
      onOpenChange(false);
      onApplied?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Appliquer une séquence de relances</DialogTitle>
          <DialogDescription>{missionTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {sequences.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-muted-foreground text-sm">
                Aucune séquence créée.{" "}
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href="/app/sequences">Créer une séquence</Link>
                </Button>
              </p>
            </div>
          ) : (
            <>
              <RadioGroup
                value={selectedSequenceId}
                onValueChange={setSelectedSequenceId}
              >
                {sequences.map((sequence) => (
                  <div key={sequence.id} className="flex items-center gap-3">
                    <RadioGroupItem value={sequence.id} id={sequence.id} />
                    <Label
                      htmlFor={sequence.id}
                      className="flex-1 cursor-pointer"
                    >
                      {sequence.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {selectedSequence && (
                <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs font-medium">
                    Relances à créer
                  </p>
                  <div className="flex flex-col gap-2">
                    {(selectedSequence.steps as SequenceStep[]).map(
                      (step, index) => {
                        const scheduledAt = new Date();
                        scheduledAt.setDate(
                          scheduledAt.getDate() + step.delayDays,
                        );
                        const dateStr = scheduledAt.toLocaleDateString(
                          "fr-FR",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        );

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {getTypeIcon(step.type as FollowUpType)}
                              <span>{step.title}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {dateStr}
                            </Badge>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Annuler
          </Button>
          <LoadingButton
            loading={isApplying}
            onClick={() => void handleApply()}
          >
            Appliquer
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
