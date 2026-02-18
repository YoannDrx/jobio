"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import type { MissionParserOutput } from "@/features/ai/prompts/mission-parser.prompt";
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  Link,
  MapPin,
  Monitor,
  X,
} from "lucide-react";
import { useState } from "react";

type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const config = {
    HIGH: {
      label: "Sûr",
      className:
        "bg-status-success/15 text-status-success border-status-success/30",
    },
    MEDIUM: {
      label: "Probable",
      className:
        "bg-status-warning/15 text-status-warning border-status-warning/30",
    },
    LOW: {
      label: "Incertain",
      className:
        "bg-status-danger/15 text-status-danger border-status-danger/30",
    },
  };
  const c = config[level];
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

type MissionPreviewProps = {
  data: MissionParserOutput;
  onConfirm: (data: MissionParserOutput, sourceUrl?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  sourceUrl?: string;
};

export function MissionPreview({
  data,
  onConfirm,
  onCancel,
  isLoading,
  sourceUrl: initialSourceUrl = "",
}: MissionPreviewProps) {
  const [edited, setEdited] = useState<MissionParserOutput>(data);
  const [editedUrl, setEditedUrl] = useState(initialSourceUrl);

  const update = <K extends keyof MissionParserOutput>(
    key: K,
    value: MissionParserOutput[K],
  ) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Résultat du parsing
          <ConfidenceBadge level={edited.titleConfidence} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {edited.warnings.length > 0 && (
          <div className="border-status-warning/30 bg-status-warning/10 flex flex-col gap-1 rounded-md border p-3">
            {edited.warnings.map((w, i) => (
              <div
                key={i}
                className="text-status-warning flex items-center gap-2 text-sm"
              >
                <AlertTriangle className="size-4 shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
            <Link className="size-3" /> URL de l&apos;annonce
          </label>
          <Input
            value={editedUrl}
            onChange={(e) => setEditedUrl(e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-sm font-medium">
            Titre
          </label>
          <Input
            value={edited.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              <Building2 className="size-3" /> Entreprise
              <ConfidenceBadge level={edited.companyConfidence} />
            </label>
            <Input
              value={edited.company ?? ""}
              onChange={(e) => update("company", e.target.value || null)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              TJM
              <ConfidenceBadge level={edited.tjmConfidence} />
            </label>
            <Input
              type="number"
              value={edited.tjm ?? ""}
              onChange={(e) =>
                update("tjm", e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-sm font-medium">
            Description
          </label>
          <Textarea
            value={edited.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-sm font-medium">
            Tes missions
          </label>
          <Textarea
            value={edited.tasksDescription ?? ""}
            onChange={(e) => update("tasksDescription", e.target.value || null)}
            rows={3}
            placeholder="Ce que tu vas concrètement faire au quotidien..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-sm font-medium">
            Stack technique
          </label>
          <Textarea
            value={edited.stackDescription ?? ""}
            onChange={(e) => update("stackDescription", e.target.value || null)}
            rows={2}
            placeholder="Contexte technique, architecture, outils..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-sm font-medium">
            Profil recherché
          </label>
          <Textarea
            value={edited.profileDescription ?? ""}
            onChange={(e) =>
              update("profileDescription", e.target.value || null)
            }
            rows={2}
            placeholder="Expérience requise, soft skills attendus..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              <Clock className="size-3" /> Durée
              <ConfidenceBadge level={edited.durationConfidence} />
            </label>
            <Input
              value={edited.duration ?? ""}
              onChange={(e) => update("duration", e.target.value || null)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              <Monitor className="size-3" /> Mode
              <ConfidenceBadge level={edited.workTypeConfidence} />
            </label>
            <Input
              value={edited.workType ?? ""}
              onChange={(e) =>
                update(
                  "workType",
                  e.target.value
                    ? (e.target.value as "REMOTE" | "HYBRID" | "ONSITE")
                    : null,
                )
              }
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              <MapPin className="size-3" /> Localisation
            </label>
            <Input
              value={edited.location ?? ""}
              onChange={(e) => update("location", e.target.value || null)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
            Stack
            <ConfidenceBadge level={edited.stackConfidence} />
          </label>
          <div className="flex flex-wrap gap-1">
            {edited.stack.map((tech, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {tech}
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "stack",
                      edited.stack.filter((_, j) => j !== i),
                    )
                  }
                  className="hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <LoadingButton
          loading={isLoading}
          onClick={() => onConfirm(edited, editedUrl || undefined)}
        >
          <Check className="size-4" />
          Confirmer et créer
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
