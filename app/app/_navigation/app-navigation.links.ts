import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  BarChart3,
  BotIcon,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  FileText,
  Globe,
  Kanban,
  ListOrdered,
  Mail,
  Receipt,
  Sparkles,
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
      {
        href: `${APP_PATH}/sequences`,
        Icon: ListOrdered,
        label: "Séquences",
      },
      { href: `${APP_PATH}/emails`, Icon: Mail, label: "Emails" },
    ],
  },
  {
    title: "Outils",
    links: [
      {
        href: `${APP_PATH}/calendar`,
        Icon: CalendarDays,
        label: "Calendrier",
      },
      { href: `${APP_PATH}/profiles`, Icon: UserCircle, label: "Profils" },
      { href: `${APP_PATH}/cv-lab`, Icon: FileText, label: "CV Lab" },
      { href: `${APP_PATH}/cv-lab/coach`, Icon: Sparkles, label: "CV Coach IA" },
      { href: `${APP_PATH}/platforms`, Icon: Globe, label: "Plateformes" },
      { href: `${APP_PATH}/ai`, Icon: BotIcon, label: "Chat IA" },
      { href: `${APP_PATH}/analytics`, Icon: BarChart3, label: "Analytics" },
      { href: "/freelance", Icon: Receipt, label: "Facturation" },
    ],
  },
];
