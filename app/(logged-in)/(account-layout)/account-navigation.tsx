import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Layout } from "@/features/page/layout";
import type { PropsWithChildren } from "react";
import { AccountSidebar } from "./account-sidebar";

export async function AccountNavigation({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AccountSidebar />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="py-2">
            <SidebarTrigger className="-ml-1" />
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-1.5 pb-4 pt-0 sm:px-2.5 lg:px-3.5">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
