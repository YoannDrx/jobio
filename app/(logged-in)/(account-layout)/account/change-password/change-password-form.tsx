"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LoadingButton } from "@/features/form/submit-button";
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

export function ChangePasswordForm() {
  const router = useRouter();

  const form = useZodForm({
    schema: ChangePasswordFormSchema,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof ChangePasswordFormSchema>) => {
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

  function onSubmit(values: z.infer<typeof ChangePasswordFormSchema>) {
    changePasswordMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer le mot de passe</CardTitle>
        <CardDescription>
          Mets à jour ton mot de passe pour sécuriser ton compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe actuel</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revokeOtherSessions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Déconnecter les autres appareils</FormLabel>
                  <FormDescription>
                    Toutes les autres sessions actives seront fermées.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <LoadingButton
            loading={changePasswordMutation.isPending}
            type="submit"
            className="w-full"
          >
            Changer le mot de passe
          </LoadingButton>
        </Form>
      </CardContent>
    </Card>
  );
}
