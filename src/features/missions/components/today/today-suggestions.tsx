"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Lightbulb,
  MessageCircle,
  Sparkles,
  TrendingUp,
  UserX,
} from "lucide-react";
import Link from "next/link";

type Suggestion = {
  id: string;
  type: "no_followup" | "high_score" | "no_contact" | "tjm_trend";
  message: string;
  link?: string;
};

type TodaySuggestionsProps = {
  suggestions: Suggestion[];
};

const ICON_MAP = {
  no_followup: MessageCircle,
  high_score: Sparkles,
  no_contact: UserX,
  tjm_trend: TrendingUp,
} as const;

const COLOR_MAP = {
  no_followup: "text-status-warning",
  high_score: "text-status-success",
  no_contact: "text-muted-foreground",
  tjm_trend: "text-status-info",
} as const;

export function TodaySuggestions({ suggestions }: TodaySuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="size-4" />
          Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion) => {
            const Icon = ICON_MAP[suggestion.type];
            const color = COLOR_MAP[suggestion.type];

            const content = (
              <div className="hover:bg-muted flex items-start gap-3 rounded-lg border p-3 transition-colors">
                <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
                <p className="text-sm">{suggestion.message}</p>
              </div>
            );

            if (suggestion.link) {
              return (
                <Link key={suggestion.id} href={suggestion.link}>
                  {content}
                </Link>
              );
            }

            return <div key={suggestion.id}>{content}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export type { Suggestion };
