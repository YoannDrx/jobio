"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Check,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Users,
} from "lucide-react";

type FollowUpItem = {
  id: string;
  title: string;
  type: string;
  scheduledAt: Date;
  completedAt: Date | null;
};

type FollowUpListProps = {
  followUps: FollowUpItem[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
};

const typeIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="size-4" />,
  CALL: <Phone className="size-4" />,
  MESSAGE: <MessageSquare className="size-4" />,
  MEETING: <Users className="size-4" />,
};

const typeLabels: Record<string, string> = {
  EMAIL: "Email",
  CALL: "Appel",
  MESSAGE: "Message",
  MEETING: "Reunion",
};

function getStatusBadge(scheduledAt: Date, completedAt: Date | null) {
  if (completedAt) {
    return (
      <Badge variant="secondary" className="text-xs">
        Termine
      </Badge>
    );
  }

  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const scheduledDay = new Date(
    scheduled.getFullYear(),
    scheduled.getMonth(),
    scheduled.getDate(),
  );

  if (scheduled < now && scheduledDay < today) {
    return (
      <Badge variant="destructive" className="text-xs">
        En retard
      </Badge>
    );
  }

  if (scheduledDay.getTime() === today.getTime()) {
    return (
      <Badge className="bg-orange-500 text-xs text-white hover:bg-orange-600">
        Aujourd&apos;hui
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      Planifie
    </Badge>
  );
}

export function FollowUpList({
  followUps,
  onComplete,
  onDelete,
}: FollowUpListProps) {
  if (followUps.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Aucune relance planifiee</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {followUps.map((followUp) => (
        <div
          key={followUp.id}
          className="flex items-center gap-3 rounded-md border p-3"
        >
          <span className="text-muted-foreground">
            {typeIcons[followUp.type] ?? <Calendar className="size-4" />}
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {followUp.title}
              </span>
              <Badge variant="outline" className="shrink-0 text-xs">
                {typeLabels[followUp.type] ?? followUp.type}
              </Badge>
              {getStatusBadge(followUp.scheduledAt, followUp.completedAt)}
            </div>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Calendar className="size-3" />
              {new Date(followUp.scheduledAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex shrink-0 gap-1">
            {!followUp.completedAt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComplete(followUp.id)}
                title="Marquer comme termine"
              >
                <Check className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(followUp.id)}
              title="Supprimer"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
