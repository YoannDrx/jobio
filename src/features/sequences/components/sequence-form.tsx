"use client";

import { useFieldArray } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/features/form/submit-button";
import { createSequenceSchema } from "@/features/sequences/sequences.schema";
import type { z } from "zod";
import { Trash2, Plus } from "lucide-react";

const stepTypeLabels: Record<string, string> = {
  EMAIL: "Email",
  CALL: "Appel",
  MESSAGE: "Message",
  MEETING: "Reunion",
};

const stepTypeColors: Record<
  string,
  { border: string; bg: string; badge: string }
> = {
  EMAIL: {
    border: "border-blue-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
  },
  CALL: {
    border: "border-green-500",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
  },
  MESSAGE: {
    border: "border-purple-500",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
  },
  MEETING: {
    border: "border-amber-500",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
  },
};

const formSchema = createSequenceSchema;

type SequenceFormValues = z.infer<typeof formSchema>;

type SequenceFormProps = {
  onSubmit: (values: SequenceFormValues) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<SequenceFormValues>;
  submitLabel?: string;
};

export function SequenceForm({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = "Créer",
}: SequenceFormProps) {
  const form = useZodForm({
    schema: formSchema,
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      steps: defaultValues?.steps ?? [
        { delayDays: 3, type: "EMAIL", title: "Relance par email" },
        { delayDays: 7, type: "MESSAGE", title: "Relance LinkedIn" },
        { delayDays: 14, type: "CALL", title: "Appel de suivi" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const handleSubmit = async (values: SequenceFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form form={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom de la séquence</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Suivi post-entretien" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optionnel)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Décrivez la séquence..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <FormLabel>Étapes</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                delayDays: 1,
                type: "EMAIL",
                title: "",
              })
            }
          >
            <Plus className="size-4" />
            Ajouter une étape
          </Button>
        </div>

        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Ajoutez au moins une étape
            </p>
          </div>
        )}

        {fields.length > 0 && (
          <div className="relative flex flex-col gap-6">
            {/* Vertical timeline line */}
            <div className="from-border absolute top-8 bottom-0 left-6 w-0.5 bg-gradient-to-b to-transparent" />

            {fields.map((field, index) => {
              const delayDays = form.watch(`steps.${index}.delayDays`);
              const stepType = form.watch(`steps.${index}.type`);
              const cumulativeDays = form
                .watch("steps")
                .slice(0, index)
                .reduce((sum, step) => sum + step.delayDays, delayDays);
              const colors = stepTypeColors[stepType];

              return (
                <div key={field.id} className="relative flex gap-4">
                  {/* Timeline circle dot */}
                  <div className="relative z-20 mt-2 flex shrink-0 items-center justify-center">
                    <div
                      className={`size-4 rounded-full ${colors.bg} border-2 ${colors.border}`}
                    />
                  </div>

                  {/* Step card */}
                  <div className="flex-1 pb-2">
                    <div
                      className={`border-l-4 ${colors.border} rounded-lg border ${colors.bg} p-4`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${colors.badge}`}
                          >
                            {stepTypeLabels[stepType]}
                          </span>
                          <span className="text-muted-foreground text-xs font-medium">
                            Jour {cumulativeDays}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                        <FormField
                          control={form.control}
                          name={`steps.${index}.type`}
                          render={({ field }) => (
                            <FormItem className="sm:flex-1">
                              <FormLabel className="text-xs">Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(stepTypeLabels).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`steps.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="sm:flex-1">
                              <FormLabel className="text-xs">Titre</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Titre de l'étape"
                                  className="h-8 text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`steps.${index}.delayDays`}
                          render={({ field }) => (
                            <FormItem className="sm:w-20">
                              <FormLabel className="text-xs">
                                Délai (j)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="3"
                                  className="h-8 text-xs"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value, 10))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <LoadingButton type="submit" loading={form.formState.isSubmitting}>
          {submitLabel}
        </LoadingButton>
      </div>
    </Form>
  );
}
