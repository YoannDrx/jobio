"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CV_LAB_TEMPLATES,
  CV_LAB_THEMES,
  type CvLabTemplate,
  type CvLabTheme,
} from "../cv-lab.schema";

type CvProfile = {
  id: string;
  name: string;
};

type Draft = {
  profileId: string;
  name: string;
  targetRole: string;
  template: CvLabTemplate;
  theme: CvLabTheme;
  accentColor: string;
  fontFamily: string;
  headlineOverride: string;
  summaryOverride: string;
};

const TEMPLATE_LABELS: Record<CvLabTemplate, string> = {
  CLASSIC: "Classique",
  TWO_COLUMN: "2 colonnes",
  EXECUTIVE: "Executive",
  COMPACT: "Compact",
};

const THEME_LABELS: Record<CvLabTheme, string> = {
  MINIMAL: "Minimal",
  MODERN: "Modern",
  CONTRAST: "Contrast",
  BOLD: "Bold",
};

const FONT_OPTIONS = [
  "Inter",
  "Space Grotesk",
  "IBM Plex Sans",
  "Helvetica",
  "Georgia",
] as const;

type CvLabEditSettingsProps = {
  draft: Draft;
  onDraftChange: (patch: Partial<Draft>) => void;
  profiles: CvProfile[];
  canUseAllCvTemplates: boolean;
};

export function CvLabEditSettings({
  draft,
  onDraftChange,
  profiles,
  canUseAllCvTemplates,
}: CvLabEditSettingsProps) {
  const templateOptions = canUseAllCvTemplates
    ? [...CV_LAB_TEMPLATES]
    : Array.from(new Set(["CLASSIC", draft.template])) as CvLabTemplate[];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cv-name">Nom du CV</Label>
        <Input
          id="cv-name"
          value={draft.name}
          onChange={(event) => onDraftChange({ name: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cv-target-role">Poste ciblé</Label>
        <Input
          id="cv-target-role"
          value={draft.targetRole}
          placeholder="Senior Frontend React"
          onChange={(event) =>
            onDraftChange({ targetRole: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Profil source</Label>
        <Select
          value={draft.profileId}
          onValueChange={(value) => onDraftChange({ profileId: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
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
        <Label>Template</Label>
        <Select
          value={draft.template}
          onValueChange={(value) =>
            onDraftChange({ template: value as CvLabTemplate })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templateOptions.map((template) => (
              <SelectItem key={template} value={template}>
                {TEMPLATE_LABELS[template]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!canUseAllCvTemplates && (
          <p className="text-muted-foreground text-xs">
            Les templates avancés sont disponibles à partir du plan Pro.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Thème</Label>
        <Select
          value={draft.theme}
          onValueChange={(value) =>
            onDraftChange({ theme: value as CvLabTheme })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CV_LAB_THEMES.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Taille de page</Label>
        <div className="bg-muted/40 rounded-md border px-3 py-2 text-sm font-medium">
          A4 (verrouillé)
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Couleur accent</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={draft.accentColor}
            className="h-10 w-16 p-1"
            onChange={(event) =>
              onDraftChange({ accentColor: event.target.value })
            }
          />
          <Input
            value={draft.accentColor}
            onChange={(event) =>
              onDraftChange({ accentColor: event.target.value })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Police</Label>
        <Select
          value={draft.fontFamily}
          onValueChange={(value) => onDraftChange({ fontFamily: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="headline-override">Titre personnalisé</Label>
        <Input
          id="headline-override"
          value={draft.headlineOverride}
          placeholder="Ex: Lead Product Engineer"
          onChange={(event) =>
            onDraftChange({ headlineOverride: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="summary-override">Résumé personnalisé</Label>
        <Textarea
          id="summary-override"
          value={draft.summaryOverride}
          rows={5}
          placeholder="Pitch adapté à ce poste..."
          onChange={(event) =>
            onDraftChange({ summaryOverride: event.target.value })
          }
        />
      </div>
    </div>
  );
}
