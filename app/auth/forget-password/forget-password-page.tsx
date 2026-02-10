"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Form, useForm } from "@/features/form/tanstack-form";
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

  const forgetPasswordMutation = useMutation({
    mutationFn: async (values: EmailFormType) => {
      return unwrapSafePromise(
        authClient.forgetPassword({
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
        <CardHeader className="text-center">Forget Password</CardHeader>

        <CardDescription className="text-center">
          Enter your email to reset your password
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

          <form.SubmitButton className="w-full">
            Send Reset Link
          </form.SubmitButton>
        </Form>
      </CardFooter>
    </Card>
  );
}
