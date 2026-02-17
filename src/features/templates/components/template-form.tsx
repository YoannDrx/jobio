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
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import {
  createTemplateSchema,
  type CreateTemplateInput,
} from "@/features/templates/templates.schema";
import { TEMPLATE_VARIABLES } from "@/features/templates/template-renderer";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "FIRST_CONTACT", label: "Premier contact" },
  { value: "FOLLOW_UP_J3", label: "Relance J+3" },
  { value: "FOLLOW_UP_J7", label: "Relance J+7" },
  { value: "FOLLOW_UP_J14", label: "Relance J+14" },
  { value: "POST_INTERVIEW", label: "Post-entretien" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "THANK_YOU", label: "Remerciement" },
  { value: "CUSTOM", label: "Personnalise" },
] as const;

type TemplateFormProps = {
  defaultValues?: Partial<CreateTemplateInput>;
  onSubmit: (data: CreateTemplateInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function TemplateForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Creer le template",
}: TemplateFormProps) {
  const form = useZodForm({
    schema: createTemplateSchema,
    defaultValues: {
      name: "",
      type: "FIRST_CONTACT",
      subject: "",
      body: "",
      variables: [],
      ...defaultValues,
    },
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
            <FormLabel>Nom *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Premier contact freelance" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
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
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sujet (optionnel)</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Candidature pour {{mission}}"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="body"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contenu *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Bonjour {{contact.firstName}}, je me permets de vous contacter au sujet de..."
                rows={8}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium">
          Variables disponibles
        </p>
        <div className="flex flex-col gap-3">
          {TEMPLATE_VARIABLES.map((group) => (
            <div key={group.category} className="flex flex-col gap-1.5">
              <p className="text-muted-foreground text-xs font-medium">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.variables.map((variable) => (
                  <Badge
                    key={variable.name}
                    variant="secondary"
                    className="cursor-pointer gap-1 font-mono text-xs"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        `{{${variable.name}}}`,
                      );
                      toast.success(`{{${variable.name}}} copié`);
                    }}
                  >
                    {`{{${variable.name}}}`}
                    <Copy className="size-3" />
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
