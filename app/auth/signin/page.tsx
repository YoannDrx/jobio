import { Typography } from "@/components/nowts/typography";
import { LogoSvg } from "@/components/svg/logo-svg";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { SocialProviders } from "@/lib/auth";
import { getUser } from "@/lib/auth/auth-user";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInProviders } from "./sign-in-providers";

export const metadata: Metadata = {
  title: `Sign In | ${SiteConfig.title}`,
  description:
    "Sign in to your account to access testimonials and manage your projects.",
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
    redirect("/account");
  }

  const providers = Object.keys(SocialProviders ?? {});

  return (
    <Card className="mx-auto h-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader className="flex flex-col items-center justify-center gap-2">
        <div className="mx-auto mt-4 flex flex-row items-center gap-2">
          <LogoSvg size={32} />
          <Typography variant="large">{SiteConfig.title}</Typography>
        </div>

        <CardDescription className="text-center">
          Please sign in to your account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-4">
        <SignInProviders providers={providers} />
      </CardContent>
    </Card>
  );
}
