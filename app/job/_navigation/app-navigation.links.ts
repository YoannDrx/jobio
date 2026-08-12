import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  isProductFeatureVisible,
  type ProductFeatureKey,
} from "@/config/product-features";
import {
  BarChart3,
  Bot,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  FileText,
  Kanban,
  LayoutTemplate,
  Mail,
  Monitor,
  Receipt,
  Repeat2,
  Radar,
  Sparkles,
  Target,
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
      ...whenVisible("opportunityDiscovery", {
        href: `${APP_PATH}/opportunities`,
        Icon: Radar,
        label: "Radar missions",
        tourId: "opportunities-nav",
      }),
      ...whenVisible("analytics", {
        href: `${APP_PATH}/analytics`,
        Icon: BarChart3,
        label: "Analytics",
      }),
    ],
  },
  {
    title: "Prospection",
    links: [
      ...whenVisible("contacts", {
        href: `${APP_PATH}/contacts`,
        Icon: Users,
        label: "Contacts",
        tourId: "contacts-nav",
      }),
      ...whenVisible("followUps", {
        href: `${APP_PATH}/follow-ups`,
        Icon: CalendarClock,
        label: "Relances",
        tourId: "followups-nav",
      }),
      ...whenVisible("calendar", {
        href: `${APP_PATH}/calendar`,
        Icon: CalendarDays,
        label: "Calendrier",
      }),
      ...whenVisible("sequences", {
        href: `${APP_PATH}/sequences`,
        Icon: Repeat2,
        label: "Séquences",
      }),
      ...whenVisible("platforms", {
        href: `${APP_PATH}/platforms`,
        Icon: Monitor,
        label: "Plateformes",
      }),
    ],
  },
  {
    title: "Candidature",
    links: [
      ...whenVisible("profiles", {
        href: `${APP_PATH}/profiles`,
        Icon: Target,
        label: "Positionnements",
      }),
      ...whenVisible("cv", {
        href: `${APP_PATH}/cv-studio`,
        Icon: FileText,
        label: "CV",
      }),
      ...whenVisible("emails", {
        href: `${APP_PATH}/emails`,
        Icon: Mail,
        label: "Emails",
      }),
      ...whenVisible("templates", {
        href: `${APP_PATH}/templates`,
        Icon: LayoutTemplate,
        label: "Templates",
      }),
    ],
  },
  {
    title: "Activité",
    links: [
      ...whenVisible("generalAssistant", {
        href: `${APP_PATH}/ai`,
        Icon: Bot,
        label: "Copilote IA",
      }),
      ...whenVisible("freelanceAdmin", {
        href: `${APP_PATH}/gestion`,
        Icon: Receipt,
        label: "Gestion",
      }),
      ...whenVisible("programmes", {
        href: `${APP_PATH}/programmes`,
        Icon: Sparkles,
        label: "Croissance",
      }),
    ],
  },
];
