import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profils | Jobio",
  description:
    "Gère tes profils freelance pour personnaliser le scoring des missions.",
};

export default function ProfilesLayout(props: LayoutParams) {
  return <>{props.children}</>;
}
