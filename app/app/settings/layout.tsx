import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Parametres",
  description: "Gerez vos preferences et notifications.",
};

export default function SettingsLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
