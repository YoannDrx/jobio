"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createContactInteractionAction,
  deleteContactInteractionAction,
  getContactInteractionsAction,
} from "@/features/contacts/contacts-interactions.action";
import {
  Linkedin,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Interaction = {
  id: string;
  type: string;
  description: string;
  date: Date;
  createdAt: Date;
};

type ContactInteractionsProps = {
  contactId: string;
};

const INTERACTION_TYPES = [
  { value: "EMAIL", label: "Email" },
  { value: "CALL", label: "Appel" },
  { value: "MEETING", label: "Reunion" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "MESSAGE", label: "Message" },
  { value: "OTHER", label: "Autre" },
] as const;

const INTERACTION_ICONS: Record<string, typeof Mail> = {
  EMAIL: Mail,
  CALL: Phone,
  MEETING: Video,
  LINKEDIN: Linkedin,
  MESSAGE: MessageSquare,
  OTHER: MoreHorizontal,
};

const INTERACTION_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CALL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  MEETING:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  LINKEDIN: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  MESSAGE:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `Il y a ${months} mois`;
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? "s" : ""}`;
};

export function ContactInteractions({ contactId }: ContactInteractionsProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState("EMAIL");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchInteractions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getContactInteractionsAction({ contactId }),
      );
      setInteractions(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    void fetchInteractions();
  }, [fetchInteractions]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Veuillez entrer une description");
      return;
    }

    try {
      await resolveActionResult(
        createContactInteractionAction({
          contactId,
          type: type as
            | "EMAIL"
            | "CALL"
            | "MEETING"
            | "LINKEDIN"
            | "MESSAGE"
            | "OTHER",
          description,
          date: new Date(date),
        }),
      );
      toast.success("Interaction ajoutee");
      setDescription("");
      setType("EMAIL");
      setDate(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      void fetchInteractions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resolveActionResult(deleteContactInteractionAction({ id }));
      toast.success("Interaction supprimee");
      void fetchInteractions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">
          Interactions ({interactions.length})
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      {showForm && (
        <Card className="bg-muted/30 flex flex-col gap-3 p-3">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERACTION_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Description de l'interaction..."
            rows={2}
            className="text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 text-sm"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              Ajouter
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Chargement...</p>
      ) : interactions.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center">
          <MessageSquare className="size-8 opacity-50" />
          <p className="text-sm">Aucune interaction enregistree</p>
          <p className="text-xs">
            Ajoutez vos echanges pour suivre vos relations
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-0">
          {/* Vertical line */}
          <div className="from-border absolute top-6 bottom-0 left-[15px] w-0.5 bg-gradient-to-b to-transparent" />

          {interactions.map((interaction) => {
            const Icon = INTERACTION_ICONS[interaction.type] ?? MoreHorizontal;
            const colorClass =
              INTERACTION_COLORS[interaction.type] ?? INTERACTION_COLORS.OTHER;
            const label =
              INTERACTION_TYPES.find((t) => t.value === interaction.type)
                ?.label ?? interaction.type;

            return (
              <div
                key={interaction.id}
                className="group flex gap-3 pb-4 last:pb-0"
              >
                {/* Icon circle */}
                <div className="border-background bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          <Icon className="size-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        {label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Content */}
                <div className="border-border bg-card group-hover:border-primary/30 group-hover:bg-primary/5 flex-1 rounded-lg border p-2.5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={`${colorClass} text-xs`}
                          variant="secondary"
                        >
                          {label}
                        </Badge>
                        <span className="text-foreground text-xs font-medium">
                          {getRelativeTime(new Date(interaction.date))}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground cursor-help text-xs">
                                •
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {new Date(interaction.date).toLocaleString(
                                "fr-FR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {interaction.description && (
                        <p className="text-foreground text-sm">
                          {interaction.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={async () => handleDelete(interaction.id)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
