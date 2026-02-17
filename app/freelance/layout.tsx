import type { LayoutParams } from "@/types/next";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { FreelanceNavigation } from "./_navigation/freelance-navigation";

export default async function FreelanceLayout(props: LayoutParams) {
  await getRequiredUser();

  return <FreelanceNavigation>{props.children}</FreelanceNavigation>;
}
