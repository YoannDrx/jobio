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
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const EmailFormSchema = z.object({
  email: z.string().email(),
});

type EmailFormType = z.infer<typeof EmailFormSchema>;

export function ForgetPasswordPage() {
  const router = useRouter();
  const isHydrated = useHydrated();

  const forgetPasswordMutation = useMutation({
    mutationFn: async (values: EmailFormType) => {
      return unwrapSafePromise(
        authClient.requestPasswordReset({
          email: values.email,
          redirectTo: "/auth/reset-password",
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      router.push("/auth/verify");
    },
  });

  const form = useForm({
    schema: EmailFormSchema,
    defaultValues: {
      email: "",
    },
    onSubmit: async (values) => {
      await forgetPasswordMutation.mutateAsync(values);
    },
  });

  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader>
        <div className="flex justify-center">
          <Avatar className="size-16">
            <AvatarFallback>
              <Lock />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardHeader className="text-center">Mot de passe oublié</CardHeader>

        <CardDescription className="text-center">
          Saisis ton email pour recevoir un lien de réinitialisation.
        </CardDescription>
      </CardHeader>

      <CardFooter className="border-t pt-6">
        <Form form={form} className="w-full space-y-4">
          <form.AppField name="email">
            {(field) => (
              <field.Field>
                <field.Label>Email</field.Label>
                <field.Content>
                  <field.Input type="email" placeholder="your@email.com" />
                  <field.Message />
                </field.Content>
              </field.Field>
            )}
          </form.AppField>

          <form.SubmitButton
            className="w-full"
            disabled={!isHydrated}
            aria-busy={!isHydrated || forgetPasswordMutation.isPending}
          >
            Envoyer le lien
          </form.SubmitButton>
        </Form>
      </CardFooter>
    </Card>
  );
}
