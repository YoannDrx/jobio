import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts | Jobio",
  description: "Gérez vos contacts professionnels et suivez vos interactions.",
};

export default function ContactsLayout(props: LayoutParams) {
  return <>{props.children}</>;
}
