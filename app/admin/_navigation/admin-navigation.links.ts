import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  AlertTriangle,
  ClipboardList,
  Home,
  MessageSquare,
  Settings2,
  Users,
} from "lucide-react";

const ADMIN_PATH = `/admin`;

const ADMIN_LINKS: NavigationGroup[] = [
  {
    title: "Admin",
    links: [
      {
        href: ADMIN_PATH,
        Icon: Home,
        label: "Cockpit",
      },
      {
        href: `${ADMIN_PATH}/users`,
        Icon: Users,
        label: "Utilisateurs",
      },
      {
        href: `${ADMIN_PATH}/audit`,
        Icon: ClipboardList,
        label: "Audit",
      },
      {
        href: `${ADMIN_PATH}/errors`,
        Icon: AlertTriangle,
        label: "Erreurs",
      },
      {
        href: `${ADMIN_PATH}/ops`,
        Icon: Settings2,
        label: "Ops",
      },
      {
        href: `${ADMIN_PATH}/feedback`,
        Icon: MessageSquare,
        label: "Feedbacks",
      },
    ],
  },
] satisfies NavigationGroup[];

export const getAdminNavigation = (): NavigationGroup[] => {
  return ADMIN_LINKS;
};
