"use client";

import {
  ArrowRight,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Tag,
} from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ActivityEvent = {
  id: string;
  type: string;
  description: string | null;
  createdAt: Date;
};

type MissionDetailActivityProps = {
  events: ActivityEvent[];
};

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `Il y a ${months} mois`;
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? "s" : ""}`;
};

const getEventIcon = (type: string): React.ReactNode => {
  switch (type.toUpperCase()) {
    case "STATUS_CHANGE":
      return <ArrowRight className="size-4 text-blue-500" />;
    case "NOTE":
    case "NOTE_ADDED":
      return <FileText className="size-4 text-amber-500" />;
    case "EMAIL":
    case "EMAIL_SENT":
      return <Mail className="size-4 text-cyan-500" />;
    case "MESSAGE":
    case "MESSAGE_SENT":
      return <MessageSquare className="size-4 text-purple-500" />;
    case "CALL":
      return <Phone className="size-4 text-green-500" />;
    case "TAG":
    case "TAG_ADDED":
      return <Tag className="size-4 text-pink-500" />;
    default:
      return <FileText className="size-4 text-gray-400" />;
  }
};

export function MissionDetailActivity({ events }: MissionDetailActivityProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">Historique</h4>
        <p className="text-muted-foreground text-sm">
          Aucun événement enregistré
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-medium">Historique</h4>
      <div className="relative flex flex-col gap-0">
        {/* Vertical line */}
        <div className="from-border absolute top-6 bottom-0 left-[15px] w-0.5 bg-gradient-to-b to-transparent" />

        {events.map((event) => (
          <div
            key={event.id}
            className="flex gap-3 pb-4 last:pb-0"
            onMouseEnter={() => setHoveredId(event.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Icon circle */}
            <div className="border-background bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    {event.type.replace(/_/g, " ")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Content */}
            <div
              className={`flex-1 rounded-lg border p-2.5 transition-colors ${
                hoveredId === event.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-xs font-medium">
                    {getRelativeTime(new Date(event.createdAt))}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground cursor-help text-xs">
                          •
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {new Date(event.createdAt).toLocaleString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {event.description && (
                  <p className="text-foreground text-sm">{event.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
