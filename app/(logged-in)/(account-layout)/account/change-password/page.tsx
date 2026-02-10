"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, useForm } from "@/features/form/tanstack-form";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    revokeOtherSessions: z.boolean().default(true),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ChangePasswordFormType = z.infer<typeof ChangePasswordFormSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordFormType) => {
      return unwrapSafePromise(
        authClient.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          revokeOtherSessions: values.revokeOtherSessions,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès");
      router.push("/account");
    },
  });

  const form = useForm({
    schema: ChangePasswordFormSchema,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
    onSubmit: async (values) => {
      await changePasswordMutation.mutateAsync(values);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer le mot de passe</CardTitle>
        <CardDescription>
          Mettez à jour votre mot de passe pour sécuriser votre compte.
        </CardDescription>
      </CardHeader>
      <Form form={form}>
        <CardContent className="space-y-4">
          <form.AppField name="currentPassword">
            {(field) => (
              <field.Field>
                <field.Label>Mot de passe actuel</field.Label>
                <field.Content>
                  <field.Input type="password" />
                  <field.Message />
                </field.Content>
              </field.Field>
            )}
          </form.AppField>
          <form.AppField name="newPassword">
            {(field) => (
              <field.Field>
                <field.Label>Nouveau mot de passe</field.Label>
                <field.Content>
                  <field.Input type="password" />
                  <field.Message />
                </field.Content>
              </field.Field>
            )}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => (
              <field.Field>
                <field.Label>Confirmer le nouveau mot de passe</field.Label>
                <field.Content>
                  <field.Input type="password" />
                  <field.Message />
                </field.Content>
              </field.Field>
            )}
          </form.AppField>
          <form.AppField name="revokeOtherSessions">
            {(field) => (
              <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <field.Label>Déconnecter les autres appareils</field.Label>
                  <field.Description>
                    Cela vous déconnectera de tous les autres appareils où vous
                    êtes actuellement connecté
                  </field.Description>
                </div>
                <field.Switch />
              </div>
            )}
          </form.AppField>
          <form.SubmitButton className="w-full">
            Changer le mot de passe
          </form.SubmitButton>
        </CardContent>
      </Form>
    </Card>
  );
}
