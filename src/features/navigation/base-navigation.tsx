import { Typography } from "@/components/nowts/typography";
import { LogoSvg } from "@/components/svg/logo-svg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarMenuButtonLink } from "@/components/ui/sidebar-utils";
import { Layout } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import { Home, User } from "lucide-react";
import type { PropsWithChildren } from "react";
import { SidebarUserButton } from "../sidebar/sidebar-user-button";

export function BaseNavigation({ children }: PropsWithChildren) {
  return (
    <SidebarProvider id="app-sidebar">
      <BaseSidebar />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="py-2">
            <SidebarTrigger className="-ml-1" />
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-2 pt-0 pb-4 sm:px-3 lg:px-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const BaseSidebar = () => {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="mb-4 flex flex-row items-center gap-2">
          <LogoSvg size={32} />
          <Typography variant="large">{SiteConfig.title}</Typography>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButtonLink href="/home">
              <Home />
              <span>Home</span>
            </SidebarMenuButtonLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButtonLink href="/account">
              <User />
              <span>Account</span>
            </SidebarMenuButtonLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
