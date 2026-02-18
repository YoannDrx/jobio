"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavigationMenu } from "@/components/ui/sidebar-utils";
import { ContactFeedbackPopover } from "@/features/contact/feedback/contact-feedback-popover";
import { PlanUsageSidebar } from "@/features/plans/components/plan-usage-sidebar";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import { Briefcase, ChevronDown } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { AppCommand } from "./app-command";
import { APP_LINKS } from "./app-navigation.links";
import { UpgradeCard } from "./upgrade-app-card";

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex flex-col gap-2">
        <div
          className="flex items-center gap-2 px-2 py-1.5"
          data-tour="welcome"
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Briefcase className="size-4" />
          </div>
          <span className="font-semibold">Job Studio</span>
        </div>
        <div className="px-2">
          <AppCommand />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {APP_LINKS.map((link) => (
          <ItemCollapsing key={link.title}>
            <SidebarGroup key={link.title}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  {link.title}
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarNavigationMenu link={link} />
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </ItemCollapsing>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <PlanUsageSidebar />
        <UpgradeCard />
        <ContactFeedbackPopover />
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

const ItemCollapsing = (props: PropsWithChildren) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      defaultOpen={true}
      onOpenChange={setOpen}
      open={open}
      className="group/collapsible"
    >
      {props.children}
    </Collapsible>
  );
};
