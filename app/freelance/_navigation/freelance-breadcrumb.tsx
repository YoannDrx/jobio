"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

const BASE_PATH = "/job/gestion";

const LABEL_OVERRIDES: Record<string, string> = {
  expenses: "Dépenses",
  "expense-notes": "Notes de frais",
  trips: "Trajets",
  invoices: "Factures",
  quotes: "Devis",
  clients: "Clients",
  "credit-notes": "Avoirs",
};

const formatLabel = (value: string) => {
  return LABEL_OVERRIDES[value] ?? value.replaceAll("-", " ");
};

export function FreelanceBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList className="border-border bg-background rounded-lg border px-3 py-2 shadow-sm shadow-black/5">
        <BreadcrumbItem>
          <BreadcrumbLink href={BASE_PATH}>
            <Home size={16} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">Freelance</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {paths.slice(1).map((path, index) => {
          const isLast = index === paths.slice(1).length - 1;
          const currentPath = `/${paths.slice(0, index + 2).join("/")}`;
          const displayName = formatLabel(path);

          return (
            <Fragment key={`${path}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="capitalize">
                    {displayName}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={currentPath} className="capitalize">
                    {displayName}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
