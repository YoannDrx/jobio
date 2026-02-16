"use client";

import type { CvCoachSnapshot } from "../cv-coach.schema";
import { cn } from "@/lib/utils";
import { User, Briefcase, Code, FolderOpen, CheckCircle2 } from "lucide-react";

type CvCoachProgressBarProps = {
  snapshot: CvCoachSnapshot;
  completenessScore: number;
};

const STEPS = [
  {
    key: "identity",
    label: "Identité",
    icon: User,
    check: (s: CvCoachSnapshot) => {
      const fields = [
        s.identity.fullName,
        s.identity.headline,
        s.identity.location,
        s.identity.email,
      ];
      const filled = fields.filter((f) => f.trim().length > 0).length;
      return filled >= 2;
    },
  },
  {
    key: "experience",
    label: "Parcours",
    icon: Briefcase,
    check: (s: CvCoachSnapshot) =>
      s.experiences.length > 0 || s.education.length > 0,
  },
  {
    key: "skills",
    label: "Compétences",
    icon: Code,
    check: (s: CvCoachSnapshot) =>
      s.skills.hard.length > 0 ||
      s.skills.soft.length > 0 ||
      s.skills.tools.length > 0,
  },
  {
    key: "projects",
    label: "Projets",
    icon: FolderOpen,
    check: (s: CvCoachSnapshot) =>
      s.projects.length > 0 || s.certifications.length > 0,
  },
  {
    key: "finalization",
    label: "Finalisation",
    icon: CheckCircle2,
    check: (s: CvCoachSnapshot) => {
      const hasSummary = s.summary.trim().length > 0;
      const hasConstraints = Object.values(s.constraints).some(
        (v) => v.trim().length > 0,
      );
      return hasSummary && hasConstraints;
    },
  },
] as const;

export function CvCoachProgressBar({
  snapshot,
  completenessScore,
}: CvCoachProgressBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Progression</span>
        <span
          className={cn(
            "text-sm font-semibold",
            completenessScore >= 80
              ? "text-emerald-600"
              : completenessScore >= 55
                ? "text-amber-600"
                : "text-rose-600",
          )}
        >
          {completenessScore}%
        </span>
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => {
          const isCompleted = step.check(snapshot);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                      : "border-muted-foreground/30 text-muted-foreground/50",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] font-medium",
                    isCompleted
                      ? "text-emerald-600"
                      : "text-muted-foreground/70",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "-mt-4 h-0.5 flex-1",
                    isCompleted ? "bg-emerald-500" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
