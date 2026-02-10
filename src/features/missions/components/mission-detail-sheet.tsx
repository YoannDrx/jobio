"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/nowts/score-ring";
import { StatusBadge } from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  archiveMissionAction,
  deleteMissionAction,
  recalculateScoreAction,
  updateMissionAction,
} from "@/features/missions/missions.action";
import { QuickCreateContactDialog } from "@/features/contacts/components/quick-create-contact-dialog";
import {
  Archive,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Monitor,
  Pencil,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Eye,
  MousePointer,
  AlertCircle,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SendEmailDialog } from "@/features/emails/components/send-email-dialog";
import { getTemplatesAction } from "@/features/templates/templates.action";
import {
  getSentEmailsAction,
  getDraftsAction,
} from "@/features/emails/send-mission-email.action";
import { toast } from "sonner";

type MissionWithRelations = {
  id: string;
  title: string;
  company: string | null;
  description: string | null;
  status: MissionStatus;
  priority: string;
  tjm: number | null;
  duration: string | null;
  workType: string | null;
  location: string | null;
  stack: string[];
  sourceUrl: string | null;
  score: number;
  notes: string | null;
  createdAt: Date;
  platform: { name: string } | null;
  profile: { id: string; name: string } | null;
  contact: {
    firstName: string;
    lastName: string;
    company: string | null;
    email: string | null;
    role: string | null;
  } | null;
  followUps: {
    id: string;
    title: string;
    scheduledAt: Date;
    completedAt: Date | null;
    type: string;
  }[];
  activityEvents: {
    id: string;
    type: string;
    description: string | null;
    createdAt: Date;
  }[];
};

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
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
  const [templates, setTemplates] = useState<
    {
      id: string;
      name: string;
      type: string;
      subject: string | null;
      body: string;
    }[]
  >([]);
  const [sentEmails, setSentEmails] = useState<
    {
      id: string;
      to: string;
      subject: string;
      status: string;
      isDraft: boolean;
      createdAt: Date;
      openedAt: Date | null;
      clickedAt: Date | null;
    }[]
  >([]);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    setLocalScore(mission?.score ?? 0);
  }, [mission?.score]);

  useEffect(() => {
    if (open && mission) {
      resolveActionResult(getTemplatesAction({}))
        .then((result) => {
          setTemplates(result);
        })
        .catch(() => {
          // silently fail, templates are optional
        });

      resolveActionResult(getSentEmailsAction({ missionId: mission.id }))
        .then((result) => {
          setSentEmails(result);
        })
        .catch(() => {
          // silently fail, sent emails are optional
        });

      resolveActionResult(getDraftsAction({ missionId: mission.id }))
        .then((result) => {
          setDraftCount(result.length);
        })
        .catch(() => {
          // silently fail
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

  const pendingFollowUps = mission.followUps.filter((f) => !f.completedAt);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <ScoreRing score={localScore} size={40} />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                disabled={isRecalculating}
                onClick={async () => {
                  setIsRecalculating(true);
                  try {
                    const result = await resolveActionResult(
                      recalculateScoreAction({ id: mission.id }),
                    );
                    setLocalScore(result.score);
                    toast.success(`Score recalculé : ${result.score}`);
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Erreur de recalcul",
                    );
                  } finally {
                    setIsRecalculating(false);
                  }
                }}
              >
                <RefreshCw
                  className={`size-3.5 ${isRecalculating ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">{mission.title}</SheetTitle>
              {mission.company && (
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Building2 className="size-3" />
                  {mission.company}
                </p>
              )}
            </div>
            <StatusBadge status={mission.status} />
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          {/* Infos */}
          <div className="flex flex-wrap gap-3">
            {mission.tjm && (
              <Badge variant="outline" className="font-mono">
                {mission.tjm}€/j
              </Badge>
            )}
            {mission.duration && (
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" /> {mission.duration}
              </Badge>
            )}
            {mission.workType && (
              <Badge variant="outline" className="gap-1">
                <Monitor className="size-3" /> {mission.workType}
              </Badge>
            )}
            {mission.location && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="size-3" /> {mission.location}
              </Badge>
            )}
            {mission.platform && (
              <Badge variant="secondary">{mission.platform.name}</Badge>
            )}
            {mission.profile && (
              <Badge variant="outline" className="gap-1">
                <UserCircle className="size-3" /> {mission.profile.name}
              </Badge>
            )}
          </div>

          {/* Description */}
          {mission.description && (
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-muted-foreground text-sm">
                {mission.description}
              </p>
            </div>
          )}

          {/* Stack */}
          {mission.stack.length > 0 && (
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium">Stack</h4>
              <div className="flex flex-wrap gap-1">
                {mission.stack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Source URL */}
          {mission.sourceUrl && (
            <a
              href={mission.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex items-center gap-1 text-sm hover:underline"
            >
              <ExternalLink className="size-3" />
              Voir l&apos;annonce originale
            </a>
          )}

          <Separator />

          {/* Follow-ups */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">
              Prochaines actions ({pendingFollowUps.length})
            </h4>
            {pendingFollowUps.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune relance planifiée
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {pendingFollowUps.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground size-3" />
                    <span>{f.title}</span>
                    <span className="text-muted-foreground">
                      {new Date(f.scheduledAt).toLocaleDateString("fr-FR")}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {f.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Emails envoyés */}
          {(sentEmails.length > 0 || draftCount > 0) && (
            <>
              <div className="flex flex-col gap-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  Emails ({sentEmails.length})
                  {draftCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {draftCount} brouillon{draftCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </h4>
                <div className="flex flex-col gap-2">
                  {sentEmails.map((email) => (
                    <div
                      key={email.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {email.status === "clicked" && (
                        <MousePointer className="size-3 text-green-500" />
                      )}
                      {email.status === "opened" && (
                        <Eye className="size-3 text-blue-500" />
                      )}
                      {email.status === "delivered" && (
                        <CheckCircle2 className="size-3 text-emerald-500" />
                      )}
                      {email.status === "draft" && (
                        <Pencil className="text-muted-foreground size-3" />
                      )}
                      {email.status === "sent" && (
                        <Clock className="text-muted-foreground size-3" />
                      )}
                      {(email.status === "bounced" ||
                        email.status === "complained") && (
                        <AlertCircle className="size-3 text-red-500" />
                      )}
                      <span className="flex-1 truncate">{email.subject}</span>
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(email.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Contact */}
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium">Contact</h4>
            {mission.contact ? (
              <p className="text-sm">
                {mission.contact.firstName} {mission.contact.lastName}
                {mission.contact.company && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {mission.contact.company}
                  </span>
                )}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateContactDialog(true)}
              >
                <UserPlus className="size-4" />
                Ajouter un contact
              </Button>
            )}
          </div>
          <Separator />

          {/* Notes */}
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

          {/* Activity Timeline */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Historique</h4>
            <div className="flex flex-col gap-2">
              {mission.activityEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  <span>{event.description}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
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

          <QuickCreateContactDialog
            open={showCreateContactDialog}
            onOpenChange={setShowCreateContactDialog}
            defaultCompany={mission.company}
            onCreated={async (contact) => {
              try {
                await resolveActionResult(
                  updateMissionAction({
                    id: mission.id,
                    contactId: contact.id,
                  }),
                );
                onRefresh?.();
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Erreur de liaison",
                );
              }
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
