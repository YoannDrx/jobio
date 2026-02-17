"use client";

import { Typography } from "@/components/nowts/typography";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, Kanban } from "lucide-react";
import { SectionLayout } from "./section-layout";

type PromiseCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const PromiseCard = ({ icon, title, description }: PromiseCardProps) => {
  return (
    <div className="border-muted bg-background/50 hover:border-primary/50 rounded-lg border p-6 backdrop-blur-sm transition-colors">
      <div className="text-primary bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
        {icon}
      </div>
      <Typography variant="h3" className="mb-2">
        {title}
      </Typography>
      <Typography variant="muted" className="text-sm">
        {description}
      </Typography>
    </div>
  );
};

export const PromisesSection = () => {
  const promises: PromiseCardProps[] = [
    {
      icon: <Kanban className="h-6 w-6" />,
      title: "Pipeline intelligent",
      description:
        "Un Kanban pensé pour les freelances. Scoring automatique de tes missions par IA.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Relances au bon moment",
      description:
        "Séquences automatiques, rappels intelligents. Plus jamais de deal oublié.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics actionables",
      description:
        "Quelle plateforme convertit le mieux ? Quel TJM moyen ? Des réponses en un clin d'oeil.",
    },
  ];

  return (
    <SectionLayout size="sm">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Badge>Nos 3 promesses</Badge>
          <Typography variant="h2" className="max-w-2xl">
            Ce qui te change vraiment en tant que freelance
          </Typography>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {promises.map((promise, index) => (
            <PromiseCard
              key={index}
              icon={promise.icon}
              title={promise.title}
              description={promise.description}
            />
          ))}
        </div>
      </div>
    </SectionLayout>
  );
};
