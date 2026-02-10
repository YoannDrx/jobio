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
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import {
  createContactSchema,
  type CreateContactInput,
} from "@/features/contacts/contacts.schema";

type ContactFormProps = {
  defaultValues?: Partial<CreateContactInput>;
  onSubmit: (data: CreateContactInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function ContactForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Créer le contact",
}: ContactFormProps) {
  const form = useZodForm({
    schema: createContactSchema,
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      role: "",
      notes: "",
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
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Prénom *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Jean" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Nom *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Dupont" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="company"
        render={({ field }) => (
          <FormItem>
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
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fonction</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Responsable RH" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Ex: jean@exemple.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="Ex: +33 6 12 34 56 78" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="linkedinUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profil LinkedIn</FormLabel>
            <FormControl>
              <Input placeholder="https://linkedin.com/in/..." {...field} />
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
                rows={3}
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
