import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Globe,
  Kanban,
  ListOrdered,
  Mail,
  UserCircle,
  Users,
} from "lucide-react";

const APP_PATH = "/app";

export const APP_LINKS: NavigationGroup[] = [
  {
    title: "Principal",
    links: [
      { href: APP_PATH, Icon: CalendarCheck, label: "Today" },
      { href: `${APP_PATH}/pipeline`, Icon: Kanban, label: "Pipeline" },
      { href: `${APP_PATH}/contacts`, Icon: Users, label: "Contacts" },
      {
        href: `${APP_PATH}/follow-ups`,
        Icon: CalendarClock,
        label: "Relances",
      },
    ],
  },
  {
    title: "Outils",
    defaultOpenStartPath: `${APP_PATH}/profiles`,
    links: [
      { href: `${APP_PATH}/profiles`, Icon: UserCircle, label: "Profils" },
      { href: `${APP_PATH}/prospection`, Icon: Globe, label: "Prospection" },
      { href: `${APP_PATH}/programmes`, Icon: BookOpen, label: "Programmes" },
      { href: `${APP_PATH}/sequences`, Icon: ListOrdered, label: "Séquences" },
      { href: `${APP_PATH}/emails`, Icon: Mail, label: "Emails" },
      { href: `${APP_PATH}/analytics`, Icon: BarChart3, label: "Analytics" },
    ],
  },
] satisfies NavigationGroup[];
