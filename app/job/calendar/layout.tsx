import type { LayoutParams } from "@/types/next";

export const metadata = {
  title: "Calendrier",
  description:
    "Visualisez vos relances et événements dans un calendrier mensuel",
};

export default async function CalendarLayout({ children }: LayoutParams) {
  return children;
}
