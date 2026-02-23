"use client";

import { Button } from "@/components/ui/button";
import { LogoSvg } from "@/components/svg/logo-svg";
import { SiteConfig } from "@/site-config";
import Link from "next/link";

type FooterProps = {
  alignWithLandingHeader?: boolean;
};

export function Footer({ alignWithLandingHeader = true }: FooterProps) {
  const containerClassName = alignWithLandingHeader
    ? "mx-auto my-14 w-full max-w-7xl px-4 lg:px-8"
    : "my-14 w-full px-1.5 sm:px-2.5 lg:px-3.5";

  return (
    <footer className="bg-background border-t pb-8">
      <div className={containerClassName}>
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-3">
              <Link href="/" className="flex items-center gap-2">
                <LogoSvg size={32} />
                <h3 className="text-lg font-semibold tracking-tight">
                  {SiteConfig.title}
                </h3>
              </Link>
              <p className="text-muted-foreground max-w-xs text-sm">
                {SiteConfig.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <h4 className="font-medium">Produit</h4>
                <nav className="flex flex-col gap-2">
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/features">Fonctionnalites</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/use-cases">Use cases</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/#pricing">Tarifs</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/app">Dashboard</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/docs">Docs</Link>
                  </Button>
                </nav>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-medium">Ressources</h4>
                <nav className="flex flex-col gap-2">
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/blog">Blog</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/about">About</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/contact">Contact</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/legal/terms">CGU</Link>
                  </Button>
                  <Button asChild variant="link" className="h-auto justify-start p-0">
                    <Link href="/legal/privacy">Confidentialité</Link>
                  </Button>
                </nav>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">
                {SiteConfig.company.address}
              </p>
              <p className="text-muted-foreground text-sm">
                © 2026 {SiteConfig.company.name}. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
