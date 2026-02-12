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

const LANGUAGE_LEVELS = [
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
  { value: "FLUENT", label: "Courant" },
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
      experiences: [],
      education: [],
      certifications: [],
      languages: [],
      projects: [],
      tjmTarget: undefined,
      workTypePreference: undefined,
      zone: "",
      minDuration: "",
      maxDuration: "",
      isDefault: false,
      ...defaultValues,
    },
  });

  const skills = useFieldArray({ control: form.control, name: "skills" });
  const experiences = useFieldArray({
    control: form.control,
    name: "experiences",
  });
  const education = useFieldArray({
    control: form.control,
    name: "education",
  });
  const certifications = useFieldArray({
    control: form.control,
    name: "certifications",
  });
  const languages = useFieldArray({
    control: form.control,
    name: "languages",
  });
  const projects = useFieldArray({
    control: form.control,
    name: "projects",
  });

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

      {/* Expériences */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FormLabel>Expériences</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              experiences.append({ title: "", company: "", description: "" })
            }
          >
            Ajouter une expérience
          </Button>
        </div>
        {experiences.fields.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            {experiences.fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.title`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Poste" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.company`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Entreprise" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => experiences.remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Début (ex: 2022-01)"
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
                    name={`experiences.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Fin (ex: 2024-06)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`experiences.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Description du poste..."
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {index < experiences.fields.length - 1 && (
                  <hr className="my-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FormLabel>Formation</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              education.append({
                degree: "",
                school: "",
                field: "",
                description: "",
              })
            }
          >
            Ajouter une formation
          </Button>
        </div>
        {education.fields.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            {education.fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`education.${index}.degree`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Diplôme" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`education.${index}.school`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Établissement" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => education.remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`education.${index}.field`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Domaine d'étude"
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
                    name={`education.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Début (ex: 2020)"
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
                    name={`education.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Fin (ex: 2023)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`education.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Description, activités, mentions..."
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {index < education.fields.length - 1 && <hr className="my-1" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compétences */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FormLabel>Compétences</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => skills.append({ name: "", level: "BEGINNER" })}
          >
            Ajouter une compétence
          </Button>
        </div>
        {skills.fields.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            {skills.fields.map((field, index) => (
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
                  onClick={() => skills.remove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FormLabel>Certifications</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              certifications.append({ name: "", issuer: "", issueDate: "" })
            }
          >
            Ajouter une certification
          </Button>
        </div>
        {certifications.fields.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            {certifications.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`certifications.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Certification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`certifications.${index}.issuer`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Organisme" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`certifications.${index}.issueDate`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormControl>
                        <Input
                          placeholder="Date"
                          {...field}
                          value={field.value ?? ""}
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
                  onClick={() => certifications.remove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projets */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FormLabel>Projets</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => projects.append({ name: "", description: "" })}
          >
            Ajouter un projet
          </Button>
        </div>
        {projects.fields.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            {projects.fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`projects.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Nom du projet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`projects.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="URL (optionnel)"
                            {...field}
                            value={field.value ?? ""}
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
                    onClick={() => projects.remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`projects.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Début (ex: 2022-01)"
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
                    name={`projects.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Fin (ex: 2024-06)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`projects.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Description du projet..."
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {index < projects.fields.length - 1 && <hr className="my-1" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Langues */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FormLabel>Langues</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => languages.append({ name: "", level: "BEGINNER" })}
          >
            Ajouter une langue
          </Button>
        </div>
        {languages.fields.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            {languages.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`languages.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Langue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`languages.${index}.level`}
                  render={({ field }) => (
                    <FormItem className="w-36">
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
                          {LANGUAGE_LEVELS.map((opt) => (
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => languages.remove(index)}
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
