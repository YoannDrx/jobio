"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Archive, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CvCoachSnapshotEditor } from "./cv-coach-snapshot-editor";
import { CvCoachMissingPanel } from "./cv-coach-missing-panel";
import { CvCoachInconsistenciesPanel } from "./cv-coach-inconsistencies-panel";
import { CvCoachQualityChecksPanel } from "./cv-coach-quality-checks-panel";
import { CvCoachSourcePanel } from "./cv-coach-source-panel";
import { CvCoachAtsKeywordPlanner } from "./cv-coach-ats-keyword-planner";
import type {
  CoachSessionDetails,
  ProfileOption,
} from "../hooks/use-cv-coach-studio";
import type { CvCoachSnapshot } from "../cv-coach.schema";

type CvCoachDossierPanelProps = {
  session: CoachSessionDetails;
  snapshot: CvCoachSnapshot;
  onSnapshotChange: (s: CvCoachSnapshot) => void;
  profiles: ProfileOption[];
  applyProfileId: string;
  applyMode: "MERGE" | "REPLACE";
  onApplyProfileIdChange: (v: string) => void;
  onApplyModeChange: (v: "MERGE" | "REPLACE") => void;
  onApplyToProfile: () => void;
  isApplyingToProfile: boolean;
  onArchive: () => void;
  isArchiving: boolean;
  onAskMissingQuestion: (q: string) => void;
  onCreateVariant: () => void;
  onScrollToMessage: (index: number) => void;
  lockedFields: string[];
  onToggleLock: (fieldPath: string) => void;
};

export function CvCoachDossierPanel({
  session,
  snapshot,
  onSnapshotChange,
  profiles,
  applyProfileId,
  applyMode,
  onApplyProfileIdChange,
  onApplyModeChange,
  onApplyToProfile,
  isApplyingToProfile,
  onArchive,
  isArchiving,
  onAskMissingQuestion,
  onCreateVariant,
  onScrollToMessage,
  lockedFields,
  onToggleLock,
}: CvCoachDossierPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* État du dossier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">État du dossier</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Complétude</span>
              <span
                className={cn(
                  "font-semibold",
                  session.completenessScore >= 80
                    ? "text-emerald-600"
                    : session.completenessScore >= 55
                      ? "text-amber-600"
                      : "text-rose-600",
                )}
              >
                {session.completenessScore}%
              </span>
            </div>
            <Progress value={session.completenessScore} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border p-2">
              <p className="text-muted-foreground text-xs">Manques</p>
              <p className="font-semibold">{session.missingItems.length}</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="text-muted-foreground text-xs">Incohérences</p>
              <p className="font-semibold">{session.inconsistencies.length}</p>
            </div>
          </div>

          <CvCoachQualityChecksPanel
            snapshot={session.structuredSnapshot}
            goalRole={session.goalRole ?? undefined}
          />
        </CardContent>
      </Card>

      {/* Sources */}
      {session.sourceEvidence.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <CvCoachSourcePanel
              sourceEvidence={session.sourceEvidence}
              messages={session.messages}
              onScrollToMessage={onScrollToMessage}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* ATS Keyword Planner */}
      <CvCoachAtsKeywordPlanner sessionId={session.id} />

      {/* Points manquants */}
      {session.missingItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Points manquants</CardTitle>
          </CardHeader>
          <CardContent>
            <CvCoachMissingPanel
              missingItems={session.missingItems}
              onAskQuestion={onAskMissingQuestion}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Incohérences */}
      {session.inconsistencies.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incohérences</CardTitle>
          </CardHeader>
          <CardContent>
            <CvCoachInconsistenciesPanel
              inconsistencies={session.inconsistencies}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Dossier structuré */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dossier structuré</CardTitle>
        </CardHeader>
        <CardContent>
          <CvCoachSnapshotEditor
            snapshot={snapshot}
            onChange={onSnapshotChange}
            lockedFields={lockedFields}
            onToggleLock={onToggleLock}
          />
        </CardContent>
      </Card>

      {/* Appliquer au profil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appliquer au profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Profil cible</Label>
            <Select
              value={applyProfileId}
              onValueChange={onApplyProfileIdChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionne un profil" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Mode</Label>
            <Select
              value={applyMode}
              onValueChange={(v) => onApplyModeChange(v as "MERGE" | "REPLACE")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MERGE">Fusionner</SelectItem>
                <SelectItem value="REPLACE">Remplacer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onCreateVariant}
            disabled={
              session.completenessScore < 50 ||
              !session.goalRole ||
              profiles.length === 0
            }
            className="w-full"
            variant="secondary"
          >
            <FileText className="mr-2 size-4" />
            Créer un CV
          </Button>

          <Button
            onClick={onApplyToProfile}
            disabled={isApplyingToProfile || profiles.length === 0}
            className="w-full"
          >
            {isApplyingToProfile ? "Application..." : "Appliquer au profil"}
          </Button>

          <Separator />

          <Button
            variant="outline"
            className="w-full"
            onClick={onArchive}
            disabled={isArchiving}
          >
            <Archive className="size-4" />
            {isArchiving ? "Archivage..." : "Archiver"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
