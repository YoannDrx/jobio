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
import { Card } from "@/components/ui/card";

const stepTypeLabels: Record<string, string> = {
  EMAIL: "Email",
  CALL: "Appel",
  MESSAGE: "Message",
  MEETING: "Reunion",
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
        { delayDays: 3, type: "EMAIL", title: "Relance" },
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

      <div className="flex flex-col gap-3">
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

        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <FormField
                    control={form.control}
                    name={`steps.${index}.delayDays`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Délai (jours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="3"
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

                  <FormField
                    control={form.control}
                    name={`steps.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Type</FormLabel>
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="mt-auto"
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name={`steps.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre de l'étape" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Ajoutez au moins une étape
            </p>
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
