import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  AlertCircle,
  Bell,
  CreditCard,
  LayoutDashboard,
  Palette,
  Sparkles,
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
        href: "/account/appearance",
        Icon: Palette,
        label: "Apparence",
      },
      {
        href: "/account/notifications",
        Icon: Bell,
        label: "Notifications",
      },
    ],
  },
  {
    title: "Abonnement",
    links: [
      {
        href: "/account/billing",
        Icon: CreditCard,
        label: "Facturation",
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
      {
        href: "/freelance",
        Icon: Sparkles,
        label: "Facturation freelance",
      },
      {
        href: "/account/danger",
        Icon: AlertCircle,
        label: "Zone dangereuse",
      },
    ],
  },
];
