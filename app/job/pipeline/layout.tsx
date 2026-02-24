import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline | Jobio",
  description: "Gère ton pipeline de missions freelance avec le Kanban Jobio.",
};

export default function PipelineLayout(props: LayoutParams) {
  return <>{props.children}</>;
}
