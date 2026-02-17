import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Bienvenue | ${SiteConfig.title}`,
  description: "Bienvenue sur Jobio ! Configure ton profil pour commencer.",
};

/**
 * This page is show when a user login. You can add an onboarding process here.
 */
export default async function Page(_props: PageProps<"/auth/new-user">) {
  redirect("/app");
}
