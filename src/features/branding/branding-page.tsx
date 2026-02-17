"use client";

import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
} from "@/features/page/layout";
import { Typography } from "@/components/nowts/typography";
import { LogoShowcase } from "./logo-showcase";
import { DesignSystemSection } from "./design-system-section";

export const BrandingPage = () => {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Brand Identity — Jobio</LayoutTitle>
        <LayoutDescription>
          Explore les propositions de logos et de design systems pour trouver
          l'identité visuelle parfaite.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent className="flex flex-col gap-12">
        <section className="flex flex-col gap-4">
          <Typography variant="h3">Icône + Lettering</Typography>
          <Typography variant="muted">
            10 icônes graphiques (style App Store) + le mot "jobio" en lettering
            classique. Chaque icône évoque un aspect du métier freelance.
          </Typography>
          <LogoShowcase section="icon" />
        </section>

        <div className="border-t" />

        <section className="flex flex-col gap-4">
          <Typography variant="h3">JOB + IO — Variantes</Typography>
          <Typography variant="muted">
            12 concepts avec le split JOB (blanc) + IO (cyan) — chacun visible
            en plusieurs tailles, sur fond clair et sombre, et en contexte
            navbar.
          </Typography>
          <LogoShowcase section="jobio" />
        </section>

        <div className="border-t" />

        <section className="flex flex-col gap-4">
          <Typography variant="h3">Logos originaux</Typography>
          <Typography variant="muted">
            8 concepts alternatifs avec le J comme élément central.
          </Typography>
          <LogoShowcase section="original" />
        </section>

        <div className="border-t" />

        <section className="flex flex-col gap-4">
          <Typography variant="h3">Design Systems</Typography>
          <Typography variant="muted">
            4 directions visuelles avec palette, typographie, cards et boutons
            rendus en live.
          </Typography>
          <DesignSystemSection />
        </section>
      </LayoutContent>
    </Layout>
  );
};
