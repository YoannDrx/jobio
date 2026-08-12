import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ResetPasswordPage } from "./reset-password-page";

export const metadata: Metadata = {
  title: `Réinitialiser le mot de passe | ${SiteConfig.title}`,
  description: "Choisis un nouveau mot de passe pour sécuriser ton compte.",
};

export default function Page(props: PageProps<"/auth/reset-password">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/auth/reset-password">) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (typeof token !== "string" || token.length === 0) {
    redirect("/auth/forget-password");
  }

  return <ResetPasswordPage token={token} />;
}
