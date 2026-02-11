"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { mergeContactsAction } from "@/features/contacts/contacts.action";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  linkedinUrl: string | null;
};

type MergeContactsDialogProps = {
  contactA: Contact;
  contactB: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged: () => void;
};

type FieldChoices = Record<string, "target" | "source">;

export function MergeContactsDialog({
  contactA,
  contactB,
  open,
  onOpenChange,
  onMerged,
}: MergeContactsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState<FieldChoices>({
    firstName: "target",
    lastName: "target",
    company: "target",
    email: "target",
    phone: "target",
    role: "target",
    notes: "target",
    linkedinUrl: "target",
  });

  const handleMerge = async () => {
    setLoading(true);
    try {
      await resolveActionResult(
        mergeContactsAction({
          targetId: contactA.id,
          sourceId: contactB.id,
          fields: choices,
        }),
      );
      toast.success("Contacts fusionnés avec succès");
      onOpenChange(false);
      onMerged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la fusion",
      );
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (
    field: keyof Contact,
    source: "target" | "source",
  ): string => {
    const contact = source === "target" ? contactA : contactB;
    const value = contact[field];
    return value ?? "-";
  };

  const mergedPreview = {
    firstName: getFieldValue("firstName", choices.firstName),
    lastName: getFieldValue("lastName", choices.lastName),
    company: getFieldValue("company", choices.company),
    email: getFieldValue("email", choices.email),
    phone: getFieldValue("phone", choices.phone),
    role: getFieldValue("role", choices.role),
    notes: getFieldValue("notes", choices.notes),
    linkedinUrl: getFieldValue("linkedinUrl", choices.linkedinUrl),
  };

  const fields = [
    { key: "firstName", label: "Prénom" },
    { key: "lastName", label: "Nom" },
    { key: "company", label: "Entreprise" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "role", label: "Fonction" },
    { key: "notes", label: "Notes" },
    { key: "linkedinUrl", label: "URL LinkedIn" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fusionner les contacts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Contact A (Target) */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-medium">Contact A (Cible)</h3>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {contactA.firstName} {contactA.lastName}
                </p>
                {contactA.company && (
                  <p className="text-muted-foreground">{contactA.company}</p>
                )}
              </div>
            </div>

            {/* Fusion Preview */}
            <div className="bg-muted/50 rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-medium">Résultat fusionné</h3>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {mergedPreview.firstName} {mergedPreview.lastName}
                </p>
                {mergedPreview.company !== "-" && (
                  <p className="text-muted-foreground">
                    {mergedPreview.company}
                  </p>
                )}
              </div>
            </div>

            {/* Contact B (Source) */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-medium">Contact B (Source)</h3>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {contactB.firstName} {contactB.lastName}
                </p>
                {contactB.company && (
                  <p className="text-muted-foreground">{contactB.company}</p>
                )}
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <Card className="p-4">
            <h4 className="mb-4 text-sm font-medium">
              Sélectionner les champs à conserver
            </h4>
            <div className="space-y-4">
              {fields.map(({ key, label }) => (
                <div
                  key={key}
                  className="border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <Label className="mb-2 block text-sm font-medium">
                    {label}
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Contact A Option */}
                    <div className="flex items-center gap-2">
                      <RadioGroup
                        value={choices[key]}
                        onValueChange={(value) =>
                          setChoices((prev) => ({
                            ...prev,
                            [key]: value as "target" | "source",
                          }))
                        }
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="target" id={`${key}-target`} />
                          <Label
                            htmlFor={`${key}-target`}
                            className="cursor-pointer text-xs"
                          >
                            {getFieldValue(key as keyof Contact, "target")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Source Option */}
                    <div className="flex items-center gap-2">
                      <RadioGroup
                        value={choices[key]}
                        onValueChange={(value) =>
                          setChoices((prev) => ({
                            ...prev,
                            [key]: value as "target" | "source",
                          }))
                        }
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="source" id={`${key}-source`} />
                          <Label
                            htmlFor={`${key}-source`}
                            className="cursor-pointer text-xs"
                          >
                            {getFieldValue(key as keyof Contact, "source")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Preview */}
                    <div className="text-muted-foreground bg-muted/50 rounded p-2 text-xs font-medium">
                      {mergedPreview[key as keyof typeof mergedPreview]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <DialogFooter>
          <LoadingButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </LoadingButton>
          <LoadingButton loading={loading} onClick={handleMerge}>
            Fusionner les contacts
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
