"use client";

import { Typography } from "@/components/nowts/typography";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/submit-button";
import { authClient } from "@/lib/auth-client";
import { getCallbackUrl, sanitizeCallbackUrl } from "@/lib/auth/auth-utils";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useLocalStorage } from "react-use";
import { toast } from "sonner";
import { z } from "zod";
import { useHydrated } from "@/hooks/use-hydrated";

const LoginCredentialsFormScheme = z.object({
  email: z.string().email(),
  password: z.string().optional(),
});

type LoginCredentialsFormType = z.infer<typeof LoginCredentialsFormScheme>;

export const SignInCredentialsAndMagicLinkForm = (props: {
  callbackUrl?: string;
}) => {
  const isHydrated = useHydrated();
  const safeDefaultCallbackUrl = sanitizeCallbackUrl(props.callbackUrl, "/job");
  const form = useZodForm({
    schema: LoginCredentialsFormScheme,
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [isUsingCredentials, setIsUsingCredentials] = useLocalStorage(
    "sign-in-with-credentials",
    true,
  );

  const signInMutation = useMutation({
    mutationFn: async (values: LoginCredentialsFormType) => {
      if (isUsingCredentials) {
        return unwrapSafePromise(
          authClient.signIn.email({
            email: values.email,
            password: values.password ?? "",
            rememberMe: true,
          }),
        );
      } else {
        return unwrapSafePromise(
          authClient.signIn.magicLink({
            email: values.email,
            callbackURL: getCallbackUrl(safeDefaultCallbackUrl),
          }),
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      const callbackUrl = getCallbackUrl(safeDefaultCallbackUrl);
      const newUrl =
        window.location.origin +
        (isUsingCredentials ? callbackUrl : "/auth/verify");
      window.location.href = newUrl;
    },
  });

  function onSubmit(values: LoginCredentialsFormType) {
    signInMutation.mutate(values);
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="max-w-lg space-y-4">
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="john@doe.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {isUsingCredentials ? (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="flex-1">
              <div className="flex items-center justify-between">
                <FormLabel>Mot de passe</FormLabel>
                <Link
                  href="/auth/forget-password"
                  className="text-sm underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <LoadingButton
        loading={signInMutation.isPending}
        disabled={!isHydrated}
        aria-busy={!isHydrated || signInMutation.isPending}
        type="submit"
        className="ring-offset-card w-full ring-offset-2"
      >
        {isUsingCredentials ? "Se connecter" : "Recevoir un lien de connexion"}
      </LoadingButton>

      {isUsingCredentials ? (
        <Typography variant="muted" className="text-xs">
          Tu préfères te connecter sans mot de passe ?{" "}
          <Typography
            variant="link"
            as="button"
            type="button"
            onClick={() => {
              setIsUsingCredentials(false);
            }}
          >
            Utiliser un lien magique
          </Typography>
        </Typography>
      ) : (
        <Typography variant="muted" className="text-xs">
          Tu préfères utiliser ton mot de passe ?{" "}
          <Typography
            variant="link"
            as="button"
            type="button"
            onClick={() => {
              setIsUsingCredentials(true);
            }}
          >
            Utiliser le mot de passe
          </Typography>
        </Typography>
      )}
    </Form>
  );
};
