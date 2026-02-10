"use client";

import type { ReactNode } from "react";
import { useState } from "react";
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

type FollowUpType = "EMAIL" | "CALL" | "MESSAGE" | "MEETING";

type SequenceStep = {
  daysOffset: number;
  type: FollowUpType;
  title: string;
};

type Sequence = {
  id: string;
  label: string;
  steps: SequenceStep[];
};

const SEQUENCES: Sequence[] = [
  {
    id: "standard",
    label: "Séquence standard (J+3, J+7, J+14)",
    steps: [
      { daysOffset: 3, type: "EMAIL", title: "Relance J+3" },
      { daysOffset: 7, type: "EMAIL", title: "Relance J+7" },
      { daysOffset: 14, type: "EMAIL", title: "Relance J+14" },
    ],
  },
  {
    id: "aggressive",
    label: "Séquence rapide (J+1, J+3, J+7)",
    steps: [
      { daysOffset: 1, type: "EMAIL", title: "Relance J+1" },
      { daysOffset: 3, type: "CALL", title: "Relance téléphonique J+3" },
      { daysOffset: 7, type: "EMAIL", title: "Relance J+7" },
    ],
  },
  {
    id: "post-interview",
    label: "Post-entretien (J+1, J+5)",
    steps: [
      { daysOffset: 1, type: "EMAIL", title: "Remerciement post-entretien" },
      { daysOffset: 5, type: "EMAIL", title: "Suivi post-entretien" },
    ],
  },
];

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
  const [selectedSequenceId, setSelectedSequenceId] =
    useState<string>("standard");
  const [isApplying, setIsApplying] = useState(false);

  const selectedSequence = SEQUENCES.find((s) => s.id === selectedSequenceId);

  const handleApply = async () => {
    if (!selectedSequence) return;

    setIsApplying(true);
    try {
      const today = new Date();

      for (const step of selectedSequence.steps) {
        const scheduledAt = new Date(today);
        scheduledAt.setDate(scheduledAt.getDate() + step.daysOffset);

        void resolveActionResult(
          createFollowUpAction({
            missionId,
            type: step.type,
            title: step.title,
            scheduledAt,
          }),
        );
      }

      toast.success(
        `${selectedSequence.steps.length} relances créées avec succès`,
      );
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
          <RadioGroup
            value={selectedSequenceId}
            onValueChange={setSelectedSequenceId}
          >
            {SEQUENCES.map((sequence) => (
              <div key={sequence.id} className="flex items-center gap-3">
                <RadioGroupItem value={sequence.id} id={sequence.id} />
                <Label htmlFor={sequence.id} className="flex-1 cursor-pointer">
                  {sequence.label}
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
                {selectedSequence.steps.map((step, index) => {
                  const scheduledAt = new Date();
                  scheduledAt.setDate(scheduledAt.getDate() + step.daysOffset);
                  const dateStr = scheduledAt.toLocaleDateString("fr-FR", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {getTypeIcon(step.type)}
                        <span>{step.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {dateStr}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
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
