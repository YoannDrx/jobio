import { LogoSvg } from "@/components/svg/logo-svg";
import { SiteConfig } from "@/site-config";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { ThemeToggle } from "../theme/theme-toggle";

export function HeaderBase({ children }: PropsWithChildren) {
  return (
    <header className="bg-card sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 lg:h-[60px] lg:px-8">
        <div className="flex items-center gap-2">
          <LogoSvg size={32} />
          <Link href="/" className="text-base font-bold">
            {SiteConfig.title}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {children}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
