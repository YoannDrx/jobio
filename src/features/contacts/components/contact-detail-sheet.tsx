"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  addInteractionAction,
  deleteContactAction,
  updateContactAction,
} from "@/features/contacts/contacts.action";
import { QuickCreateMissionDialog } from "@/features/missions/components/quick-create-mission-dialog";
import {
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ContactWithRelations = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  role: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  missions: {
    id: string;
    title: string;
    company: string | null;
    status: string;
  }[];
  interactions: {
    id: string;
    type: string;
    description: string;
    date: Date;
  }[];
};

type ContactDetailSheetProps = {
  contact: ContactWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contact: ContactWithRelations) => void;
  onRefresh?: () => void;
};

const INTERACTION_TYPES = [
  { value: "EMAIL", label: "Email" },
  { value: "CALL", label: "Appel" },
  { value: "MEETING", label: "Réunion" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "MESSAGE", label: "Message" },
  { value: "OTHER", label: "Autre" },
];

export function ContactDetailSheet({
  contact,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: ContactDetailSheetProps) {
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [showCreateMissionDialog, setShowCreateMissionDialog] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionType, setInteractionType] = useState("EMAIL");
  const [interactionDescription, setInteractionDescription] = useState("");
  const [interactionDate, setInteractionDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  if (!contact) return null;

  const handleSaveNotes = async () => {
    try {
      await resolveActionResult(updateContactAction({ id: contact.id, notes }));
      toast.success("Notes sauvegardées");
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleDelete = async () => {
    try {
      await resolveActionResult(deleteContactAction({ id: contact.id }));
      toast.success("Contact supprimé");
      onOpenChange(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleAddInteraction = async () => {
    if (!interactionDescription.trim()) {
      toast.error("Veuillez entrer une description");
      return;
    }

    try {
      await resolveActionResult(
        addInteractionAction({
          contactId: contact.id,
          type: interactionType as
            | "EMAIL"
            | "CALL"
            | "MEETING"
            | "LINKEDIN"
            | "MESSAGE"
            | "OTHER",
          description: interactionDescription,
          date: new Date(interactionDate),
        }),
      );
      toast.success("Interaction ajoutée");
      setInteractionDescription("");
      setInteractionType("EMAIL");
      setInteractionDate(new Date().toISOString().split("T")[0]);
      setShowInteractionForm(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <SheetTitle className="text-lg">
                {contact.firstName} {contact.lastName}
              </SheetTitle>
              {contact.company && (
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <MapPin className="size-3" />
                  {contact.company}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          {/* Infos de contact */}
          <div className="flex flex-col gap-3">
            {contact.role && (
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  FONCTION
                </p>
                <p className="text-sm">{contact.role}</p>
              </div>
            )}

            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-primary flex items-center gap-2 text-sm hover:underline"
              >
                <Mail className="size-4" />
                {contact.email}
              </a>
            )}

            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="text-primary flex items-center gap-2 text-sm hover:underline"
              >
                <MapPin className="size-4" />
                {contact.phone}
              </a>
            )}

            {contact.linkedinUrl && (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-2 text-sm hover:underline"
              >
                <ExternalLink className="size-4" />
                Profil LinkedIn
              </a>
            )}
          </div>

          <Separator />

          {/* Missions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Missions associées</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateMissionDialog(true)}
              >
                <Plus className="size-4" />
                Créer une mission
              </Button>
            </div>
            {contact.missions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune mission liée
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {contact.missions.map((mission) => (
                  <div
                    key={mission.id}
                    className="border-primary border-l-2 pl-3"
                  >
                    <p className="text-sm font-medium">{mission.title}</p>
                    {mission.company && (
                      <p className="text-muted-foreground text-xs">
                        {mission.company}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-1 text-xs">
                      {mission.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Interactions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Interactions ({contact.interactions.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInteractionForm(!showInteractionForm)}
              >
                Ajouter
              </Button>
            </div>

            {showInteractionForm && (
              <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3">
                <Select
                  value={interactionType}
                  onValueChange={setInteractionType}
                >
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
                  placeholder="Description..."
                  rows={2}
                  className="text-sm"
                  value={interactionDescription}
                  onChange={(e) => setInteractionDescription(e.target.value)}
                />

                <Input
                  type="date"
                  value={interactionDate}
                  onChange={(e) => setInteractionDate(e.target.value)}
                  className="h-8 text-sm"
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInteractionForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleAddInteraction}>
                    Ajouter
                  </Button>
                </div>
              </div>
            )}

            {contact.interactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune interaction
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {contact.interactions.map((interaction) => (
                  <div key={interaction.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground size-3" />
                      <span className="text-muted-foreground text-xs">
                        {new Date(interaction.date).toLocaleDateString("fr-FR")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {interaction.type}
                      </Badge>
                    </div>
                    <p className="text-sm">{interaction.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des notes..."
              rows={3}
            />
            {notes !== (contact.notes ?? "") && (
              <Button variant="outline" size="sm" onClick={handleSaveNotes}>
                Sauvegarder les notes
              </Button>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(contact)}
              >
                <Pencil className="size-4" />
                Modifier
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </div>

          <QuickCreateMissionDialog
            open={showCreateMissionDialog}
            onOpenChange={setShowCreateMissionDialog}
            defaultCompany={contact.company}
            contactId={contact.id}
            onCreated={() => {
              onRefresh?.();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
