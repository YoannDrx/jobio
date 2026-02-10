"use client";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import {
  createProfileSchema,
  type CreateProfileInput,
} from "@/features/profiles/profiles.schema";
import { X } from "lucide-react";
import { useFieldArray } from "react-hook-form";

const SKILL_LEVELS = [
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
  { value: "EXPERT", label: "Expert" },
];

const WORK_TYPE_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybride" },
  { value: "ONSITE", label: "Sur site" },
];

type ProfileFormProps = {
  defaultValues?: Partial<CreateProfileInput>;
  onSubmit: (data: CreateProfileInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function ProfileForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Créer le profil",
}: ProfileFormProps) {
  const form = useZodForm({
    schema: createProfileSchema,
    defaultValues: {
      name: "",
      headline: "",
      bio: "",
      skills: [],
      tjmTarget: undefined,
      workTypePreference: undefined,
      zone: "",
      minDuration: "",
      maxDuration: "",
      isDefault: false,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const addSkill = () => {
    append({ name: "", level: "BEGINNER" });
  };

  return (
    <Form
      form={form}
      onSubmit={async (data) => {
        await onSubmit(data);
      }}
      className="flex flex-col gap-4"
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du profil *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Développeur React Senior" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="headline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre professionnel *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Développeur Full Stack React + Node.js"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Biographie</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Parlez-nous de vos expériences et compétences..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FormLabel>Compétences</FormLabel>
          <Button type="button" variant="outline" size="sm" onClick={addSkill}>
            Ajouter une compétence
          </Button>
        </div>
        {fields.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`skills.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Ex: React" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`skills.${index}.level`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SKILL_LEVELS.map((opt) => (
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
                  name={`skills.${index}.yearsExp`}
                  render={({ field }) => (
                    <FormItem className="w-20">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ans"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="tjmTarget"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>TJM cible (€/j)</FormLabel>
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

        <FormField
          control={form.control}
          name="workTypePreference"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Mode de travail</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
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
      </div>

      <FormField
        control={form.control}
        name="zone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zone/Région préférée</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Île-de-France" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="minDuration"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Durée minimale</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 3 mois" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxDuration"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Durée maximale</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 12 mois" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="isDefault"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="mb-0">Profil par défaut</FormLabel>
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
