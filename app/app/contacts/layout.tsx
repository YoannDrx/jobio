import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts | Jobio",
  description: "Gère tes contacts professionnels et suis tes interactions.",
};

export default function ContactsLayout(props: LayoutParams) {
  return <>{props.children}</>;
}
