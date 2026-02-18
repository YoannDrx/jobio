"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CvProfile = {
  headline: string;
  name: string;
};

type Draft = {
  headlineOverride: string;
};

type CvSectionEditorHeaderProps = {
  profile: CvProfile;
  draft: Draft;
  onDraftChange: (patch: Partial<Draft>) => void;
};

export function CvSectionEditorHeader({
  profile,
  draft,
  onDraftChange,
}: CvSectionEditorHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Nom (profil)</Label>
        <Input value={profile.name} readOnly className="bg-muted/40" />
        <p className="text-muted-foreground text-xs">
          Le nom provient du profil et ne peut pas être modifié ici.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Titre professionnel (profil)</Label>
        <Input value={profile.headline} readOnly className="bg-muted/40" />
        <p className="text-muted-foreground text-xs">
          Titre par défaut du profil.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="headline-override">Titre personnalisé (ce CV)</Label>
        <Input
          id="headline-override"
          value={draft.headlineOverride}
          placeholder={profile.headline || "Ex: Lead Product Engineer"}
          onChange={(event) =>
            onDraftChange({ headlineOverride: event.target.value })
          }
        />
        <p className="text-muted-foreground text-xs">
          Remplace le titre du profil sur ce CV uniquement. Laissez vide pour
          utiliser le titre du profil.
        </p>
      </div>
    </div>
  );
}
