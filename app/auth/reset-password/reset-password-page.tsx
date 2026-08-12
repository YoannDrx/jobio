"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Form, useForm } from "@/features/form/tanstack-form";
import { useHydrated } from "@/hooks/use-hydrated";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const PasswordFormSchema = z.object({
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export function ResetPasswordPage({ token }: { token: string }) {
  const router = useRouter();
  const isHydrated = useHydrated();
  const resetPasswordMutation = useMutation({
    mutationFn: async (values: { password: string }) => {
      return unwrapSafePromise(
        authClient.resetPassword({
          token: token,
          newPassword: values.password,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Mot de passe réinitialisé avec succès");
      router.push("/auth/signin");
      router.refresh();
    },
  });

  const form = useForm({
    schema: PasswordFormSchema,
    defaultValues: {
      password: "",
    },
    onSubmit: async (values) => {
      await resetPasswordMutation.mutateAsync(values);
    },
  });

  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader>
        <div className="flex justify-center">
          <Avatar className="size-16">
            <AvatarFallback>
              <RefreshCcw />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardHeader className="text-center">
          Réinitialiser le mot de passe
        </CardHeader>

        <CardDescription className="text-center">
          Saisis ton nouveau mot de passe ci-dessous.
        </CardDescription>
      </CardHeader>
      <CardFooter className="w-full border-t pt-6">
        <Form form={form} className="w-full space-y-4">
          <form.AppField name="password">
            {(field) => (
              <field.Field>
                <field.Label>Nouveau mot de passe</field.Label>
                <field.Content>
                  <field.Input type="password" placeholder="••••••••" />
                  <field.Message />
                </field.Content>
              </field.Field>
            )}
          </form.AppField>
          <form.SubmitButton
            className="w-full"
            disabled={!isHydrated}
            aria-busy={!isHydrated || resetPasswordMutation.isPending}
          >
            Réinitialiser le mot de passe
          </form.SubmitButton>
        </Form>
      </CardFooter>
    </Card>
  );
}
