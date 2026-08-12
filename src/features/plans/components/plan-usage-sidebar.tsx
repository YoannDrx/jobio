"use client";

import { Progress } from "@/components/ui/progress";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getPlanUsageAction } from "@/features/plans/plan-usage.action";
import {
  Bot,
  Briefcase,
  Users,
  FileText,
  ListOrdered,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";

type UsageItem = {
  used: number;
  limit: number;
};

type PlanUsage = {
  missions: UsageItem;
  contacts: UsageItem;
  aiRequests: UsageItem;
  cvDocuments: UsageItem;
  sequences: UsageItem;
  messageTemplates: UsageItem;
};

const USAGE_CONFIG = [
  { key: "missions" as const, label: "Missions", icon: Briefcase },
  { key: "contacts" as const, label: "Contacts", icon: Users },
  { key: "aiRequests" as const, label: "IA / mois", icon: Bot },
  { key: "cvDocuments" as const, label: "CV Lab", icon: FileText },
  { key: "sequences" as const, label: "Séquences", icon: ListOrdered },
  { key: "messageTemplates" as const, label: "Templates", icon: Mail },
];

export function PlanUsageSidebar() {
  const [usage, setUsage] = useState<PlanUsage | null>(null);

  useEffect(() => {
    void resolveActionResult(getPlanUsageAction()).then(setUsage);
  }, []);

  if (!usage) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <span className="text-muted-foreground text-xs font-medium">
        Usage du plan
      </span>
      {USAGE_CONFIG.map(({ key, label, icon: Icon }) => {
        const item = usage[key];
        if (item.limit <= 0) {
          return null;
        }

        const isUnlimited = item.limit >= 999999;
        const percent = isUnlimited
          ? 0
          : Math.min(100, Math.round((item.used / item.limit) * 100));
        const isNearLimit = !isUnlimited && percent >= 80;

        return (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon className="text-muted-foreground size-3" />
                <span className="text-xs">{label}</span>
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">
                {isUnlimited ? (
                  <>{item.used}</>
                ) : (
                  <>
                    {item.used}/{item.limit}
                  </>
                )}
              </span>
            </div>
            {!isUnlimited && (
              <Progress
                value={percent}
                aria-label={`${label} : ${item.used} sur ${item.limit}`}
                className={`h-1.5 ${isNearLimit ? "[&>[data-slot=progress-indicator]]:bg-status-warning" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
