"use client";

import { Badge } from "@/components/ui/badge";
import {
  MousePointer,
  Eye,
  CheckCircle2,
  Pencil,
  Clock,
  AlertCircle,
} from "lucide-react";
import { SendEmailDialog } from "@/features/emails/components/send-email-dialog";
import {
  getSentEmailsAction,
  getDraftsAction,
} from "@/features/emails/send-mission-email.action";
import { getTemplatesAction } from "@/features/templates/templates.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useState, useEffect } from "react";
import type { MissionWithRelations } from "./mission-detail-header";

type MissionDetailEmailsProps = {
  mission: MissionWithRelations;
  onRefresh?: () => void;
};

export function MissionDetailEmails({
  mission,
  onRefresh,
}: MissionDetailEmailsProps) {
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
  const [sentEmails, setSentEmails] = useState<
    {
      id: string;
      to: string;
      subject: string;
      status: string;
      isDraft: boolean;
      createdAt: Date;
      sentAt: Date | null;
      template: { name: string } | null;
    }[]
  >([]);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
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
  }, [mission.id]);

  if (sentEmails.length === 0 && draftCount === 0) {
    return null;
  }

  return (
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
            <div key={email.id} className="flex items-center gap-2 text-sm">
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

      <SendEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        mission={mission}
        templates={templates}
        onSent={onRefresh}
      />
    </>
  );
}
