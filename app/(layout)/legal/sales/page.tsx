import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";

export const metadata = buildMarketingMetadata({
  title: `Conditions générales de vente B2B | ${SiteConfig.title}`,
  description:
    "Prix, paiement, renouvellement et résiliation des offres Jobio.",
  path: "/legal/sales",
});

export default function SalesTermsPage() {
  const vatNotice =
    process.env.LEGAL_VAT_NOTICE ??
    "Le traitement de TVA doit être confirmé avant l’activation des paiements live.";

  return (
    <PublicPageShell
      badge="CGV B2B"
      title="Conditions commerciales de Jobio."
      description="Ces conditions s’adressent exclusivement aux professionnels agissant pour les besoins de leur activité."
      lastUpdated="10 août 2026"
      highlights={[
        "Prix affichés HT",
        "Résiliation en ligne",
        "Droit français",
      ]}
    >
      <PublicSection
        title="1. Offres et prix"
        description="Catalogue public version 1."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <p className="rounded-xl border p-4 text-sm">
            <strong>Jobio Pro :</strong> 19 € HT par mois ou 190 € HT par an.
            L’abonnement est reconduit pour une durée identique jusqu’à
            résiliation.
          </p>
          <p className="rounded-xl border p-4 text-sm">
            <strong>Programmes LinkedIn :</strong> 39 € HT chacun, paiement
            unique et accès à vie tant que le service correspondant est
            exploité.
          </p>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">{vatNotice}</p>
      </PublicSection>
      <PublicSection
        title="2. Essai et paiement"
        description="Un essai applicatif, sans abonnement Stripe."
      >
        <p className="text-muted-foreground leading-relaxed">
          Le premier compte éligible bénéficie de 14 jours Pro sans carte. À
          l’issue, il revient en Free sans suppression de données. Tout achat
          Pro démarre immédiatement la facturation via Stripe. Les taxes
          applicables et le total TTC sont confirmés avant validation du
          paiement.
        </p>
      </PublicSection>
      <PublicSection
        title="3. Résiliation et accès"
        description="Gestion depuis le portail de facturation."
      >
        <p className="text-muted-foreground leading-relaxed">
          L’abonnement peut être résilié à tout moment avec effet à la fin de la
          période payée. Le compte repasse ensuite en Free : les données au-delà
          des quotas restent consultables, mais les nouvelles créations sont
          bloquées.
        </p>
      </PublicSection>
      <PublicSection
        title="4. Rétractation et remboursements"
        description="Contrats conclus entre professionnels."
      >
        <p className="text-muted-foreground leading-relaxed">
          Aucun droit général de rétractation consommateur ne s’applique à un
          achat strictement professionnel, sous réserve des dispositions légales
          impératives. Toute demande justifiée peut être adressée à
          {` ${SiteConfig.supportEmail}.`}
        </p>
      </PublicSection>
      <PublicSection
        title="5. Responsabilité et litiges"
        description="Cadre applicable."
      >
        <p className="text-muted-foreground leading-relaxed">
          Jobio est une obligation de moyens et ne garantit ni mission, ni
          revenu, ni résultat commercial. Les parties cherchent d’abord une
          solution amiable. À défaut, le droit français et les juridictions
          compétentes s’appliquent.
        </p>
      </PublicSection>
    </PublicPageShell>
  );
}
