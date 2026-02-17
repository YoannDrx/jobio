"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, useForm } from "@/features/form/tanstack-form";
import { authClient, useSession } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

const ChangeEmailFormSchema = z.object({
  newEmail: z.string().email("Veuillez entrer une adresse email valide"),
});

type ChangeEmailFormType = z.infer<typeof ChangeEmailFormSchema>;

export default function ChangeEmailPage() {
  const router = useRouter();
  const session = useSession();

  const changeEmailMutation = useMutation({
    mutationFn: async (values: ChangeEmailFormType) => {
      return unwrapSafePromise(
        authClient.changeEmail({
          newEmail: values.newEmail,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success(
        "Email de vérification envoyé. Vérifiez votre boîte de réception.",
      );
      router.push("/account");
    },
  });

  const form = useForm({
    schema: ChangeEmailFormSchema,
    defaultValues: {
      newEmail: session.data?.user.email ?? "",
    },
    onSubmit: async (values) => {
      await changeEmailMutation.mutateAsync(values);
    },
  });

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Settings</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>Changer l&apos;email</CardTitle>
            <CardDescription>
              Entrez votre nouvelle adresse email. Nous vous enverrons un lien
              de vérification pour confirmer le changement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form form={form} className="space-y-4">
              <form.AppField name="newEmail">
                {(field) => (
                  <field.Field>
                    <field.Label>Nouvel email</field.Label>
                    <field.Content>
                      <field.Input
                        type="email"
                        placeholder="new-email@example.com"
                      />
                      <field.Message />
                    </field.Content>
                  </field.Field>
                )}
              </form.AppField>
              <form.SubmitButton className="w-full">
                Changer l&apos;email
              </form.SubmitButton>
            </Form>
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
