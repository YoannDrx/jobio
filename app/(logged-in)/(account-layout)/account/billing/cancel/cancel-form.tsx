"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, useForm } from "@/features/form/tanstack-form";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { cancelSubscriptionAction } from "../billing.action";

const CANCEL_REASONS = {
  too_expensive: "Trop cher",
  not_using: "Je n'utilise pas assez le produit",
  missing_features: "Fonctionnalités manquantes",
  bugs: "Trop de bugs/problèmes",
  competitor: "Je passe à un concurrent",
  other: "Autre",
} as const;

const CancelSchema = z.object({
  reasonType: z.enum([
    "too_expensive",
    "not_using",
    "missing_features",
    "bugs",
    "competitor",
    "other",
  ] as const),
  details: z
    .string()
    .min(10, "Merci de fournir plus de détails (minimum 10 caractères)"),
});

export function CancelSubscriptionForm() {
  const router = useRouter();

  const { execute: cancelSubscription, isPending } = useAction(
    cancelSubscriptionAction,
    {
      onSuccess: (result) => {
        if (result.data.url) {
          toast.success(
            "Redirection vers le portail de facturation pour annuler ton abonnement.",
          );
          window.location.href = result.data.url;
        }
      },
      onError: (error) => {
        toast.error(
          error.error.serverError ??
            "Impossible d'ouvrir le portail de facturation",
        );
      },
    },
  );

  const form = useForm({
    schema: CancelSchema,
    defaultValues: {
      reasonType: "other" as const,
      details: "",
    },
    onSubmit: async () => {
      cancelSubscription({
        returnUrl: `/account/billing`,
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Annuler l'abonnement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form}>
          <div className="flex flex-col gap-6">
            <form.AppField name="reasonType">
              {(field) => (
                <field.Field>
                  <field.Label>
                    Quelle est la raison principale de ton annulation ?
                  </field.Label>
                  <field.Content>
                    <RadioGroup
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(
                          value as
                            | "too_expensive"
                            | "not_using"
                            | "missing_features"
                            | "bugs"
                            | "competitor"
                            | "other",
                        )
                      }
                      className="gap-2"
                    >
                      {Object.entries(CANCEL_REASONS).map(([value, label]) => (
                        <div key={value} className="flex items-center gap-3">
                          <RadioGroupItem value={value} />
                          <label className="cursor-pointer text-sm font-normal">
                            {label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>

            <form.AppField name="details">
              {(field) => (
                <field.Field>
                  <field.Label>Détails supplémentaires</field.Label>
                  <field.Content>
                    <field.Textarea
                      placeholder="Merci de fournir plus de détails pour nous aider à nous améliorer..."
                      className="min-h-[100px]"
                    />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>

            <div className="flex gap-4">
              <form.SubmitButton variant="destructive" disabled={isPending}>
                Confirmer l'annulation
              </form.SubmitButton>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/account/billing`)}
              >
                Retour
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
