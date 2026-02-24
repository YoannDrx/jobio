"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { TagInput } from "./tag-input";
import type {
  ContentOverrideItem,
  MasterCvCertification,
  MasterCvEducation,
  MasterCvExperience,
  MasterCvItem,
  MasterCvLanguage,
  MasterCvProject,
  MasterCvSection,
  MasterCvSkill,
} from "../cv-lab.schema";

type CvItemSelectorProps = {
  section: MasterCvSection;
  masterItems: MasterCvItem[];
  hiddenItemIds: string[];
  overrides: ContentOverrideItem[];
  onToggleItem: (itemId: string, visible: boolean) => void;
  onUpdateOverride: (itemId: string, patch: Record<string, unknown>) => void;
  onRemoveOverride: (itemId: string) => void;
};

const getItemSummary = (
  section: MasterCvSection,
  item: MasterCvItem,
): { title: string; subtitle: string | null } => {
  switch (section) {
    case "experiences": {
      const experience = item as MasterCvExperience;
      return {
        title: experience.title,
        subtitle: experience.company,
      };
    }
    case "skills": {
      const skill = item as MasterCvSkill;
      return {
        title: skill.name,
        subtitle: skill.level ?? null,
      };
    }
    case "education": {
      const education = item as MasterCvEducation;
      return {
        title: education.degree,
        subtitle: education.institution,
      };
    }
    case "projects": {
      const project = item as MasterCvProject;
      return {
        title: project.name,
        subtitle: project.description ?? null,
      };
    }
    case "languages": {
      const language = item as MasterCvLanguage;
      return {
        title: language.name,
        subtitle: language.level,
      };
    }
    case "certifications": {
      const certification = item as MasterCvCertification;
      return {
        title: certification.name,
        subtitle: certification.issuer ?? null,
      };
    }
  }
};

const toStringValue = (value: unknown) => {
  if (typeof value === "string") return value;
  return "";
};

const toBooleanValue = (value: unknown) => Boolean(value);

const parseTechnologies = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const buildFormState = (
  section: MasterCvSection,
  item: MasterCvItem,
  override?: ContentOverrideItem,
): Record<string, unknown> => {
  switch (section) {
    case "experiences": {
      const data = item as MasterCvExperience;
      return {
        title: toStringValue(override?.title ?? data.title),
        company: toStringValue(override?.company ?? data.company),
        startDate: toStringValue(override?.startDate ?? data.startDate),
        endDate: toStringValue(override?.endDate ?? data.endDate),
        current: toBooleanValue(override?.current ?? data.current),
        description: toStringValue(override?.description ?? data.description),
        location: toStringValue(override?.location ?? data.location),
        contractType: toStringValue(
          override?.contractType ?? data.contractType,
        ),
        remote: toStringValue(override?.remote ?? data.remote),
        techStack: parseTechnologies(override?.techStack ?? data.techStack),
        achievements: parseTechnologies(
          override?.achievements ?? data.achievements,
        ),
        teamContext: toStringValue(override?.teamContext ?? data.teamContext),
      };
    }
    case "skills": {
      const data = item as MasterCvSkill;
      return {
        name: toStringValue(override?.name ?? data.name),
        level: toStringValue(override?.level ?? data.level),
      };
    }
    case "education": {
      const data = item as MasterCvEducation;
      return {
        degree: toStringValue(override?.degree ?? data.degree),
        institution: toStringValue(override?.institution ?? data.institution),
        field: toStringValue(override?.field ?? data.field),
        startDate: toStringValue(override?.startDate ?? data.startDate),
        endDate: toStringValue(override?.endDate ?? data.endDate),
        description: toStringValue(override?.description ?? data.description),
      };
    }
    case "projects": {
      const data = item as MasterCvProject;
      return {
        name: toStringValue(override?.name ?? data.name),
        description: toStringValue(override?.description ?? data.description),
        url: toStringValue(override?.url ?? data.url),
        technologies: parseTechnologies(
          override?.technologies ?? data.technologies,
        ),
        role: toStringValue(override?.role ?? data.role),
        startDate: toStringValue(override?.startDate ?? data.startDate),
        endDate: toStringValue(override?.endDate ?? data.endDate),
        highlights: parseTechnologies(override?.highlights ?? data.highlights),
        status: toStringValue(override?.status ?? data.status),
      };
    }
    case "languages": {
      const data = item as MasterCvLanguage;
      return {
        name: toStringValue(override?.name ?? data.name),
        level: toStringValue(override?.level ?? data.level),
      };
    }
    case "certifications": {
      const data = item as MasterCvCertification;
      return {
        name: toStringValue(override?.name ?? data.name),
        issuer: toStringValue(override?.issuer ?? data.issuer),
        date: toStringValue(override?.date ?? data.date),
        url: toStringValue(override?.url ?? data.url),
      };
    }
  }
};

