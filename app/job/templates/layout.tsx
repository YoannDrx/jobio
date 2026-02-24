import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Templates | Jobio",
  description: "Crée et gère tes templates de messages pour tes relances.",
};

export default function TemplatesLayout(props: LayoutParams) {
  return <>{props.children}</>;
}
