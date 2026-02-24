import { NO_INDEX_ROBOTS } from "@/lib/seo";
import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";
import { AppNavigation } from "./_navigation/app-navigation";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default async function AppLayout(props: LayoutParams) {
  return <AppNavigation>{props.children}</AppNavigation>;
}
