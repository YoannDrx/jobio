"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import {
  createMissionSchema,
  type CreateMissionInput,
} from "@/features/missions/missions.schema";
import { getProfilesAction } from "@/features/profiles/profiles.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { ScoreRing } from "@/components/nowts/score-ring";
import {
  MISSION_STATUS_LABELS,
  PIPELINE_STATUS_VALUES,
  type MissionStatusValue,
} from "@/features/missions/mission-status";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_OPTIONS = PIPELINE_STATUS_VALUES.map((value) => ({
  value,
  label: MISSION_STATUS_LABELS[value],
})) as { value: MissionStatusValue; label: string }[];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

const WORK_TYPE_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybride" },
  { value: "ONSITE", label: "Sur site" },
];

type MissionFormProps = {
  defaultValues?: Partial<CreateMissionInput>;
  score?: number;
  onSubmit: (data: CreateMissionInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function MissionForm({
  defaultValues,
  score,
  onSubmit,
  onCancel,
  submitLabel = "Créer la mission",
}: MissionFormProps) {
  const [stackInput, setStackInput] = useState("");
  const [profiles, setProfiles] = useState<
    { id: string; name: string; isDefault: boolean }[]
  >([]);

  useEffect(() => {
    void resolveActionResult(getProfilesAction({})).then(setProfiles);
  }, []);

  const defaultProfileId =
    defaultValues?.profileId ??
    profiles.find((p) => p.isDefault)?.id ??
    undefined;

  const form = useZodForm({
    schema: createMissionSchema,
    defaultValues: {
      title: "",
      company: "",
      description: "",
      status: "A_POSTULER",
      priority: "MEDIUM",
      stack: [],
      sourceUrl: "",
      notes: "",
      profileId: defaultProfileId,
      ...defaultValues,
    },
  });

  const stack = form.watch("stack");

  const addStackItem = () => {
    const trimmed = stackInput.trim();
    if (trimmed && !stack.includes(trimmed)) {
      form.setValue("stack", [...stack, trimmed]);
      setStackInput("");
    }
  };

  return (
    <Form
      form={form}
      onSubmit={async (data) => {
        await onSubmit(data);
      }}
      className="flex flex-col gap-4"
    >
      {score !== undefined && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <ScoreRing score={score} size={40} />
          <div>
            <p className="text-sm font-medium">Score de compatibilité</p>
            <p className="text-muted-foreground text-xs">
              Basé sur votre profil et cette mission
            </p>
          </div>
        </div>
      )}

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Développeur React Senior" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Entreprise</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Société Générale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tjm"
          render={({ field }) => (
            <FormItem className="w-32">
              <FormLabel>TJM (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="550"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Résumé de la mission en 2-3 phrases..."
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tasksDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tes missions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ce que tu vas concrètement faire au quotidien..."
                rows={3}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="stackDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stack technique</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Contexte technique, architecture, outils..."
                rows={2}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="profileDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profil recherché</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Expérience requise, soft skills attendus..."
                rows={2}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Priorité</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Durée</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 6 mois" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workType"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Mode de travail</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WORK_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Localisation</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Paris" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <FormLabel>Stack technique</FormLabel>
        <div className="flex gap-2">
          <Input
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            placeholder="Ajouter une techno..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStackItem();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addStackItem}>
            Ajouter
          </Button>
        </div>
        {stack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {stack.map((tech, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {tech}
                <button
                  type="button"
                  onClick={() =>
                    form.setValue(
                      "stack",
                      stack.filter((_, j) => j !== i),
                    )
                  }
                  className="hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {profiles.length > 0 && (
        <FormField
          control={form.control}
          name="profileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profil</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un profil..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                      {profile.isDefault ? " (par défaut)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="sourceUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL source</FormLabel>
            <FormControl>
              <Input placeholder="https://..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Notes personnelles..."
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <LoadingButton type="submit" loading={form.formState.isSubmitting}>
          {submitLabel}
        </LoadingButton>
      </div>
    </Form>
  );
}
