"use client";

import { useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  Award,
  Briefcase,
  CheckCircle2,
  Code,
  FolderOpen,
  Globe,
  GraduationCap,
  HelpCircle,
  Lock,
  Plus,
  Save,
  Settings,
  Trash2,
  Unlock,
  User,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CvCoachSnapshot } from "../cv-coach.schema";

type CvCoachSnapshotEditorProps = {
  snapshot: CvCoachSnapshot;
  onChange: (snapshot: CvCoachSnapshot) => void;
  onSave: () => void;
  isSaving: boolean;
  lockedFields?: string[];
  onToggleLock?: (fieldPath: string) => void;
};

function SectionBadge({ filled, total }: { filled: number; total: number }) {
  const ratio = total > 0 ? filled / total : 0;
  return (
    <Badge
      variant={ratio >= 1 ? "default" : ratio > 0 ? "secondary" : "outline"}
      className="ml-auto text-xs"
    >
      {filled}/{total}
    </Badge>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput("");
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <Badge
            key={`${tag}-${i}`}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
          >
            {tag} &times;
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Taper puis Entree pour ajouter"}
      />
    </div>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence?: "HIGH" | "MEDIUM" | "LOW";
}) {
  if (!confidence) return null;

  const config = {
    HIGH: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    MEDIUM: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    LOW: { icon: HelpCircle, color: "text-rose-600", bg: "bg-rose-50" },
  };

  const { icon: Icon, color, bg } = config[confidence];

  return (
    <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${bg}`}>
      <Icon className={`size-3 ${color}`} />
    </div>
  );
}

function LockToggle({
  fieldPath,
  lockedFields,
  onToggleLock,
}: {
  fieldPath: string;
  lockedFields?: string[];
  onToggleLock?: (fieldPath: string) => void;
}) {
  if (!onToggleLock) return null;

  const isLocked = lockedFields?.includes(fieldPath) ?? false;

  return (
    <button
      type="button"
      onClick={() => onToggleLock(fieldPath)}
      className={`rounded p-1 transition-colors ${
        isLocked
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted"
      }`}
      title={isLocked ? "Déverrouiller ce champ" : "Verrouiller ce champ"}
    >
      {isLocked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
    </button>
  );
}

export function CvCoachSnapshotEditor({
  snapshot,
  onChange,
  onSave,
  isSaving,
  lockedFields,
  onToggleLock,
}: CvCoachSnapshotEditorProps) {
  const getSectionCompleteness = (
    section: string,
  ): { filled: number; total: number } => {
    switch (section) {
      case "identity": {
        const fields = Object.values(snapshot.identity);
        return {
          filled: fields.filter((v) => v.trim().length > 0).length,
          total: fields.length,
        };
      }
      case "summary":
        return { filled: snapshot.summary.trim() ? 1 : 0, total: 1 };
      case "experiences":
        return {
          filled: snapshot.experiences.length,
          total: Math.max(1, snapshot.experiences.length),
        };
      case "education":
        return {
          filled: snapshot.education.length,
          total: Math.max(1, snapshot.education.length),
        };
      case "skills": {
        const cats = [
          snapshot.skills.hard,
          snapshot.skills.soft,
          snapshot.skills.tools,
        ];
        return {
          filled: cats.filter((c) => c.length > 0).length,
          total: 3,
        };
      }
      case "projects":
        return {
          filled: snapshot.projects.length,
          total: Math.max(1, snapshot.projects.length),
        };
      case "languages":
        return {
          filled: snapshot.languages.length,
          total: Math.max(1, snapshot.languages.length),
        };
      case "certifications":
        return {
          filled: snapshot.certifications.length,
          total: Math.max(1, snapshot.certifications.length),
        };
      case "constraints": {
        const fields = Object.values(snapshot.constraints);
        return {
          filled: fields.filter((v) => v.trim().length > 0).length,
          total: fields.length,
        };
      }
      default:
        return { filled: 0, total: 0 };
    }
  };

  const updateIdentity = (field: string, value: string) => {
    onChange({
      ...snapshot,
      identity: { ...snapshot.identity, [field]: value },
    });
  };

  const updateConstraints = (field: string, value: string) => {
    onChange({
      ...snapshot,
      constraints: { ...snapshot.constraints, [field]: value },
    });
  };

  const identityFields = [
    { key: "fullName", label: "Nom complet" },
    { key: "headline", label: "Titre" },
    { key: "targetRole", label: "Poste visé" },
    { key: "location", label: "Localisation" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "website", label: "Site web" },
    { key: "linkedinUrl", label: "LinkedIn" },
  ] as const;

  const constraintFields = [
    { key: "availability", label: "Disponibilité" },
    { key: "tjmTarget", label: "TJM cible" },
    { key: "salaryTarget", label: "Salaire cible" },
    { key: "contractType", label: "Type de contrat" },
    { key: "workMode", label: "Mode de travail" },
    { key: "mobility", label: "Mobilité" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <Accordion
        type="multiple"
        defaultValue={["identity", "experiences"]}
        className="w-full"
      >
        {/* Identity */}
        <AccordionItem value="identity">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <User className="size-4" />
              <span>Identité</span>
              <SectionBadge {...getSectionCompleteness("identity")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {identityFields.map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`identity-${f.key}`}
                      className="text-muted-foreground text-xs"
                    >
                      {f.label}
                    </label>
                    <LockToggle
                      fieldPath={`identity.${f.key}`}
                      lockedFields={lockedFields}
                      onToggleLock={onToggleLock}
                    />
                  </div>
                  <Input
                    id={`identity-${f.key}`}
                    value={
                      snapshot.identity[f.key as keyof typeof snapshot.identity]
                    }
                    onChange={(e) => updateIdentity(f.key, e.target.value)}
                    placeholder={f.label}
                    className={
                      lockedFields?.includes(`identity.${f.key}`)
                        ? "bg-muted/50"
                        : ""
                    }
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Summary */}
        <AccordionItem value="summary">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Briefcase className="size-4" />
              <span>Résumé</span>
              <SectionBadge {...getSectionCompleteness("summary")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Textarea
              value={snapshot.summary}
              onChange={(e) =>
                onChange({ ...snapshot, summary: e.target.value })
              }
              placeholder="Résumé professionnel..."
              rows={4}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Experiences */}
        <AccordionItem value="experiences">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Briefcase className="size-4" />
              <span>Expériences</span>
              <SectionBadge {...getSectionCompleteness("experiences")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {snapshot.experiences.map((exp, i) => (
                <div
                  key={i}
                  className="border-border flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Experience {i + 1}
                      </span>
                      <ConfidenceBadge confidence={exp.confidence} />
                    </div>
                    <div className="flex items-center gap-1">
                      <LockToggle
                        fieldPath={`experiences.${i}`}
                        lockedFields={lockedFields}
                        onToggleLock={onToggleLock}
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          onChange({
                            ...snapshot,
                            experiences: snapshot.experiences.filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      value={exp.title}
                      onChange={(e) => {
                        const updated = [...snapshot.experiences];
                        updated[i] = { ...exp, title: e.target.value };
                        onChange({ ...snapshot, experiences: updated });
                      }}
                      placeholder="Titre du poste"
                    />
                    <Input
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...snapshot.experiences];
                        updated[i] = { ...exp, company: e.target.value };
                        onChange({ ...snapshot, experiences: updated });
                      }}
                      placeholder="Entreprise"
                    />
                    <Input
                      value={exp.location}
                      onChange={(e) => {
                        const updated = [...snapshot.experiences];
                        updated[i] = { ...exp, location: e.target.value };
                        onChange({ ...snapshot, experiences: updated });
                      }}
                      placeholder="Lieu"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={exp.startDate}
                        onChange={(e) => {
                          const updated = [...snapshot.experiences];
                          updated[i] = { ...exp, startDate: e.target.value };
                          onChange({ ...snapshot, experiences: updated });
                        }}
                        placeholder="Début"
                      />
                      <Input
                        value={exp.endDate}
                        onChange={(e) => {
                          const updated = [...snapshot.experiences];
                          updated[i] = { ...exp, endDate: e.target.value };
                          onChange({ ...snapshot, experiences: updated });
                        }}
                        placeholder="Fin"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => {
                      const updated = [...snapshot.experiences];
                      updated[i] = { ...exp, description: e.target.value };
                      onChange({ ...snapshot, experiences: updated });
                    }}
                    placeholder="Description du poste..."
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-xs">
                      Réalisations
                    </label>
                    <TagInput
                      tags={exp.achievements}
                      onChange={(achievements) => {
                        const updated = [...snapshot.experiences];
                        updated[i] = { ...exp, achievements };
                        onChange({ ...snapshot, experiences: updated });
                      }}
                      placeholder="Ajouter une réalisation..."
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-xs">
                      Stack technique
                    </label>
                    <TagInput
                      tags={exp.techStack}
                      onChange={(techStack) => {
                        const updated = [...snapshot.experiences];
                        updated[i] = { ...exp, techStack };
                        onChange({ ...snapshot, experiences: updated });
                      }}
                      placeholder="Ajouter une techno..."
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    ...snapshot,
                    experiences: [
                      ...snapshot.experiences,
                      {
                        title: "",
                        company: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                        achievements: [],
                        techStack: [],
                      },
                    ],
                  })
                }
              >
                <Plus className="size-4" />
                Ajouter une experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Education */}
        <AccordionItem value="education">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4" />
              <span>Formation</span>
              <SectionBadge {...getSectionCompleteness("education")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {snapshot.education.map((edu, i) => (
                <div
                  key={i}
                  className="border-border flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Formation {i + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        onChange({
                          ...snapshot,
                          education: snapshot.education.filter(
                            (_, idx) => idx !== i,
                          ),
                        })
                      }
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...snapshot.education];
                        updated[i] = { ...edu, degree: e.target.value };
                        onChange({ ...snapshot, education: updated });
                      }}
                      placeholder="Diplôme"
                    />
                    <Input
                      value={edu.school}
                      onChange={(e) => {
                        const updated = [...snapshot.education];
                        updated[i] = { ...edu, school: e.target.value };
                        onChange({ ...snapshot, education: updated });
                      }}
                      placeholder="Établissement"
                    />
                    <Input
                      value={edu.field}
                      onChange={(e) => {
                        const updated = [...snapshot.education];
                        updated[i] = { ...edu, field: e.target.value };
                        onChange({ ...snapshot, education: updated });
                      }}
                      placeholder="Domaine"
                    />
                    <Input
                      value={edu.location}
                      onChange={(e) => {
                        const updated = [...snapshot.education];
                        updated[i] = { ...edu, location: e.target.value };
                        onChange({ ...snapshot, education: updated });
                      }}
                      placeholder="Lieu"
                    />
                    <Input
                      value={edu.startDate}
                      onChange={(e) => {
                        const updated = [...snapshot.education];
                        updated[i] = { ...edu, startDate: e.target.value };
                        onChange({ ...snapshot, education: updated });
                      }}
                      placeholder="Début"
                    />
                    <Input
                      value={edu.endDate}
                      onChange={(e) => {
                        const updated = [...snapshot.education];
                        updated[i] = { ...edu, endDate: e.target.value };
                        onChange({ ...snapshot, education: updated });
                      }}
                      placeholder="Fin"
                    />
                  </div>
                  <Textarea
                    value={edu.description}
                    onChange={(e) => {
                      const updated = [...snapshot.education];
                      updated[i] = { ...edu, description: e.target.value };
                      onChange({ ...snapshot, education: updated });
                    }}
                    placeholder="Description..."
                    rows={2}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    ...snapshot,
                    education: [
                      ...snapshot.education,
                      {
                        degree: "",
                        school: "",
                        field: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                      },
                    ],
                  })
                }
              >
                <Plus className="size-4" />
                Ajouter une formation
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Skills */}
        <AccordionItem value="skills">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Code className="size-4" />
              <span>Compétences</span>
              <SectionBadge {...getSectionCompleteness("skills")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Compétences techniques
                </label>
                <TagInput
                  tags={snapshot.skills.hard}
                  onChange={(hard) =>
                    onChange({
                      ...snapshot,
                      skills: { ...snapshot.skills, hard },
                    })
                  }
                  placeholder="Ajouter une compétence technique..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Soft skills</label>
                <TagInput
                  tags={snapshot.skills.soft}
                  onChange={(soft) =>
                    onChange({
                      ...snapshot,
                      skills: { ...snapshot.skills, soft },
                    })
                  }
                  placeholder="Ajouter un soft skill..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Outils</label>
                <TagInput
                  tags={snapshot.skills.tools}
                  onChange={(tools) =>
                    onChange({
                      ...snapshot,
                      skills: { ...snapshot.skills, tools },
                    })
                  }
                  placeholder="Ajouter un outil..."
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Projects */}
        <AccordionItem value="projects">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <FolderOpen className="size-4" />
              <span>Projets</span>
              <SectionBadge {...getSectionCompleteness("projects")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {snapshot.projects.map((proj, i) => (
                <div
                  key={i}
                  className="border-border flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Projet {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        onChange({
                          ...snapshot,
                          projects: snapshot.projects.filter(
                            (_, idx) => idx !== i,
                          ),
                        })
                      }
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      value={proj.name}
                      onChange={(e) => {
                        const updated = [...snapshot.projects];
                        updated[i] = { ...proj, name: e.target.value };
                        onChange({ ...snapshot, projects: updated });
                      }}
                      placeholder="Nom du projet"
                    />
                    <Input
                      value={proj.role}
                      onChange={(e) => {
                        const updated = [...snapshot.projects];
                        updated[i] = { ...proj, role: e.target.value };
                        onChange({ ...snapshot, projects: updated });
                      }}
                      placeholder="Rôle"
                    />
                    <Input
                      value={proj.startDate}
                      onChange={(e) => {
                        const updated = [...snapshot.projects];
                        updated[i] = { ...proj, startDate: e.target.value };
                        onChange({ ...snapshot, projects: updated });
                      }}
                      placeholder="Début"
                    />
                    <Input
                      value={proj.endDate}
                      onChange={(e) => {
                        const updated = [...snapshot.projects];
                        updated[i] = { ...proj, endDate: e.target.value };
                        onChange({ ...snapshot, projects: updated });
                      }}
                      placeholder="Fin"
                    />
                    <Input
                      value={proj.url}
                      onChange={(e) => {
                        const updated = [...snapshot.projects];
                        updated[i] = { ...proj, url: e.target.value };
                        onChange({ ...snapshot, projects: updated });
                      }}
                      placeholder="URL"
                      className="sm:col-span-2"
                    />
                  </div>
                  <Textarea
                    value={proj.description}
                    onChange={(e) => {
                      const updated = [...snapshot.projects];
                      updated[i] = { ...proj, description: e.target.value };
                      onChange({ ...snapshot, projects: updated });
                    }}
                    placeholder="Description..."
                    rows={2}
                  />
                  <Textarea
                    value={proj.impact}
                    onChange={(e) => {
                      const updated = [...snapshot.projects];
                      updated[i] = { ...proj, impact: e.target.value };
                      onChange({ ...snapshot, projects: updated });
                    }}
                    placeholder="Impact..."
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-xs">
                      Stack technique
                    </label>
                    <TagInput
                      tags={proj.techStack}
                      onChange={(techStack) => {
                        const updated = [...snapshot.projects];
                        updated[i] = { ...proj, techStack };
                        onChange({ ...snapshot, projects: updated });
                      }}
                      placeholder="Ajouter une techno..."
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    ...snapshot,
                    projects: [
                      ...snapshot.projects,
                      {
                        name: "",
                        role: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                        impact: "",
                        url: "",
                        techStack: [],
                      },
                    ],
                  })
                }
              >
                <Plus className="size-4" />
                Ajouter un projet
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Languages */}
        <AccordionItem value="languages">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Globe className="size-4" />
              <span>Langues</span>
              <SectionBadge {...getSectionCompleteness("languages")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {snapshot.languages.map((lang, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={lang.name}
                    onChange={(e) => {
                      const updated = [...snapshot.languages];
                      updated[i] = { ...lang, name: e.target.value };
                      onChange({ ...snapshot, languages: updated });
                    }}
                    placeholder="Langue"
                    className="flex-1"
                  />
                  <Input
                    value={lang.level}
                    onChange={(e) => {
                      const updated = [...snapshot.languages];
                      updated[i] = { ...lang, level: e.target.value };
                      onChange({ ...snapshot, languages: updated });
                    }}
                    placeholder="Niveau"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      onChange({
                        ...snapshot,
                        languages: snapshot.languages.filter(
                          (_, idx) => idx !== i,
                        ),
                      })
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    ...snapshot,
                    languages: [...snapshot.languages, { name: "", level: "" }],
                  })
                }
              >
                <Plus className="size-4" />
                Ajouter une langue
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Certifications */}
        <AccordionItem value="certifications">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Award className="size-4" />
              <span>Certifications</span>
              <SectionBadge {...getSectionCompleteness("certifications")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {snapshot.certifications.map((cert, i) => (
                <div
                  key={i}
                  className="border-border flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Certification {i + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        onChange({
                          ...snapshot,
                          certifications: snapshot.certifications.filter(
                            (_, idx) => idx !== i,
                          ),
                        })
                      }
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      value={cert.name}
                      onChange={(e) => {
                        const updated = [...snapshot.certifications];
                        updated[i] = { ...cert, name: e.target.value };
                        onChange({ ...snapshot, certifications: updated });
                      }}
                      placeholder="Nom"
                    />
                    <Input
                      value={cert.issuer}
                      onChange={(e) => {
                        const updated = [...snapshot.certifications];
                        updated[i] = { ...cert, issuer: e.target.value };
                        onChange({ ...snapshot, certifications: updated });
                      }}
                      placeholder="Organisme"
                    />
                    <Input
                      value={cert.issueDate}
                      onChange={(e) => {
                        const updated = [...snapshot.certifications];
                        updated[i] = { ...cert, issueDate: e.target.value };
                        onChange({ ...snapshot, certifications: updated });
                      }}
                      placeholder="Date d'obtention"
                    />
                    <Input
                      value={cert.expirationDate}
                      onChange={(e) => {
                        const updated = [...snapshot.certifications];
                        updated[i] = {
                          ...cert,
                          expirationDate: e.target.value,
                        };
                        onChange({ ...snapshot, certifications: updated });
                      }}
                      placeholder="Date d'expiration"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    ...snapshot,
                    certifications: [
                      ...snapshot.certifications,
                      {
                        name: "",
                        issuer: "",
                        issueDate: "",
                        expirationDate: "",
                      },
                    ],
                  })
                }
              >
                <Plus className="size-4" />
                Ajouter une certification
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Constraints */}
        <AccordionItem value="constraints">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Settings className="size-4" />
              <span>Contraintes</span>
              <SectionBadge {...getSectionCompleteness("constraints")} />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {constraintFields.map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label
                    htmlFor={`constraint-${f.key}`}
                    className="text-muted-foreground text-xs"
                  >
                    {f.label}
                  </label>
                  <Input
                    id={`constraint-${f.key}`}
                    value={
                      snapshot.constraints[
                        f.key as keyof typeof snapshot.constraints
                      ]
                    }
                    onChange={(e) => updateConstraints(f.key, e.target.value)}
                    placeholder={f.label}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={onSave} disabled={isSaving} className="w-full">
        <Save className="size-4" />
        {isSaving ? "Sauvegarde en cours..." : "Sauvegarder"}
      </Button>
    </div>
  );
}
