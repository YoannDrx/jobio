"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  archiveMissionAction,
  deleteMissionAction,
  updateMissionAction,
} from "@/features/missions/missions.action";
import { Archive, Mail, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { ScoreBreakdown as ScoreBreakdownType } from "@/features/missions/mission-scoring";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  MissionDetailHeader,
  type MissionWithRelations,
} from "./mission-detail-header";
import { MissionDetailInfo } from "./mission-detail-info";
import { MissionDetailFollowUps } from "./mission-detail-follow-ups";
import { MissionDetailEmails } from "./mission-detail-emails";
import { MissionDetailContacts } from "./mission-detail-contacts";
import { MissionDetailActivity } from "./mission-detail-activity";
import { getTemplatesAction } from "@/features/templates/templates.action";

const ScoreBreakdown = dynamic(
  async () =>
    import("@/features/missions/components/score-breakdown").then(
      (m) => m.ScoreBreakdown,
    ),
  { ssr: false },
);

const SendEmailDialog = dynamic(
  async () =>
    import("@/features/emails/components/send-email-dialog").then(
      (m) => m.SendEmailDialog,
    ),
  { ssr: false },
);

type MissionDetailSheetProps = {
  mission: MissionWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (mission: MissionWithRelations) => void;
  onRefresh?: () => void;
};

export function MissionDetailSheet({
  mission,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: MissionDetailSheetProps) {
  const [notes, setNotes] = useState(mission?.notes ?? "");
  const [localScore, setLocalScore] = useState(mission?.score ?? 0);
  const [localBreakdown, setLocalBreakdown] = useState<
    ScoreBreakdownType["breakdown"] | null
  >(
    (mission?.scoreBreakdown as ScoreBreakdownType["breakdown"] | null) ?? null,
  );
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [templates, setTemplates] = useState<
    {
      id: string;
      name: string;
      type: string;
      subject: string | null;
      body: string;
    }[]
  >([]);

  useEffect(() => {
    setLocalScore(mission?.score ?? 0);
    setLocalBreakdown(
      (mission?.scoreBreakdown as ScoreBreakdownType["breakdown"] | null) ??
        null,
    );
  }, [mission?.score, mission?.scoreBreakdown]);

  useEffect(() => {
    setNotes(mission?.notes ?? "");
  }, [mission?.notes]);

  useEffect(() => {
    if (open && mission) {
      resolveActionResult(getTemplatesAction({}))
        .then((result) => {
          setTemplates(result);
        })
        .catch(() => {
          // silently fail, templates are optional
        });
    }
  }, [open, mission]);

  if (!mission) return null;

  const handleSaveNotes = async () => {
    try {
      await resolveActionResult(updateMissionAction({ id: mission.id, notes }));
      toast.success("Notes sauvegardées");
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleArchive = async () => {
    try {
      await resolveActionResult(archiveMissionAction({ id: mission.id }));
      toast.success("Mission archivée");
      onOpenChange(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleDelete = async () => {
    try {
      await resolveActionResult(deleteMissionAction({ id: mission.id }));
      toast.success("Mission supprimée");
      onOpenChange(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <MissionDetailHeader
            mission={mission}
            localScore={localScore}
            localBreakdown={localBreakdown}
            isRecalculating={false}
            onRecalculate={(score, breakdown) => {
              setLocalScore(score);
              setLocalBreakdown(breakdown);
            }}
          />
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          {localBreakdown && <ScoreBreakdown breakdown={localBreakdown} />}

          <MissionDetailInfo mission={mission} />

          <Separator />

          <MissionDetailFollowUps mission={mission} onRefresh={onRefresh} />

          <Separator />

          <MissionDetailEmails mission={mission} onRefresh={onRefresh} />

          <MissionDetailContacts mission={mission} onRefresh={onRefresh} />

          <Separator />

          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des notes..."
              rows={3}
            />
            {notes !== (mission.notes ?? "") && (
              <Button variant="outline" size="sm" onClick={handleSaveNotes}>
                Sauvegarder les notes
              </Button>
            )}
          </div>

          <Separator />

          <MissionDetailActivity events={mission.activityEvents} />

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailDialog(true)}
              disabled={!mission.contact?.email}
            >
              <Mail className="size-4" />
              Email
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(mission)}
              >
                <Pencil className="size-4" />
                Modifier
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="size-4" />
              Archiver
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </div>

          <SendEmailDialog
            open={showEmailDialog}
            onOpenChange={setShowEmailDialog}
            mission={mission}
            templates={templates}
            onSent={onRefresh}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
