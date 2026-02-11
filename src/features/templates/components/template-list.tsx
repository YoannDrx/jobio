"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

const TYPE_LABELS: Partial<Record<string, string>> = {
  FIRST_CONTACT: "Premier contact",
  FOLLOW_UP_J3: "Relance J+3",
  FOLLOW_UP_J7: "Relance J+7",
  FOLLOW_UP_J14: "Relance J+14",
  POST_INTERVIEW: "Post-entretien",
  NEGOTIATION: "Negotiation",
  THANK_YOU: "Remerciement",
  CUSTOM: "Personnalise",
};

type TemplateItem = {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  body: string;
  variables: string[];
  isSystem: boolean;
};

type TemplateListProps = {
  templates: TemplateItem[];
  onEdit: (template: TemplateItem) => void;
  onDelete: (template: TemplateItem) => void;
  onPreview: (template: TemplateItem) => void;
  onDuplicate: (template: TemplateItem) => void;
};

export function TemplateList({
  templates,
  onEdit,
  onDelete,
  onPreview,
  onDuplicate,
}: TemplateListProps) {
  const [filterType, setFilterType] = useState<string>("ALL");

  const filtered =
    filterType === "ALL"
      ? templates
      : templates.filter((t) => t.type === filterType);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {template.name}
                {template.isSystem && (
                  <Badge variant="secondary">Systeme</Badge>
                )}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {TYPE_LABELS[template.type] ?? template.type}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-3 text-sm">
                {template.body}
              </p>
            </CardContent>
            <div className="flex items-center gap-2 px-6 pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPreview(template)}
              >
                <Eye className="size-4" />
                Apercu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(template)}
                disabled={template.isSystem}
              >
                <Pencil className="size-4" />
                Modifier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(template)}
              >
                <Copy className="size-4" />
                Dupliquer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(template)}
                disabled={template.isSystem}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
