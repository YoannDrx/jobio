"use client";

import { cn } from "@/lib/utils";
import { Form, useForm } from "@/features/form/tanstack-form";
import { authClient } from "@/lib/auth-client";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LoginCredentialsFormType } from "./signup.schema";
import { LoginCredentialsFormScheme } from "./signup.schema";
import { useHydrated } from "@/hooks/use-hydrated";

type PasswordStrength = {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
};

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: "Très faible", color: "bg-red-500" },
    { label: "Faible", color: "bg-orange-500" },
    { label: "Moyen", color: "bg-yellow-500" },
    { label: "Fort", color: "bg-green-500" },
    { label: "Très fort", color: "bg-emerald-500" },
  ];
  return {
    level: score as 0 | 1 | 2 | 3 | 4,
    label: levels[score].label,
    color: levels[score].color,
  };
}

export const SignUpCredentialsForm = () => {
  const isHydrated = useHydrated();
  const submitMutation = useMutation({
    mutationFn: async (values: LoginCredentialsFormType) => {
      return unwrapSafePromise(
        authClient.signUp.email({
          email: values.email,
          password: values.password,
          name: values.name,
          image: values.image,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      const newUrl = window.location.origin + getCallbackUrl("/job");
      window.location.href = newUrl;
    },
  });

  const form = useForm({
    schema: LoginCredentialsFormScheme,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      verifyPassword: "",
      image: "",
    },
    onSubmit: async (values) => {
      if (values.password !== values.verifyPassword) {
        toast.error("Les mots de passe ne correspondent pas");
        return;
      }

      await submitMutation.mutateAsync(values);
    },
  });

  return (
    <Form form={form} className="max-w-lg space-y-4">
      <form.AppField name="name">
        {(field) => (
          <field.Field>
            <field.Label>Nom</field.Label>
            <field.Content>
              <field.Input placeholder="John Doe" />
              <field.Message />
            </field.Content>
          </field.Field>
        )}
      </form.AppField>

      <form.AppField name="email">
        {(field) => (
          <field.Field>
            <field.Label>Email</field.Label>
            <field.Content>
              <field.Input type="email" placeholder="john@doe.com" />
              <field.Message />
            </field.Content>
          </field.Field>
        )}
      </form.AppField>

      <form.AppField name="password">
        {(field) => {
          const strength = getPasswordStrength(field.state.value);
          return (
            <field.Field>
              <field.Label>Mot de passe</field.Label>
              <field.Content>
                <field.Input type="password" />
                <field.Message />
              </field.Content>
              {field.state.value && (
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all",
                          i <= strength.level ? strength.color : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-muted-foreground text-xs">
                      {strength.label}
                    </p>
                  )}
                </div>
              )}
            </field.Field>
          );
        }}
      </form.AppField>

      <form.AppField name="verifyPassword">
        {(field) => (
          <field.Field>
            <field.Label>Confirmer le mot de passe</field.Label>
            <field.Content>
              <field.Input type="password" />
              <field.Message />
            </field.Content>
          </field.Field>
        )}
      </form.AppField>

      <form.SubmitButton
        className="w-full"
        disabled={!isHydrated}
        aria-busy={!isHydrated || submitMutation.isPending}
      >
        Créer mon compte
      </form.SubmitButton>
    </Form>
  );
};
