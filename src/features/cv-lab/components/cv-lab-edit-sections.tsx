"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type CvLabSection } from "../cv-lab.schema";
import { ArrowDown, ArrowUp } from "lucide-react";

const SECTION_LABELS: Record<CvLabSection, string> = {
  summary: "Résumé",
  experiences: "Expériences",
  skills: "Compétences",
  projects: "Projets",
  education: "Formation",
  languages: "Langues",
  certifications: "Certifications",
};

type CvLabEditSectionsProps = {
  sectionOrder: CvLabSection[];
  hiddenSections: CvLabSection[];
  onToggleSection: (section: CvLabSection, visible: boolean) => void;
  onMoveSection: (section: CvLabSection, direction: "up" | "down") => void;
};

export function CvLabEditSections({
  sectionOrder,
  hiddenSections,
  onToggleSection,
  onMoveSection,
}: CvLabEditSectionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {sectionOrder.map((section, index) => {
        const isHidden = hiddenSections.includes(section);
        return (
          <div
            key={section}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={!isHidden}
                onCheckedChange={(checked) => onToggleSection(section, checked)}
              />
              <span className="text-sm">{SECTION_LABELS[section]}</span>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => onMoveSection(section, "up")}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={index === sectionOrder.length - 1}
                onClick={() => onMoveSection(section, "down")}
              >
                <ArrowDown className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
