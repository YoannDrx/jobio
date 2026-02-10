import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  AlertCircle,
  CreditCard,
  LayoutDashboard,
  Mail,
  User2,
} from "lucide-react";

export const getAccountNavigation = (): NavigationGroup[] => {
  return ACCOUNT_LINKS;
};

const ACCOUNT_LINKS: NavigationGroup[] = [
  {
    title: "Ton profil",
    links: [
      {
        href: "/account",
        Icon: User2,
        label: "Profil",
      },
      {
        href: "/account/email",
        Icon: Mail,
        label: "Email",
      },
      {
        href: "/account/billing",
        Icon: CreditCard,
        label: "Facturation",
      },
      {
        href: "/account/danger",
        Icon: AlertCircle,
        label: "Zone dangereuse",
      },
    ],
  },
  {
    title: "Application",
    links: [
      {
        href: "/app",
        Icon: LayoutDashboard,
        label: "Tableau de bord",
      },
    ],
  },
];
