import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";

export const metadata = buildMarketingMetadata({
  title: `Politique cookies | ${SiteConfig.title}`,
  description:
    "Choix et fonctionnement des outils de mesure d’audience de Jobio.",
  path: "/legal/cookies",
});

export default function CookiesPage() {
  return (
    <PublicPageShell
      badge="Cookies"
      title="Tu gardes le contrôle sur la mesure d’audience."
      description="Jobio ne charge aucun outil analytics avant ton accord explicite."
      lastUpdated="7 août 2026"
      highlights={[
        "Consentement préalable",
        "Refus sans impact",
        "Choix réversible",
      ]}
    >
      <PublicSection
        title="Mesure d’audience"
        description="PostHog est optionnel."
      >
        <p className="text-muted-foreground leading-relaxed">
          Lorsque tu acceptes, Jobio utilise PostHog pour mesurer des événements
          produit et des pages vues. Le choix est conservé dans ton navigateur.
          Le refus n’empêche aucune fonctionnalité essentielle de fonctionner.
        </p>
      </PublicSection>
      <PublicSection
        title="Modifier ton choix"
        description="Contrôle depuis le navigateur."
      >
        <p className="text-muted-foreground leading-relaxed">
          Ton choix est modifiable à tout moment dans Paramètres → Apparence →
          Mesure d’audience. Un refus réinitialise l’identifiant analytics local
          et désactive immédiatement les nouvelles collectes.
        </p>
      </PublicSection>
    </PublicPageShell>
  );
}
