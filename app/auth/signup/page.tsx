import { Loader } from "@/components/nowts/loader";
import { LogoSvg } from "@/components/svg/logo-svg";
import { Typography } from "@/components/nowts/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth/auth-user";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignUpCredentialsForm } from "./sign-up-credentials-form";

export const metadata: Metadata = {
  title: `Créer un compte | ${SiteConfig.title}`,
  description: "Crée ton compte Jobio et démarre ton essai Pro de 14 jours.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthSignInPage />
    </Suspense>
  );
}

async function AuthSignInPage() {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader className="flex flex-col items-center justify-center gap-1">
        <LogoSvg size={40} className="mb-4" />
        <CardTitle>Créer un compte {SiteConfig.title}</CardTitle>
        <CardDescription>
          Quelques informations suffisent pour démarrer ton essai Pro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Loader />}>
          <SignUpCredentialsForm />
        </Suspense>

        <Typography variant="muted" className="mt-4 text-xs">
          Tu as déjà un compte ?{" "}
          <Typography variant="link" as={Link} href="/auth/signin">
            Se connecter
          </Typography>
        </Typography>
      </CardContent>
    </Card>
  );
}
