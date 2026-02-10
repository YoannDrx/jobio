import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { Home, User } from "lucide-react";

const APP_PATH = "/app";

export const APP_LINKS: NavigationGroup[] = [
  {
    title: "Menu",
    links: [
      {
        href: APP_PATH,
        Icon: Home,
        label: "Dashboard",
      },
      {
        href: `${APP_PATH}/users`,
        Icon: User,
        label: "Analytics",
      },
    ],
  },
] satisfies NavigationGroup[];
