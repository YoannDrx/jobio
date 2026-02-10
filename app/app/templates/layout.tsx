import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Templates | Jobio",
  description: "Créez et gérez vos templates de messages pour vos relances.",
};

export default function TemplatesLayout(props: LayoutParams) {
  return <>{props.children}</>;
}
