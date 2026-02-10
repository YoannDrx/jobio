import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  BarChart3,
  CalendarCheck,
  FileText,
  Globe,
  Kanban,
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
    ],
  },
  {
    title: "Outils",
    defaultOpenStartPath: `${APP_PATH}/profiles`,
    links: [
      { href: `${APP_PATH}/profiles`, Icon: UserCircle, label: "Profils" },
      { href: `${APP_PATH}/platforms`, Icon: Globe, label: "Plateformes" },
      { href: `${APP_PATH}/templates`, Icon: FileText, label: "Templates" },
      { href: `${APP_PATH}/analytics`, Icon: BarChart3, label: "Analytics" },
    ],
  },
] satisfies NavigationGroup[];
