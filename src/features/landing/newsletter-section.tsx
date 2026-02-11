"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addEmailAction } from "@/features/email/email.action";
import { EmailActionSchema } from "@/features/email/email.schema";
import type { EmailActionSchemaType } from "@/features/email/email.schema";
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function NewsletterSection() {
  const form = useZodForm({
    schema: EmailActionSchema,
    defaultValues: { email: "" },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (values: EmailActionSchemaType) => {
      return resolveActionResult(addEmailAction(values));
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Inscription confirmée !");
      form.reset();
    },
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
      <Card className="overflow-hidden border-white/30 bg-white/80 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/25">
        <CardContent className="grid gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16">
          {/* Colonne gauche : Mailing list */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <Badge className="w-fit">Newsletter</Badge>
              <h2 className="font-caption text-3xl font-semibold tracking-tight sm:text-4xl">
                Reste informé des nouveautés.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                Inscris-toi pour recevoir en avant-première les nouvelles
                fonctionnalités, les conseils de prospection et les mises à jour
                produit.
              </p>
            </div>

            {subscribeMutation.isSuccess ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/50">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Merci ! Tu recevras nos prochaines actualités par email.
                </p>
              </div>
            ) : (
              <Form
                form={form}
                onSubmit={(values) => subscribeMutation.mutate(values)}
                className="flex flex-col gap-3 sm:flex-row sm:items-start"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative">
                          <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Input
                            placeholder="ton@email.com"
                            type="email"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <LoadingButton
                  type="submit"
                  loading={subscribeMutation.isPending}
                  className="shrink-0"
                >
                  S&apos;inscrire
                </LoadingButton>
              </Form>
            )}

            <p className="text-muted-foreground text-xs">
              Pas de spam. Désinscription en un clic.
            </p>
          </div>

          {/* Colonne droite : Bientôt sur mobile */}
          <div className="border-border/70 bg-muted/30 flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed p-6 sm:p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
                <Smartphone className="text-primary size-6" />
              </div>
              <h3 className="font-caption text-xl font-semibold tracking-tight">
                Bientôt sur mobile
              </h3>
              <p className="text-muted-foreground max-w-xs text-sm">
                L&apos;app iOS et Android arrive bientôt pour piloter ta
                prospection où que tu sois.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Badge App Store */}
              <div className="pointer-events-none opacity-40">
                <svg
                  width="120"
                  height="40"
                  viewBox="0 0 120 40"
                  className="fill-current"
                  aria-label="Bientôt sur App Store"
                >
                  <rect
                    width="120"
                    height="40"
                    rx="6"
                    className="fill-foreground"
                  />
                  <text
                    x="60"
                    y="15"
                    textAnchor="middle"
                    className="fill-background text-[7px]"
                  >
                    Bientôt sur
                  </text>
                  <text
                    x="60"
                    y="28"
                    textAnchor="middle"
                    className="fill-background text-[12px] font-semibold"
                  >
                    App Store
                  </text>
                </svg>
              </div>

              {/* Badge Google Play */}
              <div className="pointer-events-none opacity-40">
                <svg
                  width="135"
                  height="40"
                  viewBox="0 0 135 40"
                  className="fill-current"
                  aria-label="Bientôt sur Google Play"
                >
                  <rect
                    width="135"
                    height="40"
                    rx="6"
                    className="fill-foreground"
                  />
                  <text
                    x="67.5"
                    y="15"
                    textAnchor="middle"
                    className="fill-background text-[7px]"
                  >
                    Bientôt sur
                  </text>
                  <text
                    x="67.5"
                    y="28"
                    textAnchor="middle"
                    className="fill-background text-[12px] font-semibold"
                  >
                    Google Play
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
