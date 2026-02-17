"use client";

import { ExternalLink, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { CvCoachSourceEvidenceItem } from "../cv-coach.schema";

type CvCoachSourcePanelProps = {
  sourceEvidence: CvCoachSourceEvidenceItem[];
  messages: { id: string; role: "USER" | "ASSISTANT"; content: string }[];
  onScrollToMessage: (index: number) => void;
};

const confidenceConfig = {
  HIGH: {
    badge: "default" as const,
    label: "Haute",
  },
  MEDIUM: {
    badge: "outline" as const,
    label: "Moyenne",
  },
  LOW: {
    badge: "destructive" as const,
    label: "Basse",
  },
};

const sectionNames: Record<string, string> = {
  identity: "Identité",
  experiences: "Expériences",
  education: "Formation",
  skills: "Compétences",
  projects: "Projets",
  certifications: "Certifications",
  languages: "Langues",
  achievements: "Réalisations",
  summary: "Résumé",
  interests: "Intérêts",
  constraints: "Contraintes",
};

function getSectionName(fieldPath: string): string {
  const section = fieldPath.split(".")[0];
  return (
    sectionNames[section] || section.charAt(0).toUpperCase() + section.slice(1)
  );
}

export function CvCoachSourcePanel({
  sourceEvidence,
  messages: _messages,
  onScrollToMessage,
}: CvCoachSourcePanelProps) {
  if (sourceEvidence.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
        Aucune source disponible.
      </p>
    );
  }

  // Group evidence by section
  const groupedEvidence = sourceEvidence.reduce<
    Partial<Record<string, CvCoachSourceEvidenceItem[]>>
  >((acc, item) => {
    const section = getSectionName(item.fieldPath);
    (acc[section] ??= []).push(item);
    return acc;
  }, {});

  // Sort sections by appearance order (but keep custom order)
  const sectionOrder = [
    "Identité",
    "Résumé",
    "Expériences",
    "Formation",
    "Certifications",
    "Langues",
    "Projets",
    "Compétences",
    "Réalisations",
    "Intérêts",
    "Contraintes",
  ];

  const sortedSections = Object.keys(groupedEvidence).sort((a, b) => {
    const indexA = sectionOrder.indexOf(a);
    const indexB = sectionOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="flex flex-col gap-3">
      {sortedSections.map((section) => (
        <div key={section} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-4" />
            <h3 className="text-sm font-semibold">{section}</h3>
          </div>

          <div className="ml-6 flex flex-col gap-2">
            {(groupedEvidence[section] ?? []).map((item, index) => {
              const config = confidenceConfig[item.confidence];
              return (
                <div
                  key={`${section}-${index}`}
                  className="border-muted bg-muted/30 flex flex-col gap-1.5 rounded-md border p-2.5"
                >
                  <p className="text-muted-foreground text-sm italic">
                    "{item.excerpt}"
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={config.badge} className="text-[10px]">
                      {config.label}
                    </Badge>

                    <button
                      type="button"
                      onClick={() => onScrollToMessage(item.messageIndex)}
                      className={cn(
                        "hover:text-foreground text-muted-foreground flex items-center gap-1 text-xs transition-colors",
                        "cursor-pointer",
                      )}
                    >
                      <ExternalLink className="size-3" />
                      Voir le message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
