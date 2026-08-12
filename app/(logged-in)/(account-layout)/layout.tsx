import { getRequiredUser } from "@/lib/auth/auth-user";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNavigation } from "./account-navigation";

export const metadata: Metadata = {
  title: "Compte",
  description: "Gère les paramètres de ton compte.",
  robots: NO_INDEX_ROBOTS,
};

export default function Layout(props: LayoutProps<"/">) {
  return (
    <Suspense fallback={null}>
      <RouteLayout {...props} />
    </Suspense>
  );
}

async function RouteLayout(props: LayoutProps<"/">) {
  await getRequiredUser();

  return <AccountNavigation>{props.children}</AccountNavigation>;
}
