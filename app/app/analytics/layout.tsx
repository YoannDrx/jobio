import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Jobio",
  description: "Analyse tes performances de prospection freelance.",
};

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
