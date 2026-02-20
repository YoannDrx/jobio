"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronDown, FileUp, Plus } from "lucide-react";
import {
  toDateTimeLabel,
  type CoachSessionListItem,
} from "../hooks/use-cv-coach-studio";

type CvCoachToolbarProps = {
  sessions: CoachSessionListItem[];
  activeSession: { name: string; completenessScore: number } | null;
  sessionNameInput: string;
  goalRoleInput: string;
  onSessionNameChange: (v: string) => void;
  onGoalRoleChange: (v: string) => void;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  isCreating: boolean;
  onOpenImport: () => void;
  importDisabled: boolean;
};

export function CvCoachToolbar({
  sessions,
  activeSession,
  sessionNameInput,
  goalRoleInput,
  onSessionNameChange,
  onGoalRoleChange,
  onSelectSession,
  onCreateSession,
  isCreating,
  onOpenImport,
  importDisabled,
}: CvCoachToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Session Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <span className="truncate">
              {activeSession?.name ?? "Sessions"}
            </span>
            <ChevronDown className="size-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="flex flex-col gap-3">
            {/* New Session Form */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="toolbar-session-name" className="text-xs">
                Nom
              </Label>
              <Input
                id="toolbar-session-name"
                value={sessionNameInput}
                onChange={(e) => onSessionNameChange(e.target.value)}
                placeholder="Session CV"
                size={30}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="toolbar-goal-role" className="text-xs">
                Rôle cible
              </Label>
              <Input
                id="toolbar-goal-role"
                value={goalRoleInput}
                onChange={(e) => onGoalRoleChange(e.target.value)}
                placeholder="Senior React"
                size={30}
              />
            </div>
            <Button
              onClick={onCreateSession}
              disabled={isCreating}
              className="w-full"
            >
              <Plus className="mr-2 size-4" />
              {isCreating ? "Création..." : "Créer"}
            </Button>

            <Separator />

            {/* Sessions List */}
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune session active.
              </p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    className={cn(
                      "w-full rounded-md border p-2 text-left text-sm transition-colors",
                      session.id === activeSession?.name
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/40",
                    )}
                    onClick={() => onSelectSession(session.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{session.name}</p>
                      <Badge variant="secondary" className="shrink-0">
                        {session.completenessScore}%
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {toDateTimeLabel(session.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {activeSession && (
          <Badge variant="secondary">{activeSession.completenessScore}%</Badge>
        )}
        <Button
          variant="outline"
          onClick={onOpenImport}
          disabled={importDisabled}
        >
          <FileUp className="mr-2 size-4" />
          Importer un CV
        </Button>
      </div>
    </div>
  );
}
