"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FollowUpForm } from "@/features/follow-ups/components/follow-up-form";
import { FollowUpList } from "@/features/follow-ups/components/follow-up-list";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  completeFollowUpAction,
  createFollowUpAction,
  deleteFollowUpAction,
  snoozeFollowUpAction,
  updateFollowUpAction,
} from "@/features/follow-ups/follow-ups.action";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { MissionWithRelations } from "./mission-detail-header";

type MissionDetailFollowUpsProps = {
  mission: MissionWithRelations;
  onRefresh?: () => void;
};

export function MissionDetailFollowUps({
  mission,
  onRefresh,
}: MissionDetailFollowUpsProps) {
  const [followUps, setFollowUps] = useState(mission.followUps);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setFollowUps(mission.followUps);
    setEditingFollowUpId(null);
    setFollowUpDialogOpen(false);
  }, [mission]);

  const pendingFollowUps = followUps.filter((f) => !f.completedAt);
  const editingFollowUp = followUps.find((f) => f.id === editingFollowUpId);

  const handleCreateOrUpdateFollowUp = async (values: {
    type: "EMAIL" | "CALL" | "MESSAGE" | "MEETING";
    title: string;
    description?: string;
    scheduledAt: Date;
    templateId?: string;
  }) => {
    try {
      if (editingFollowUp) {
        const updated = await resolveActionResult(
          updateFollowUpAction({
            id: editingFollowUp.id,
            ...values,
            description: values.description ?? "",
          }),
        );

        setFollowUps((prev) =>
          prev.map((f) =>
            f.id === editingFollowUp.id ? { ...f, ...updated } : f,
          ),
        );
        toast.success("Relance mise à jour");
      } else {
        const created = await resolveActionResult(
          createFollowUpAction({
            missionId: mission.id,
            ...values,
            description: values.description ?? "",
          }),
        );
        setFollowUps((prev) =>
          [...prev, created].sort(
            (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt),
          ),
        );
        toast.success("Relance planifiée");
      }

      setEditingFollowUpId(null);
      setFollowUpDialogOpen(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
      throw error;
    }
  };

  const handleCompleteFollowUp = async (id: string) => {
    try {
      await resolveActionResult(completeFollowUpAction({ id }));
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, completedAt: new Date() } : f)),
      );
      toast.success("Relance complétée");
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    try {
      await resolveActionResult(deleteFollowUpAction({ id }));
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
      toast.success("Relance supprimée");
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleSnoozeFollowUp = async (id: string) => {
    const followUp = followUps.find((f) => f.id === id);
    if (!followUp) return;

    const nextDate = new Date(followUp.scheduledAt);
    nextDate.setDate(nextDate.getDate() + 1);

    if (nextDate <= new Date()) {
      nextDate.setHours(new Date().getHours() + 2);
    }

    try {
      const updated = await resolveActionResult(
        snoozeFollowUpAction({ id, scheduledAt: nextDate }),
      );

      setFollowUps((prev) =>
        prev
          .map((f) => (f.id === id ? { ...f, ...updated } : f))
          .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)),
      );
      toast.success("Relance reportée de 1 jour");
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium">
            Prochaines actions ({pendingFollowUps.length})
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingFollowUpId(null);
              setFollowUpDialogOpen(true);
            }}
          >
            Planifier une relance
          </Button>
        </div>
        {pendingFollowUps.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune relance planifiée
          </p>
        ) : (
          <FollowUpList
            followUps={pendingFollowUps}
            onComplete={handleCompleteFollowUp}
            onDelete={handleDeleteFollowUp}
            onEdit={(id) => {
              setEditingFollowUpId(id);
              setFollowUpDialogOpen(true);
            }}
            onSnooze={handleSnoozeFollowUp}
          />
        )}
      </div>

      <Dialog
        open={followUpDialogOpen}
        onOpenChange={(openState) => {
          setFollowUpDialogOpen(openState);
          if (!openState) {
            setEditingFollowUpId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFollowUp
                ? "Modifier la relance"
                : "Planifier une relance"}
            </DialogTitle>
          </DialogHeader>
          <FollowUpForm
            key={editingFollowUp?.id ?? "new-follow-up"}
            defaultValues={
              editingFollowUp
                ? {
                    type: editingFollowUp.type as
                      | "EMAIL"
                      | "CALL"
                      | "MESSAGE"
                      | "MEETING",
                    title: editingFollowUp.title,
                    description: editingFollowUp.description ?? "",
                    scheduledAt: new Date(editingFollowUp.scheduledAt),
                    templateId: editingFollowUp.templateId ?? undefined,
                  }
                : undefined
            }
            submitLabel={editingFollowUp ? "Mettre à jour" : "Planifier"}
            onCancel={() => {
              setFollowUpDialogOpen(false);
              setEditingFollowUpId(null);
            }}
            onSubmit={handleCreateOrUpdateFollowUp}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
