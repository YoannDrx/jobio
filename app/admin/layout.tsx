import { NO_INDEX_ROBOTS } from "@/lib/seo";
import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";
import { AdminNavigation } from "./_navigation/admin-navigation";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default async function AdminLayout(props: LayoutParams) {
  return <AdminNavigation>{props.children}</AdminNavigation>;
}
