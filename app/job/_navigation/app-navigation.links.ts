import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  FileText,
  Globe,
  Kanban,
  ListOrdered,
  Mail,
  Receipt,
  UserCircle,
  Users,
} from "lucide-react";

const APP_PATH = "/job";

export const APP_LINKS: NavigationGroup[] = [
  {
    title: "Principal",
    links: [
      {
        href: APP_PATH,
        Icon: CalendarCheck,
        label: "Today",
        tourId: "dashboard",
      },
      {
        href: `${APP_PATH}/pipeline`,
        Icon: Kanban,
        label: "Pipeline",
        tourId: "pipeline-nav",
      },
      {
        href: `${APP_PATH}/contacts`,
        Icon: Users,
        label: "Contacts",
        tourId: "contacts-nav",
      },
      {
        href: `${APP_PATH}/follow-ups`,
        Icon: CalendarClock,
        label: "Relances",
        tourId: "followups-nav",
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
      { href: `${APP_PATH}/cv-studio`, Icon: FileText, label: "CV Studio IA" },
      { href: `${APP_PATH}/platforms`, Icon: Globe, label: "Plateformes" },
      {
        href: `${APP_PATH}/programmes`,
        Icon: BookOpen,
        label: "Programmes",
      },
      { href: `${APP_PATH}/analytics`, Icon: BarChart3, label: "Analytics" },
      { href: "/freelance", Icon: Receipt, label: "Facturation" },
    ],
  },
];