const areStringValuesDifferent = (left: unknown, right: unknown) =>
  toStringValue(left).trim() !== toStringValue(right).trim();

const buildOverridePatch = (
  section: MasterCvSection,
  item: MasterCvItem,
  state: Record<string, unknown>,
): Record<string, unknown> => {
  const patch: Record<string, unknown> = {};

  const pushStringField = (key: string, currentValue: unknown) => {
    const nextValue = toStringValue(state[key]).trim();
    if (areStringValuesDifferent(currentValue, nextValue)) {
      patch[key] = nextValue;
    }
  };

  switch (section) {
    case "experiences": {
      const data = item as MasterCvExperience;
      pushStringField("title", data.title);
      pushStringField("company", data.company);
      pushStringField("startDate", data.startDate);
      pushStringField("endDate", data.endDate);
      pushStringField("description", data.description);
      pushStringField("location", data.location);
      pushStringField("contractType", data.contractType);
      pushStringField("remote", data.remote);
      pushStringField("teamContext", data.teamContext);

      const nextCurrent = Boolean(state.current);
      if (Boolean(data.current) !== nextCurrent) {
        patch.current = nextCurrent;
      }

      const currentTechStack = parseTechnologies(data.techStack);
      const nextTechStack = Array.isArray(state.techStack)
        ? (state.techStack as string[])
        : [];
      if (
        currentTechStack.length !== nextTechStack.length ||
        currentTechStack.some((v, i) => v !== nextTechStack[i])
      ) {
        patch.techStack = nextTechStack;
      }

      const currentAchievements = parseTechnologies(data.achievements);
      const nextAchievements = Array.isArray(state.achievements)
        ? (state.achievements as string[])
        : [];
      if (
        currentAchievements.length !== nextAchievements.length ||
        currentAchievements.some((v, i) => v !== nextAchievements[i])
      ) {
        patch.achievements = nextAchievements;
      }
      break;
    }
    case "skills": {
      const data = item as MasterCvSkill;
      pushStringField("name", data.name);
      pushStringField("level", data.level);
      break;
    }
    case "education": {
      const data = item as MasterCvEducation;
      pushStringField("degree", data.degree);
      pushStringField("institution", data.institution);
      pushStringField("field", data.field);
      pushStringField("startDate", data.startDate);
      pushStringField("endDate", data.endDate);
      pushStringField("description", data.description);
      break;
    }
    case "projects": {
      const data = item as MasterCvProject;
      pushStringField("name", data.name);
      pushStringField("description", data.description);
      pushStringField("url", data.url);
      pushStringField("role", data.role);
      pushStringField("startDate", data.startDate);
      pushStringField("endDate", data.endDate);
      pushStringField("status", data.status);

      const currentTechnologies = parseTechnologies(data.technologies);
      const nextTechnologies = Array.isArray(state.technologies)
        ? (state.technologies as string[])
        : [];

      if (
        currentTechnologies.length !== nextTechnologies.length ||
        currentTechnologies.some(
          (value, index) => value !== nextTechnologies[index],
        )
      ) {
        patch.technologies = nextTechnologies;
      }

      const currentHighlights = parseTechnologies(data.highlights);
      const nextHighlights = Array.isArray(state.highlights)
        ? (state.highlights as string[])
        : [];

      if (
        currentHighlights.length !== nextHighlights.length ||
        currentHighlights.some(
          (value, index) => value !== nextHighlights[index],
        )
      ) {
        patch.highlights = nextHighlights;
      }
      break;
    }
    case "languages": {
      const data = item as MasterCvLanguage;
      pushStringField("name", data.name);
      pushStringField("level", data.level);
      break;
    }
    case "certifications": {
      const data = item as MasterCvCertification;
      pushStringField("name", data.name);
      pushStringField("issuer", data.issuer);
      pushStringField("date", data.date);
      pushStringField("url", data.url);
      break;
    }
  }

  return patch;
};

