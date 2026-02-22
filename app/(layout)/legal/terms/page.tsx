import { Badge } from "@/components/ui/badge";
import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import { PublicPageShell, PublicSection } from "@/features/layout/public-page-shell";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";

export const metadata = buildMarketingMetadata({
  title: `Conditions générales d'utilisation | ${SiteConfig.title}`,
  description:
    "CGU de Jobio: cadre contractuel, responsabilités, règles d'usage, facturation et résiliation.",
  path: "/legal/terms",
});

const keyRules = [
  "Utilisation personnelle ou professionnelle conforme à la loi.",
  "Protection de tes identifiants et responsabilité des actions sur ton compte.",
  "Interdiction des usages abusifs, frauduleux ou d'extraction massive non autorisée.",
  "Respect des limites de plan et des quotas techniques.",
];

const includedFeatures = [
  "Pilotage des missions (pipeline, statuts, score)",
  "Gestion de contacts et historiques d'interaction",
  "Relances, séquences et templates",
  "Analytics de performance commerciale",
  "Fonctions IA de parsing et génération",
];

export default function TermsPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Conditions générales d'utilisation", path: "/legal/terms" },
        ]}
      />
      <PublicPageShell
        badge="CGU"
        title="Conditions générales d'utilisation de Jobio."
        description="Ce document encadre l'utilisation de la plateforme Jobio. Objectif: poser un cadre clair, lisible et opérationnel pour l'éditeur et les utilisateurs."
        lastUpdated="11 février 2026"
        highlights={["Droit français", "Abonnements Stripe", "Résiliation à tout moment"]}
      >
      <div className="grid w-full gap-4 lg:grid-cols-3">
        <PublicSection
          title="1. Objet du service"
          description="Jobio est un SaaS d'aide à la prospection pour freelances tech."
          className="lg:col-span-2"
        >
          <p className="text-muted-foreground leading-relaxed">
            Jobio permet de centraliser les missions, planifier les relances,
            structurer la relation avec les contacts et suivre des indicateurs
            de performance. Les fonctionnalités peuvent évoluer pour améliorer
            la qualité du service.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">Éditeur: {SiteConfig.company.name}</Badge>
            <Badge variant="secondary">Produit: {SiteConfig.title}</Badge>
            <Badge variant="secondary">Accès: compte authentifié</Badge>
          </div>
        </PublicSection>

        <PublicSection title="Entrée en vigueur" description="Version en cours">
          <p className="text-sm font-medium">11 février 2026</p>
          <p className="text-muted-foreground mt-2 text-sm">
            L&apos;usage continu du service après modification des CGU vaut
            acceptation de la version en vigueur.
          </p>
        </PublicSection>
      </div>

      <PublicSection
        title="2. Création de compte et accès"
        description="Conditions minimales d'ouverture d'un compte."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="font-medium">Informations requises</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Nom, email valide et méthode d&apos;authentification compatible.
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Sécurité du compte</p>
            <p className="text-muted-foreground mt-1 text-sm">
              L&apos;utilisateur est responsable de la confidentialité de ses accès.
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Rôle administrateur</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Réservé au pilotage interne de la plateforme et à la modération.
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Suspension possible</p>
            <p className="text-muted-foreground mt-1 text-sm">
              En cas de violation manifeste des présentes conditions.
            </p>
          </div>
        </div>
      </PublicSection>

      <PublicSection
        title="3. Fonctionnalités couvertes"
        description="Le service inclut notamment:"
      >
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {includedFeatures.map((item) => (
            <li key={item} className="rounded-lg border p-3">
              {item}
            </li>
          ))}
        </ul>
      </PublicSection>

      <PublicSection
        title="4. Plans, facturation et renouvellement"
        description="Le modèle économique repose sur des plans Free, Pro et Ultra."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="font-medium">Free</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Usage gratuit avec limites de volume.
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Pro</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Capacité étendue + historique analytics augmenté.
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Ultra</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Limites élevées et couverture avancée.
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-xl border p-4 text-sm">
          <p className="font-medium">Règles de paiement</p>
          <p className="text-muted-foreground mt-1">
            Les paiements sont traités via Stripe. Les abonnements sont
            renouvelés automatiquement sauf résiliation effectuée avant la
            prochaine échéance.
          </p>
        </div>
      </PublicSection>

      <PublicSection
        title="5. Obligations d'usage"
        description="Règles de comportement pour préserver le service."
      >
        <ul className="space-y-2 text-sm">
          {keyRules.map((rule) => (
            <li key={rule} className="rounded-lg border p-3">
              {rule}
            </li>
          ))}
        </ul>
      </PublicSection>

      <PublicSection
        title="6. Données et propriété intellectuelle"
        description="Répartition claire des droits."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="font-medium">Données utilisateur</p>
            <p className="text-muted-foreground mt-1 text-sm">
              L&apos;utilisateur reste propriétaire de ses données métier
              (missions, contacts, séquences, contenus saisis).
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Propriété Jobio</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Code source, marque, design, composants produit et documentation
              relèvent de la propriété de Jobio.
            </p>
          </div>
        </div>
      </PublicSection>

      <PublicSection
        title="7. Responsabilité et disponibilité"
        description="Cadre de limitation de responsabilité."
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          Jobio s&apos;efforce d&apos;assurer un service fiable, mais ne garantit pas
          une disponibilité ininterrompue. Le service est fourni &quot;en l&apos;état&quot;.
          Jobio ne peut être tenu responsable des pertes indirectes, ni des
          conséquences liées à une mauvaise utilisation du service par
          l&apos;utilisateur.
        </p>
      </PublicSection>

      <PublicSection
        title="8. Résiliation"
        description="Fermeture compte et fin d'accès."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="font-medium">Par l'utilisateur</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Résiliation possible à tout moment depuis les paramètres du
              compte.
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-medium">Par l'éditeur</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Suspension ou suppression possible en cas de violation des CGU.
            </p>
          </div>
        </div>
      </PublicSection>

      <PublicSection
        title="9. Loi applicable et litiges"
        description="Cadre juridique."
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          Les présentes CGU sont soumises au droit français. En cas de litige,
          les parties rechercheront d&apos;abord une résolution amiable.
          À défaut, compétence est attribuée aux juridictions françaises
          compétentes.
        </p>
      </PublicSection>
      </PublicPageShell>
    </>
  );
}
