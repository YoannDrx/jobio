"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CvProfile = {
  bio: string | null;
};

type Draft = {
  summaryOverride: string;
};

type CvSectionEditorSummaryProps = {
  profile: CvProfile;
  draft: Draft;
  onDraftChange: (patch: Partial<Draft>) => void;
};

export function CvSectionEditorSummary({
  profile,
  draft,
  onDraftChange,
}: CvSectionEditorSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Bio du profil</Label>
        <Textarea
          value={profile.bio ?? ""}
          readOnly
          rows={4}
          className="bg-muted/40"
        />
        <p className="text-muted-foreground text-xs">
          Bio par défaut du profil. Non modifiable ici.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="summary-override">Résumé personnalisé (ce CV)</Label>
        <Textarea
          id="summary-override"
          value={draft.summaryOverride}
          rows={6}
          placeholder="Pitch adapté à ce poste..."
          onChange={(event) =>
            onDraftChange({ summaryOverride: event.target.value })
          }
        />
        <p className="text-muted-foreground text-xs">
          Remplace la bio du profil sur ce CV. Laissez vide pour utiliser la bio
          du profil.
        </p>
      </div>
    </div>
  );
}