export function CvItemSelector({
  section,
  masterItems,
  hiddenItemIds,
  overrides,
  onToggleItem,
  onUpdateOverride,
  onRemoveOverride,
}: CvItemSelectorProps) {
  const hiddenSet = new Set(hiddenItemIds);
  const overrideMap = useMemo(
    () =>
      new Map(overrides.map((override) => [override.masterItemId, override])),
    [overrides],
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, unknown>>({});

  if (masterItems.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        Aucun item dans cette section.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {masterItems.map((item) => {
        const isVisible = !hiddenSet.has(item.id);
        const override = overrideMap.get(item.id);
        const hasOverride = Boolean(override);
        const { title, subtitle } = getItemSummary(section, item);
        const isEditing = editingItemId === item.id;

        return (
          <div key={item.id} className="rounded-md border">
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <Switch
                  checked={isVisible}
                  onCheckedChange={(checked) =>
                    onToggleItem(item.id, Boolean(checked))
                  }
                  aria-label={`Afficher ${title}`}
                />
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate text-sm font-medium">{title}</span>
                  {subtitle ? (
                    <span className="text-muted-foreground truncate text-xs">
                      {subtitle}
                    </span>
                  ) : null}
                </div>
                {hasOverride ? (
                  <Badge variant="secondary" className="shrink-0">
                    Personnalise
                  </Badge>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon-xs"
                  variant={isEditing ? "secondary" : "ghost"}
                  title="Editer l'override"
                  aria-label={`Éditer ${title}`}
                  aria-expanded={isEditing}
                  onClick={() => {
                    if (isEditing) {
                      setEditingItemId(null);
                      return;
                    }
                    setEditingItemId(item.id);
                    setFormState(buildFormState(section, item, override));
                  }}
                >
                  <Pencil className="size-3" />
                </Button>
                {hasOverride ? (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    title="Supprimer l'override"
                    aria-label={`Supprimer la personnalisation de ${title}`}
                    onClick={() => {
                      onRemoveOverride(item.id);
                      if (isEditing) {
                        setEditingItemId(null);
                      }
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-3 border-t px-3 py-3">
                {section === "experiences" ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Titre</Label>
                        <Input
                          value={toStringValue(formState.title)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              title: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Entreprise</Label>
                        <Input
                          value={toStringValue(formState.company)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              company: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Date debut</Label>
                        <Input
                          value={toStringValue(formState.startDate)}
                          placeholder="janvier 2020"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              startDate: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Date fin</Label>
                        <Input
                          value={toStringValue(formState.endDate)}
                          placeholder="decembre 2022"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              endDate: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={toBooleanValue(formState.current)}
                        onCheckedChange={(checked) =>
                          setFormState((prev) => ({
                            ...prev,
                            current: checked,
                          }))
                        }
                      />
                      <Label>Poste actuel</Label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <Label>Lieu</Label>
                        <Input
                          value={toStringValue(formState.location)}
                          placeholder="Paris, France"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              location: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Type de contrat</Label>
                        <Input
                          value={toStringValue(formState.contractType)}
                          placeholder="CDI, FREELANCE..."
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              contractType: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Mode de travail</Label>
                        <Input
                          value={toStringValue(formState.remote)}
                          placeholder="ONSITE, HYBRID, REMOTE"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              remote: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Contexte equipe</Label>
                      <Input
                        value={toStringValue(formState.teamContext)}
                        placeholder="Equipe 5 devs, startup"
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            teamContext: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Description</Label>
                      <Textarea
                        value={toStringValue(formState.description)}
                        rows={3}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Stack technique</Label>
                      <TagInput
                        tags={
                          Array.isArray(formState.techStack)
                            ? (formState.techStack as string[])
                            : []
                        }
                        onChange={(tags) =>
                          setFormState((prev) => ({ ...prev, techStack: tags }))
                        }
                        placeholder="Ajouter une technologie"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Realisations</Label>
                      <TagInput
                        tags={
                          Array.isArray(formState.achievements)
                            ? (formState.achievements as string[])
                            : []
                        }
                        onChange={(tags) =>
                          setFormState((prev) => ({
                            ...prev,
                            achievements: tags,
                          }))
                        }
                        placeholder="Ajouter une realisation"
                      />
                    </div>
                  </>
                ) : null}

                {section === "skills" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label>Competence</Label>
                      <Input
                        value={toStringValue(formState.name)}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Niveau</Label>
                      <Input
                        value={toStringValue(formState.level)}
                        placeholder="EXPERT"
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            level: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {section === "education" ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Diplome</Label>
                        <Input
                          value={toStringValue(formState.degree)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              degree: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Etablissement</Label>
                        <Input
                          value={toStringValue(formState.institution)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              institution: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Domaine</Label>
                        <Input
                          value={toStringValue(formState.field)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              field: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <Label>Date debut</Label>
                          <Input
                            value={toStringValue(formState.startDate)}
                            placeholder="septembre 2018"
                            onChange={(event) =>
                              setFormState((prev) => ({
                                ...prev,
                                startDate: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label>Date fin</Label>
                          <Input
                            value={toStringValue(formState.endDate)}
                            placeholder="juin 2020"
                            onChange={(event) =>
                              setFormState((prev) => ({
                                ...prev,
                                endDate: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Description</Label>
                      <Textarea
                        value={toStringValue(formState.description)}
                        rows={3}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                ) : null}

                {section === "projects" ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Nom du projet</Label>
                        <Input
                          value={toStringValue(formState.name)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>URL</Label>
                        <Input
                          value={toStringValue(formState.url)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              url: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <Label>Role</Label>
                        <Input
                          value={toStringValue(formState.role)}
                          placeholder="Lead dev / Solo"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              role: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Date debut</Label>
                        <Input
                          value={toStringValue(formState.startDate)}
                          placeholder="janvier 2024"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              startDate: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Date fin</Label>
                        <Input
                          value={toStringValue(formState.endDate)}
                          placeholder="juin 2025"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              endDate: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Statut</Label>
                      <Input
                        value={toStringValue(formState.status)}
                        placeholder="En cours / Termine"
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            status: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Description</Label>
                      <Textarea
                        value={toStringValue(formState.description)}
                        rows={3}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Technologies</Label>
                      <TagInput
                        tags={
                          Array.isArray(formState.technologies)
                            ? (formState.technologies as string[])
                            : []
                        }
                        onChange={(tags) =>
                          setFormState((prev) => ({
                            ...prev,
                            technologies: tags,
                          }))
                        }
                        placeholder="Ajouter une technologie"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Points forts</Label>
                      <TagInput
                        tags={
                          Array.isArray(formState.highlights)
                            ? (formState.highlights as string[])
                            : []
                        }
                        onChange={(tags) =>
                          setFormState((prev) => ({
                            ...prev,
                            highlights: tags,
                          }))
                        }
                        placeholder="Ajouter un point fort"
                      />
                    </div>
                  </>
                ) : null}

                {section === "languages" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label>Langue</Label>
                      <Input
                        value={toStringValue(formState.name)}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Niveau</Label>
                      <Input
                        value={toStringValue(formState.level)}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            level: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {section === "certifications" ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Certification</Label>
                        <Input
                          value={toStringValue(formState.name)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Organisme</Label>
                        <Input
                          value={toStringValue(formState.issuer)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              issuer: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Date</Label>
                        <Input
                          value={toStringValue(formState.date)}
                          placeholder="janvier 2026"
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              date: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>URL</Label>
                        <Input
                          value={toStringValue(formState.url)}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              url: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingItemId(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onRemoveOverride(item.id);
                      setFormState(buildFormState(section, item));
                    }}
                  >
                    <RotateCcw className="mr-1 size-3.5" />
                    Reinitialiser
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const patch = buildOverridePatch(
                        section,
                        item,
                        formState,
                      );
                      if (Object.keys(patch).length === 0) {
                        onRemoveOverride(item.id);
                      } else {
                        onUpdateOverride(item.id, patch);
                      }
                      setEditingItemId(null);
                    }}
                  >
                    <Check className="mr-1 size-3.5" />
                    Appliquer
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
