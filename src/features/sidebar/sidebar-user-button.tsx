"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/lib/auth-client";
import { ChevronsUpDown } from "lucide-react";
import { UserDropdown } from "../auth/user-dropdown";

export const SidebarUserButton = () => {
  const isHydrated = useHydrated();
  const session = useSession();
  const data = session.data?.user;

  if (!isHydrated || !data) return null;

  return (
    <UserDropdown>
      <SidebarMenuButton
        variant="outline"
        className="h-12"
        data-testid="sidebar-user-button"
      >
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={data.image ?? ""} alt={`Avatar de ${data.name}`} />
          <AvatarFallback className="rounded-lg">
            {data.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{data.name}</span>
          <span className="truncate text-xs">{data.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4" />
      </SidebarMenuButton>
    </UserDropdown>
  );
};
