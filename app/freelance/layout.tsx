import type { LayoutParams } from "@/types/next";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";
import { FreelanceNavigation } from "./_navigation/freelance-navigation";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default async function FreelanceLayout(props: LayoutParams) {
  await getRequiredUser();

  return <FreelanceNavigation>{props.children}</FreelanceNavigation>;
}
