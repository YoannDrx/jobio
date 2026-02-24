import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { OnboardingNewUserWizard } from "@/features/onboarding/components/onboarding-new-user-wizard";

export const metadata: Metadata = {
  title: `Bienvenue | ${SiteConfig.title}`,
  description: "Bienvenue sur Jobio ! Configure ton profil pour commencer.",
};

/**
 * This page is shown when a user logs in. Displays an interactive onboarding wizard.
 */
export default async function Page(_props: PageProps<"/auth/new-user">) {
  const user = await getRequiredUser();

  return <OnboardingNewUserWizard user={user} />;
}
