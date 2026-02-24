import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programmes LinkedIn",
  description:
    "Des templates de posts LinkedIn pour développer ta visibilité freelance",
};

export default async function ProgrammesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
