"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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
import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import {
  ChevronDown,
  FileClock,
  Plus,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { FreelanceCommand } from "./freelance-command";
import { getFreelanceNavigation } from "./freelance-navigation.links";

export function FreelanceSidebar() {
  const links: NavigationGroup[] = getFreelanceNavigation();

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex flex-col gap-2">
        <div
          className="flex items-center gap-2 px-2 py-1.5"
          data-tour="freelance-welcome"
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold">Freelance Studio</span>
        </div>
        <div className="px-2">
          <FreelanceCommand />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {links.map((link) => (
          <ItemCollapsing
            key={link.title}
            defaultOpenStartPath={link.defaultOpenStartPath}
          >
            <SidebarGroup>
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
        <div className="space-y-2 rounded-lg border p-2">
          <p className="text-muted-foreground px-1 text-xs font-medium">
            Actions rapides
          </p>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full justify-start"
          >
            <Link href="/job/gestion/invoices?create=1">
              <Receipt className="size-4" />
              Faire une facture
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full justify-start"
          >
            <Link href="/job/gestion/quotes?create=1">
              <FileClock className="size-4" />
              Faire un devis
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full justify-start"
          >
            <Link href="/job/gestion/clients?create=1">
              <Users className="size-4" />
              Ajouter un client
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full justify-start"
          >
            <Link href="/job/gestion/invoices?create=1">
              <Plus className="size-4" />
              Nouveau document
            </Link>
          </Button>
        </div>
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

const ItemCollapsing = (
  props: PropsWithChildren<{ defaultOpenStartPath?: string }>,
) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      defaultOpen={true}
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      {props.children}
    </Collapsible>
  );
};
