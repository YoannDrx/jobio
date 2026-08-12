import { Badge } from "@/components/ui/badge";
import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";

export const metadata = buildMarketingMetadata({
  title: `Politique de confidentialité | ${SiteConfig.title}`,
  description:
    "Politique de confidentialité de Jobio: données collectées, finalités, conservation, sécurité et droits RGPD.",
  path: "/legal/privacy",
});

const dataCategories = [
  {
    title: "Compte utilisateur",
    items: [
      "Nom et email",
      "Méthode d'authentification",
      "Préférences de compte (thème, notifications)",
    ],
  },
  {
    title: "Données métier",
    items: [
      "Missions (statut, TJM, description, score)",
      "Contacts, relances, templates, séquences",
      "Emails envoyés et interactions liées",
    ],
  },
  {
    title: "Données techniques",
    items: [
      "Sessions, adresse IP, user-agent",
      "Logs applicatifs nécessaires à la sécurité",
      "Événements de diagnostic en cas d'erreur",
    ],
  },
];

const retentionRules = [
  {
    scope: "Compte actif",
    duration: "Pendant toute la durée d'utilisation",
    details: "Nécessaire au fonctionnement normal du service.",
  },
  {
    scope: "Suppression de compte",
    duration: "Jusqu'à 30 jours",
    details:
      "Fenêtre de sécurité opérationnelle avant purge définitive des données.",
  },
  {
    scope: "Logs techniques",
    duration: "Maximum 12 mois",
    details: "Conservation limitée pour débogage, stabilité et sécurité.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Politique de confidentialité", path: "/legal/privacy" },
        ]}
      />
      <PublicPageShell
        badge="Confidentialité"
        title="Tes données restent sous ton contrôle."
        description="Cette politique décrit ce que Jobio collecte, pourquoi, combien de temps, et comment exercer tes droits. Version orientée clarté opérationnelle."
        lastUpdated="7 août 2026"
        highlights={[
          "Conforme RGPD",
          "Pas de revente de données",
          "Suppression compte en self-service",
        ]}
      >
        <div className="grid w-full gap-4 lg:grid-cols-3">
          <PublicSection
            title="Champ d'application"
            description="Cette politique couvre l'ensemble du service Jobio."
            className="lg:col-span-2"
          >
            <p className="text-muted-foreground leading-relaxed">
              En utilisant Jobio, tu nous confies des données à caractère
              personnel liées à ton activité de prospection freelance. Nous les
              traitons uniquement pour fournir le service, sécuriser la
              plateforme et améliorer la qualité produit.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">
                Responsable du traitement: Jobio
              </Badge>
              <Badge variant="secondary">
                Base légale: exécution du contrat
              </Badge>
              <Badge variant="secondary">Droit applicable: France / UE</Badge>
            </div>
          </PublicSection>

          <PublicSection title="Contact données" description="Canal direct">
            <p className="text-sm font-medium">{SiteConfig.supportEmail}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Pour une demande d&apos;accès, d&apos;effacement, de portabilité
              ou toute question RGPD.
            </p>
          </PublicSection>
        </div>

        <PublicSection
          title="1. Données collectées"
          description="Uniquement ce qui est utile au fonctionnement du service."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {dataCategories.map((category) => (
              <div key={category.title} className="rounded-xl border p-4">
                <p className="mb-2 font-medium">{category.title}</p>
                <ul className="space-y-1 text-sm">
                  {category.items.map((item) => (
                    <li key={item} className="text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </PublicSection>

        <PublicSection
          title="2. Finalités de traitement"
          description="Pourquoi ces données sont utilisées."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="font-medium">Exécution du service</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Authentification, gestion des missions, relances, templates,
                notifications et analytics utilisateur.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">Fonctionnalités IA</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Parsing de missions et génération d&apos;emails à la demande.
                Les données ne sont pas revendues.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">Fiabilité et sécurité</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Détection d&apos;abus, investigation incidents, observabilité et
                prévention des accès non autorisés.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">Communication service</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Emails transactionnels (connexion, vérification, facturation,
                informations produit essentielles).
              </p>
            </div>
          </div>
        </PublicSection>

        <PublicSection
          title="3. Sous-traitants principaux"
          description="Prestataires techniques utilisés pour délivrer le service."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium">Service</th>
                  <th className="px-3 py-2 font-medium">Usage</th>
                  <th className="px-3 py-2 font-medium">Zone</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-2">Vercel</td>
                  <td className="text-muted-foreground px-3 py-2">
                    Hébergement de l'application
                  </td>
                  <td className="px-3 py-2">UE / US</td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">PostgreSQL (Neon)</td>
                  <td className="text-muted-foreground px-3 py-2">
                    Stockage des données applicatives
                  </td>
                  <td className="px-3 py-2">UE</td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">Redis</td>
                  <td className="text-muted-foreground px-3 py-2">
                    Limitation d’abus, cache et tâches temporaires
                  </td>
                  <td className="px-3 py-2">Selon la région configurée</td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">Stripe</td>
                  <td className="text-muted-foreground px-3 py-2">
                    Paiements et abonnements
                  </td>
                  <td className="px-3 py-2">US / UE</td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">Resend</td>
                  <td className="text-muted-foreground px-3 py-2">
                    Emails transactionnels
                  </td>
                  <td className="px-3 py-2">US</td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">OpenAI</td>
                  <td className="text-muted-foreground px-3 py-2">
                    Fonctionnalités IA (parsing, génération)
                  </td>
                  <td className="px-3 py-2">US</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">PostHog</td>
                  <td className="text-muted-foreground px-3 py-2">
                    Mesure d’audience uniquement après consentement
                  </td>
                  <td className="px-3 py-2">UE</td>
                </tr>
              </tbody>
            </table>
          </div>
        </PublicSection>

        <PublicSection
          title="4. Durée de conservation"
          description="Politique de conservation et de suppression."
        >
          <div className="space-y-2">
            {retentionRules.map((rule) => (
              <div key={rule.scope} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{rule.scope}</p>
                  <Badge variant="outline">{rule.duration}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {rule.details}
                </p>
              </div>
            ))}
          </div>
        </PublicSection>

        <PublicSection
          title="5. Tes droits RGPD"
          description="Tu peux agir directement depuis ton compte ou via email."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="font-medium">Accès & portabilité</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Obtenir une copie structurée de tes données.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">Rectification</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Corriger ou mettre à jour les informations inexactes.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">Effacement</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Supprimer ton compte et tes données associées.
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="font-medium">Opposition / limitation</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Demander l&apos;arrêt ou la réduction d&apos;un traitement
                donné.
              </p>
            </div>
          </div>
        </PublicSection>

        <PublicSection
          title="6. Sécurité"
          description="Mesures en place pour réduire les risques."
        >
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="rounded-lg border p-3">
              Chiffrement des mots de passe et sessions sécurisées.
            </li>
            <li className="rounded-lg border p-3">
              Connexions HTTPS et protection des endpoints sensibles.
            </li>
            <li className="rounded-lg border p-3">
              Contrôles d&apos;accès côté serveur et séparation des rôles.
            </li>
            <li className="rounded-lg border p-3">
              Journalisation opérationnelle et suivi des incidents.
            </li>
          </ul>
        </PublicSection>
      </PublicPageShell>
    </>
  );
}
