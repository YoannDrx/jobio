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
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const PasswordFormSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function ResetPasswordPage({ token }: { token: string }) {
  const router = useRouter();

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
      toast.success("Password reset successfully");
      const newUrl = `${window.location.origin}/auth/signin`;
      window.location.href = newUrl;
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

  if (!token) {
    router.push("/auth/forget-password");
    return null;
  }

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
        <CardHeader className="text-center">Reset Password</CardHeader>

        <CardDescription className="text-center">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardFooter className="w-full border-t pt-6">
        <Form form={form} className="w-full space-y-4">
          <form.AppField name="password">
            {(field) => (
              <field.Field>
                <field.Label>New Password</field.Label>
                <field.Content>
                  <field.Input type="password" placeholder="••••••••" />
                  <field.Message />
                </field.Content>
              </field.Field>
            )}
          </form.AppField>
          <form.SubmitButton className="w-full">
            Reset Password
          </form.SubmitButton>
        </Form>
      </CardFooter>
    </Card>
  );
}
