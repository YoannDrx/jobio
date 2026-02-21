"use client";

import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

type Feature = {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  ultra: string | boolean;
};

type Category = {
  name: string;
  features: Feature[];
};

const categories: Category[] = [
  {
    name: "Prospection",
    features: [
      { name: "Missions", free: "15", pro: "Illimité", ultra: "Illimité" },
      { name: "Profils", free: "2", pro: "5", ultra: "Illimité" },
      { name: "Contacts", free: "30", pro: "200", ultra: "Illimité" },
      { name: "Plateformes", free: "3", pro: "10", ultra: "Illimité" },
      { name: "Entreprises", free: "10", pro: "50", ultra: "Illimité" },
    ],
  },
  {
    name: "CV Lab",
    features: [
      { name: "Documents CV", free: "1", pro: "10", ultra: "Illimité" },
      { name: "Templates", free: "Classic", pro: "Tous", ultra: "Tous" },
      { name: "ATS Scoring", free: false, pro: true, ultra: true },
      { name: "CV Coach IA", free: false, pro: false, ultra: true },
    ],
  },
  {
    name: "Automatisation",
    features: [
      { name: "Relances auto", free: false, pro: true, ultra: true },
      { name: "Séquences", free: false, pro: "3", ultra: "Illimité" },
      { name: "Templates messages", free: "3", pro: "20", ultra: "Illimité" },
      { name: "Export CSV", free: false, pro: true, ultra: true },
    ],
  },
  {
    name: "Facturation",
    features: [
      { name: "Clients", free: false, pro: "10", ultra: "Illimité" },
      { name: "Devis", free: false, pro: "50", ultra: "Illimité" },
      { name: "Factures", free: false, pro: "50", ultra: "Illimité" },
      { name: "Catalogue", free: false, pro: "25", ultra: "Illimité" },
    ],
  },
  {
    name: "Intelligence IA",
    features: [
      { name: "Requêtes/mois", free: "5", pro: "50", ultra: "999" },
      { name: "Génération emails", free: false, pro: true, ultra: true },
      { name: "LinkedIn Audit", free: false, pro: true, ultra: true },
    ],
  },
  {
    name: "Analytics",
    features: [
      {
        name: "Historique",
        free: "7 jours",
        pro: "90 jours",
        ultra: "Illimité",
      },
    ],
  },
  {
    name: "Support",
    features: [
      {
        name: "Type",
        free: "Communautaire",
        pro: "Email prioritaire",
        ultra: "Chat prioritaire",
      },
    ],
  },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="size-4 text-green-600" />
    ) : (
      <X className="text-muted-foreground size-4" />
    );
  }
  return <span>{value}</span>;
}

export function PricingComparisonTable() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 sticky top-0 border-b">
              <th className="px-4 py-4 text-left">
                <Typography variant="small" className="font-semibold">
                  Plan
                </Typography>
              </th>
              <th
                className={cn(
                  "min-w-[120px] px-4 py-4 text-center",
                  "bg-muted/30",
                )}
              >
                <Typography variant="small" className="font-semibold">
                  Free
                </Typography>
              </th>
              <th
                className={cn(
                  "min-w-[120px] px-4 py-4 text-center",
                  "bg-primary/10",
                )}
              >
                <Typography
                  variant="small"
                  className="text-primary font-semibold"
                >
                  Pro
                </Typography>
              </th>
              <th
                className={cn(
                  "min-w-[120px] px-4 py-4 text-center",
                  "bg-muted/30",
                )}
              >
                <Typography variant="small" className="font-semibold">
                  Ultra
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <Fragment key={category.name}>
                <tr>
                  <td
                    colSpan={4}
                    className="bg-muted/20 border-t border-b px-4 py-3"
                  >
                    <Typography variant="h3" className="text-sm">
                      {category.name}
                    </Typography>
                  </td>
                </tr>
                {category.features.map((feature, featureIdx) => (
                  <tr
                    key={`${category.name}-${featureIdx}`}
                    className="hover:bg-muted/30 border-b transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Typography variant="muted">{feature.name}</Typography>
                    </td>
                    <td className={cn("px-4 py-4 text-center", "bg-muted/5")}>
                      <FeatureValue value={feature.free} />
                    </td>
                    <td className={cn("px-4 py-4 text-center", "bg-primary/5")}>
                      <FeatureValue value={feature.pro} />
                    </td>
                    <td className={cn("px-4 py-4 text-center", "bg-muted/5")}>
                      <FeatureValue value={feature.ultra} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
