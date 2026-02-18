import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { Layout } from "@/features/page/layout";
import { FreelanceTour } from "@/features/freelance/onboarding/freelance-tour";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import type { PropsWithChildren } from "react";
import { FreelanceBreadcrumb } from "./freelance-breadcrumb";
import { FreelanceContentWrapper } from "./freelance-content-wrapper";
import { FreelanceSidebar } from "./freelance-sidebar";

export async function FreelanceNavigation({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <FreelanceSidebar />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout
            size="lg"
            className="flex items-center justify-between gap-2 py-2"
          >
            <div className="flex items-center gap-2">
              <SidebarTrigger
                size="lg"
                variant="outline"
                className="size-9 cursor-pointer"
              />
              <FreelanceBreadcrumb />
            </div>
            <div className="flex items-center gap-1">
              <FreelanceTour />
              <ThemeToggle />
              <NotificationBell />
            </div>
          </Layout>
        </header>
        <FreelanceContentWrapper>{children}</FreelanceContentWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
