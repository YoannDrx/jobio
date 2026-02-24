import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { OnboardingTour } from "@/features/onboarding/components/onboarding-tour";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { Layout } from "@/features/page/layout";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import type { PropsWithChildren } from "react";
import { AppBreadcrumb } from "./app-breadcrumb";
import { AppContentWrapper } from "./app-content-wrapper";
import { AppSidebar } from "./app-sidebar";

export async function AppNavigation({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AppSidebar />
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
              <AppBreadcrumb />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </Layout>
          <OnboardingTour />
        </header>
        <AppContentWrapper>{children}</AppContentWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
