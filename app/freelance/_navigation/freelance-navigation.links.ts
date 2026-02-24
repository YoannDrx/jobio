import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  BarChart3,
  BookText,
  ClipboardList,
  File,
  FileBadge2,
  FileClock,
  FileText,
  HandCoins,
  LayoutDashboard,
  Receipt,
  Repeat,
  Settings2,
  Users,
} from "lucide-react";

const FREELANCE_PATH = "/freelance";

const FREELANCE_LINKS: NavigationGroup[] = [
  {
    title: "Pilotage",
    defaultOpenStartPath: FREELANCE_PATH,
    links: [
      {
        href: FREELANCE_PATH,
        Icon: LayoutDashboard,
        label: "Dashboard",
        tourId: "freelance-dashboard",
      },
      {
        href: `${FREELANCE_PATH}/insights`,
        Icon: BarChart3,
        label: "URSSAF & activité",
        tourId: "freelance-insights",
      },
      {
        href: `${FREELANCE_PATH}/registers`,
        Icon: FileText,
        label: "Registres",
      },
      {
        href: `${FREELANCE_PATH}/logs`,
        Icon: ClipboardList,
        label: "Logs",
      },
    ],
  },
  {
    title: "Facturation",
    defaultOpenStartPath: `${FREELANCE_PATH}/invoices`,
    links: [
      {
        href: `${FREELANCE_PATH}/invoices`,
        Icon: Receipt,
        label: "Factures",
        tourId: "freelance-invoices",
      },
      {
        href: `${FREELANCE_PATH}/quotes`,
        Icon: FileClock,
        label: "Devis",
        tourId: "freelance-quotes",
      },
      {
        href: `${FREELANCE_PATH}/clients`,
        Icon: Users,
        label: "Clients",
        tourId: "freelance-clients",
      },
      {
        href: `${FREELANCE_PATH}/credit-notes`,
        Icon: FileBadge2,
        label: "Avoirs",
      },
      {
        href: `${FREELANCE_PATH}/payments`,
        Icon: HandCoins,
        label: "Paiements",
        tourId: "freelance-payments",
      },
      {
        href: `${FREELANCE_PATH}/recurring`,
        Icon: Repeat,
        label: "Récurrences",
      },
    ],
  },
  {
    title: "Dépenses",
    defaultOpenStartPath: `${FREELANCE_PATH}/expenses`,
    links: [
      {
        href: `${FREELANCE_PATH}/expenses/invoices`,
        Icon: File,
        label: "Factures",
      },
      {
        href: `${FREELANCE_PATH}/expenses/expense-notes`,
        Icon: FileText,
        label: "Notes de frais",
      },
      {
        href: `${FREELANCE_PATH}/expenses/trips`,
        Icon: FileText,
        label: "Trajets",
      },
    ],
  },
  {
    title: "Configuration",
    defaultOpenStartPath: `${FREELANCE_PATH}/catalog`,
    links: [
      {
        href: `${FREELANCE_PATH}/catalog`,
        Icon: BookText,
        label: "Catalogue",
      },
      {
        href: `${FREELANCE_PATH}/settings`,
        Icon: Settings2,
        label: "Paramètres",
      },
    ],
  },
];

export const getFreelanceNavigation = (): NavigationGroup[] => {
  return FREELANCE_LINKS;
};
