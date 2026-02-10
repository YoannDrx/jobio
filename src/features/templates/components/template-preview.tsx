"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renderTemplate } from "@/features/templates/template-renderer";
import { useState } from "react";

const AVAILABLE_VARIABLES = {
  "mission.title": "Titre de la mission",
  "mission.company": "Entreprise",
  "mission.tjm": "TJM",
  "mission.duration": "Durée",
  "mission.location": "Localisation",
  "mission.workType": "Type de travail",
  "mission.stack": "Stack",
  "contact.firstName": "Prénom du contact",
  "contact.lastName": "Nom du contact",
  "contact.fullName": "Nom complet du contact",
  "contact.company": "Entreprise du contact",
  "contact.role": "Rôle du contact",
  "profile.headline": "Headline du profil",
  "profile.tjmTarget": "TJM cible",
};

type TemplatePreviewProps = {
  template: {
    name: string;
    body: string;
    variables: string[];
  };
};

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const [values, setValues] = useState<Record<string, string | undefined>>({});

  const context = {
    mission: {
      title: values["mission.title"] ?? "",
      company: values["mission.company"] ?? null,
      tjm: values["mission.tjm"] ? parseInt(values["mission.tjm"]) : null,
      duration: values["mission.duration"] ?? null,
      location: values["mission.location"] ?? null,
      workType: values["mission.workType"] ?? null,
      stack: (values["mission.stack"] ?? "").split(",").filter(Boolean),
    },
    contact: {
      firstName: values["contact.firstName"] ?? "",
      lastName: values["contact.lastName"] ?? "",
      company: values["contact.company"] ?? null,
      role: values["contact.role"] ?? null,
    },
    profile: {
      headline: values["profile.headline"] ?? null,
      tjmTarget: values["profile.tjmTarget"]
        ? parseInt(values["profile.tjmTarget"])
        : null,
    },
  };

  const renderedBody = renderTemplate(template.body, context);

  const handleValueChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Variables</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {Object.entries(AVAILABLE_VARIABLES).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <Label htmlFor={`var-${key}`}>{label}</Label>
              <Input
                id={`var-${key}`}
                value={values[key] ?? ""}
                onChange={(e) => handleValueChange(key, e.target.value)}
                placeholder={`{{${key}}}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apercu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-4">
            <p className="text-sm whitespace-pre-wrap">{renderedBody}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
