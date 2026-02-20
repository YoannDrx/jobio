"use client";

import { Button } from "@/components/ui/button";
import {
  BarChart3Icon,
  BriefcaseIcon,
  CalendarIcon,
  FileTextIcon,
  MessageSquareIcon,
  ReceiptIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo } from "react";

type SuggestedPrompt = {
  label: string;
  prompt: string;
  icon: React.ReactNode;
  category: string;
};

const ALL_PROMPTS: SuggestedPrompt[] = [
  // Pipeline
  {
    label: "Mon pipeline",
    prompt:
      "Résume mon pipeline actuel et les missions qui nécessitent une action.",
    icon: <TrendingUpIcon className="size-4" />,
    category: "Pipeline",
  },
  {
    label: "Taux de conversion",
    prompt:
      "Quel est mon taux de conversion candidature → entretien → mission ?",
    icon: <BarChart3Icon className="size-4" />,
    category: "Pipeline",
  },
  {
    label: "Missions prioritaires",
    prompt: "Quelles missions nécessitent une action urgente ?",
    icon: <BriefcaseIcon className="size-4" />,
    category: "Pipeline",
  },
  // Relances
  {
    label: "Relances du jour",
    prompt: "Quelles relances dois-je faire aujourd'hui ?",
    icon: <CalendarIcon className="size-4" />,
    category: "Relances",
  },
  {
    label: "Relances en retard",
    prompt: "Quelles relances sont en retard ?",
    icon: <CalendarIcon className="size-4" />,
    category: "Relances",
  },
  {
    label: "Rédiger une relance",
    prompt:
      "Aide-moi à rédiger un message de relance professionnel et non-intrusif.",
    icon: <MessageSquareIcon className="size-4" />,
    category: "Relances",
  },
  // Contacts
  {
    label: "Contacts récents",
    prompt:
      "Quels sont mes contacts les plus récents et les interactions associées ?",
    icon: <UsersIcon className="size-4" />,
    category: "Contacts",
  },
  {
    label: "Prospection entreprises",
    prompt: "Où en est ma prospection entreprises cibles ?",
    icon: <UsersIcon className="size-4" />,
    category: "Contacts",
  },
  // Facturation
  {
    label: "Factures en attente",
    prompt: "Quelles factures sont en attente de paiement ?",
    icon: <ReceiptIcon className="size-4" />,
    category: "Facturation",
  },
  {
    label: "CA du mois",
    prompt: "Quel est mon chiffre d'affaires du mois en cours ?",
    icon: <ReceiptIcon className="size-4" />,
    category: "Facturation",
  },
  {
    label: "Devis en cours",
    prompt: "Quels devis sont en attente de réponse ?",
    icon: <ReceiptIcon className="size-4" />,
    category: "Facturation",
  },
  // CV
  {
    label: "Mes documents CV",
    prompt: "Donne-moi un aperçu de mes CV et documents dans le CV Lab.",
    icon: <FileTextIcon className="size-4" />,
    category: "CV",
  },
  // Analytics
  {
    label: "Santé du pipeline",
    prompt:
      "Évalue la santé globale de mon pipeline et donne-moi des recommandations.",
    icon: <BarChart3Icon className="size-4" />,
    category: "Analytics",
  },
  {
    label: "Prévision de revenus",
    prompt: "Quelle est ma prévision de revenus basée sur le pipeline actuel ?",
    icon: <TrendingUpIcon className="size-4" />,
    category: "Analytics",
  },
  // Stratégie
  {
    label: "Plan du jour",
    prompt:
      "Qu'est-ce que je devrais prioriser aujourd'hui dans ma prospection ?",
    icon: <CalendarIcon className="size-4" />,
    category: "Stratégie",
  },
  {
    label: "Évaluer mon TJM",
    prompt:
      "Aide-moi à évaluer si mon TJM est bien positionné et comment le négocier.",
    icon: <TrendingUpIcon className="size-4" />,
    category: "Stratégie",
  },
  {
    label: "Préparer un entretien",
    prompt:
      "Aide-moi à préparer mon prochain entretien client : questions à anticiper, points à valoriser.",
    icon: <BriefcaseIcon className="size-4" />,
    category: "Stratégie",
  },
];

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type ChatbotSuggestedPromptsProps = {
  onSelectPrompt: (prompt: string) => void;
};

export function ChatbotSuggestedPrompts({
  onSelectPrompt,
}: ChatbotSuggestedPromptsProps) {
  const prompts = useMemo(() => shuffleAndPick(ALL_PROMPTS, 6), []);

  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {prompts.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          className="h-auto flex-col items-start gap-1.5 p-3 text-left"
          onClick={() => onSelectPrompt(item.prompt)}
        >
          <div className="text-muted-foreground">{item.icon}</div>
          <span className="text-xs leading-tight font-medium">
            {item.label}
          </span>
        </Button>
      ))}
    </div>
  );
}
