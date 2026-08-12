import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";

export const metadata = buildMarketingMetadata({
  title: `Mentions légales | ${SiteConfig.title}`,
  description:
    "Identité de l’éditeur, hébergement et contact du service Jobio.",
  path: "/legal/notice",
});

const legal = {
  businessName: process.env.LEGAL_BUSINESS_NAME ?? "Yodev",
  legalForm: process.env.LEGAL_FORM ?? "Entreprise individuelle",
  siret: process.env.LEGAL_SIRET ?? "À renseigner avant activation publique",
  address:
    process.env.LEGAL_ADDRESS ?? "À renseigner avant activation publique",
};

export default function LegalNoticePage() {
  return (
    <PublicPageShell
      badge="Mentions légales"
      title="L’éditeur et l’hébergeur de Jobio."
      description="Les informations légales applicables au service jobio.fr."
      lastUpdated="10 août 2026"
      highlights={["Éditeur français", "Contact direct", "Droit français"]}
    >
      <PublicSection
        title="Éditeur"
        description="Responsable de la publication."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Nom commercial</dt>
            <dd className="text-muted-foreground">{legal.businessName}</dd>
          </div>
          <div>
            <dt className="font-medium">Forme</dt>
            <dd className="text-muted-foreground">{legal.legalForm}</dd>
          </div>
          <div>
            <dt className="font-medium">SIRET</dt>
            <dd className="text-muted-foreground">{legal.siret}</dd>
          </div>
          <div>
            <dt className="font-medium">Adresse</dt>
            <dd className="text-muted-foreground">{legal.address}</dd>
          </div>
          <div>
            <dt className="font-medium">Contact</dt>
            <dd className="text-muted-foreground">{SiteConfig.supportEmail}</dd>
          </div>
          <div>
            <dt className="font-medium">Directeur de publication</dt>
            <dd className="text-muted-foreground">
              Le représentant légal de {legal.businessName}
            </dd>
          </div>
        </dl>
      </PublicSection>
      <PublicSection
        title="Hébergement"
        description="Infrastructure applicative."
      >
        <p className="text-muted-foreground leading-relaxed">
          Le service web est hébergé par Vercel Inc., 440 N Barranca Ave #4133,
          Covina, CA 91723, États-Unis. Les zones effectives de traitement et
          les sous-traitants sont détaillés dans la politique de
          confidentialité.
        </p>
      </PublicSection>
      <PublicSection
        title="Propriété intellectuelle"
        description="Protection du service."
      >
        <p className="text-muted-foreground leading-relaxed">
          Les marques, interfaces, textes et éléments logiciels de Jobio sont
          protégés. Toute reproduction substantielle sans autorisation est
          interdite.
        </p>
      </PublicSection>
    </PublicPageShell>
  );
}
