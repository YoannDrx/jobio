"use client";

import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  mergeContactsAction,
  undoContactMergeAction,
} from "@/features/contacts/contacts.action";
import type { MergeContactFieldChoices } from "@/features/contacts/contacts.schema";
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useState } from "react";
import { toast } from "sonner";

export type MergeDialogContact = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  linkedinUrl: string | null;
  tags: string[];
};

type MergeContactsDialogProps = {
  contactA: MergeDialogContact;
  contactB: MergeDialogContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged: () => void;
  onMerge?: (choices: MergeContactFieldChoices) => Promise<void>;
  onKeepBoth?: () => Promise<void>;
  description?: string;
  sourceLabel?: string;
  targetLabel?: string;
};

const INITIAL_CHOICES: MergeContactFieldChoices = {
  firstName: "target",
  lastName: "target",
  company: "target",
  email: "target",
  phone: "target",
  role: "target",
  notes: "target",
  linkedinUrl: "target",
};

const FIELDS = [
  { key: "firstName", label: "Prénom" },
  { key: "lastName", label: "Nom" },
  { key: "company", label: "Entreprise" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Téléphone" },
  { key: "role", label: "Fonction" },
  { key: "notes", label: "Notes" },
  { key: "linkedinUrl", label: "URL LinkedIn" },
] as const;

export function MergeContactsDialog({
  contactA,
  contactB,
  open,
  onOpenChange,
  onMerged,
  onMerge,
  onKeepBoth,
  description = "Compare les informations avant de choisir le résultat à conserver.",
  sourceLabel = "Contact source",
  targetLabel = "Contact existant",
}: MergeContactsDialogProps) {
  const [pendingAction, setPendingAction] = useState<"keep" | "merge" | null>(
    null,
  );
  const [choices, setChoices] =
    useState<MergeContactFieldChoices>(INITIAL_CHOICES);

  const getFieldValue = (
    field: keyof MergeContactFieldChoices,
    source: "target" | "source",
  ) => {
    const contact = source === "target" ? contactA : contactB;
    const value = contact[field];
    return value?.trim() ? value : "Non renseigné";
  };

  const handleMerge = async () => {
    setPendingAction("merge");
    try {
      let mergeLogId: string | null = null;
      if (onMerge) {
        await onMerge(choices);
      } else {
        const result = await resolveActionResult(
          mergeContactsAction({
            targetId: contactA.id,
            sourceId: contactB.id,
            fields: choices,
          }),
        );
        mergeLogId = result.mergeLogId;
      }
      toast.success("Contacts fusionnés avec succès", {
        action: mergeLogId
          ? {
              label: "Annuler la fusion",
              onClick: () => {
                void resolveActionResult(undoContactMergeAction({ mergeLogId }))
                  .then(() => {
                    toast.success(
                      "Fusion annulée, les deux contacts sont restaurés",
                    );
                    onMerged();
                  })
                  .catch((error: unknown) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Impossible d’annuler la fusion",
                    );
                  });
              },
            }
          : undefined,
      });
      onOpenChange(false);
      onMerged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la fusion",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleKeepBoth = async () => {
    if (!onKeepBoth) return;

    setPendingAction("keep");
    try {
      await onKeepBoth();
      onOpenChange(false);
      onMerged();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de créer le second contact",
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doublon détecté — comparer et fusionner</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {targetLabel}
            </p>
            <p className="mt-2 font-semibold">
              {contactA.firstName} {contactA.lastName}
            </p>
            <p className="text-muted-foreground text-sm">
              {contactA.company?.trim()
                ? contactA.company
                : "Entreprise non renseignée"}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {sourceLabel}
            </p>
            <p className="mt-2 font-semibold">
              {contactB.firstName} {contactB.lastName}
            </p>
            <p className="text-muted-foreground text-sm">
              {contactB.company?.trim()
                ? contactB.company
                : "Entreprise non renseignée"}
            </p>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="mb-1 text-sm font-medium">
            Informations du contact final
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Les missions, interactions, emails, sociétés et tags sont réunis
            automatiquement.
          </p>
          <div className="divide-y">
            {FIELDS.map(({ key, label }) => (
              <fieldset key={key} className="grid gap-3 py-4 md:grid-cols-3">
                <legend className="text-sm font-medium">{label}</legend>
                <RadioGroup
                  value={choices[key]}
                  onValueChange={(value) =>
                    setChoices((current) => ({
                      ...current,
                      [key]: value as "target" | "source",
                    }))
                  }
                  aria-label={`Valeur à conserver pour ${label}`}
                  className="grid gap-2 sm:grid-cols-2 md:col-span-2"
                >
                  <Label
                    htmlFor={`${key}-target`}
                    className="hover:bg-muted flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3"
                  >
                    <RadioGroupItem value="target" id={`${key}-target`} />
                    <span className="min-w-0 text-sm break-words">
                      {getFieldValue(key, "target")}
                    </span>
                  </Label>
                  <Label
                    htmlFor={`${key}-source`}
                    className="hover:bg-muted flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3"
                  >
                    <RadioGroupItem value="source" id={`${key}-source`} />
                    <span className="min-w-0 text-sm break-words">
                      {getFieldValue(key, "source")}
                    </span>
                  </Label>
                </RadioGroup>
              </fieldset>
            ))}
          </div>
        </Card>

        <DialogFooter className="gap-2 sm:justify-between">
          <LoadingButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pendingAction !== null}
          >
            Annuler
          </LoadingButton>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {onKeepBoth ? (
              <LoadingButton
                variant="secondary"
                loading={pendingAction === "keep"}
                disabled={pendingAction !== null}
                onClick={handleKeepBoth}
              >
                Conserver les deux
              </LoadingButton>
            ) : null}
            <LoadingButton
              loading={pendingAction === "merge"}
              disabled={pendingAction !== null}
              onClick={handleMerge}
            >
              Fusionner dans l’existant
            </LoadingButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
