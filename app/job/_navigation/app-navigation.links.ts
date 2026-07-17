import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  isProductFeatureVisible,
  type ProductFeatureKey,
} from "@/config/product-features";
import {
  CalendarCheck,
  CalendarClock,
  FileText,
  Kanban,
  Users,
} from "lucide-react";

const APP_PATH = "/job";

const whenVisible = <T>(feature: ProductFeatureKey, link: T): T[] =>
  isProductFeatureVisible(feature) ? [link] : [];

export const APP_LINKS: NavigationGroup[] = [
  {
    title: "Principal",
    links: [
      ...whenVisible("today", {
        href: APP_PATH,
        Icon: CalendarCheck,
        label: "Aujourd'hui",
        tourId: "dashboard",
      }),
      ...whenVisible("pipeline", {
        href: `${APP_PATH}/pipeline`,
        Icon: Kanban,
        label: "Pipeline",
        tourId: "pipeline-nav",
      }),
      ...whenVisible("followUps", {
        href: `${APP_PATH}/follow-ups`,
        Icon: CalendarClock,
        label: "Relances",
        tourId: "followups-nav",
      }),
      ...whenVisible("cv", {
        href: `${APP_PATH}/cv-studio`,
        Icon: FileText,
        label: "CV",
      }),
      ...whenVisible("contacts", {
        href: `${APP_PATH}/contacts`,
        Icon: Users,
        label: "Contacts",
        tourId: "contacts-nav",
      }),
    ],
  },
];
