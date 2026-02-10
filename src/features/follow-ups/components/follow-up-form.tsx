"use client";

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
import {
  createFollowUpSchema,
  type CreateFollowUpInput,
} from "@/features/follow-ups/follow-ups.schema";
import type { z } from "zod";

const followUpTypeLabels: Record<CreateFollowUpInput["type"], string> = {
  EMAIL: "Email",
  CALL: "Appel",
  MESSAGE: "Message",
  MEETING: "Reunion",
};

const formSchema = createFollowUpSchema.omit({ missionId: true });

type FollowUpFormValues = z.infer<typeof formSchema>;

type FollowUpFormProps = {
  onSubmit: (values: FollowUpFormValues) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<FollowUpFormValues>;
  submitLabel?: string;
};

export function FollowUpForm({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = "Creer",
}: FollowUpFormProps) {
  const form = useZodForm({
    schema: formSchema,
    defaultValues: {
      type: defaultValues?.type ?? "EMAIL",
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      scheduledAt: defaultValues?.scheduledAt ?? new Date(),
      templateId: defaultValues?.templateId,
    },
  });

  const handleSubmit = async (values: FollowUpFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form form={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Type de relance" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(
                  Object.entries(followUpTypeLabels) as [
                    CreateFollowUpInput["type"],
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
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
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre</FormLabel>
            <FormControl>
              <Input placeholder="Titre de la relance" {...field} />
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
                placeholder="Details de la relance..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="scheduledAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date prevue</FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                value={
                  field.value instanceof Date
                    ? field.value.toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  field.onChange(date);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
