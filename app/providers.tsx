"use client";

import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Suspense, type PropsWithChildren, type ReactElement } from "react";

const ProductProviders = dynamic(async () =>
  import("./product-providers").then((module) => module.ProductProviders),
);

const queryClient = new QueryClient();

function RoutedProviders({ children }: PropsWithChildren): ReactElement {
  const pathname = usePathname();

  return pathname === "/" ? (
    <>{children}</>
  ) : (
    <ProductProviders>{children}</ProductProviders>
  );
}

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={children}>
          <AnalyticsProvider>
            <RoutedProviders>{children}</RoutedProviders>
          </AnalyticsProvider>
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
