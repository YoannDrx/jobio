"use client";

import { Typography } from "@/components/nowts/typography";
import { DotPattern } from "@/components/svg/dot-pattern";
import { Badge } from "@/components/ui/badge";
import { ClientMarkdown } from "@/features/markdown/client-markdown";
import type { ReactNode } from "react";
import { SectionLayout } from "./section-layout";

export const FeaturesSection = ({
  features,
}: {
  features: FeatureLineProps[];
}) => {
  return (
    <SectionLayout size="sm" className="relative" id="features">
      <div className="relative flex flex-col gap-16 lg:gap-28">
        <div className="flex flex-col items-center gap-2">
          <Badge>Tout ce qu'il te faut.</Badge>
          <Typography variant="h2" className="m-auto max-w-xl text-center">
            Bien plus qu'un suivi de missions.
          </Typography>
          <Typography
            variant="muted"
            className="m-auto max-w-lg text-center text-base"
          >
            Jobio centralise ta prospection freelance : scoring IA, pipeline
            visuel, relances automatiques et analytics. Tout ce dont tu as
            besoin pour signer plus de missions.
          </Typography>
        </div>
        {features.map((f, i) => {
          return (
            <FeatureLine
              key={i}
              badge={f.badge}
              title={f.title}
              description={f.description}
              component={f.component}
            />
          );
        })}
      </div>
    </SectionLayout>
  );
};

type FeatureLineProps = {
  badge: string;
  title: string;
  description: string;
  component: ReactNode;
};

const FeatureLine = (props: FeatureLineProps) => {
  return (
    <div className="flex items-center gap-4 odd:flex-row-reverse max-lg:!flex-col">
      <div className="flex flex-1 flex-col items-start gap-2">
        <Badge color="pink">{props.badge}</Badge>
        <Typography variant="h3" className="">
          {props.title}
        </Typography>
        <ClientMarkdown className="prose-sm">
          {props.description}
        </ClientMarkdown>
      </div>
      <div className="w-full max-w-sm">
        <DotPattern>{props.component}</DotPattern>
      </div>
    </div>
  );
};
