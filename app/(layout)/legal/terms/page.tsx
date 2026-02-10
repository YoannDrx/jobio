import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `
# Conditions Générales d'Utilisation

**Dernière mise à jour** : 10 février 2026

## 1. Objet

Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme ${SiteConfig.title} (ci-après "le Service"), éditée par la société Jobio.

${SiteConfig.title} est un outil SaaS de gestion de prospection commerciale pour freelances tech. Il permet de suivre des missions, gérer des relances, organiser des contacts et analyser ses performances de prospection.

## 2. Inscription et compte utilisateur

Pour utiliser le Service, l'utilisateur doit créer un compte en fournissant :
- Un nom
- Une adresse email valide
- Un mot de passe sécurisé

L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Toute activité effectuée depuis son compte est sous sa responsabilité.

## 3. Description du service

Le Service propose les fonctionnalités suivantes selon le plan souscrit :

- **Suivi de missions** : création, gestion et suivi de missions freelance
- **Relances automatisées** : planification et suivi des relances
- **Gestion de contacts** : carnet d'adresses professionnel
- **Profils freelance** : création de profils avec compétences et TJM
- **Analyse de performance** : statistiques et analytics de prospection
- **Assistance IA** : parsing de missions et suggestions automatiques

## 4. Plans et tarification

Le Service est proposé sous plusieurs plans :
- **Free** : accès limité et gratuit
- **Pro** : accès étendu avec essai gratuit de 14 jours
- **Ultra** : accès illimité

Les prix sont indiqués en euros TTC. Le paiement est géré via Stripe. Les abonnements sont renouvelés automatiquement sauf résiliation.

## 5. Données utilisateur

L'utilisateur conserve la propriété intégrale de ses données (missions, contacts, profils, etc.). Le Service ne revendique aucun droit de propriété sur les contenus créés par l'utilisateur.

L'utilisateur peut à tout moment exporter ou supprimer ses données.

## 6. Propriété intellectuelle

L'ensemble des éléments du Service (code, design, marques, logos) est la propriété exclusive de Jobio. Toute reproduction ou utilisation non autorisée est interdite.

## 7. Responsabilités

### 7.1 Responsabilité de l'éditeur
Le Service est fourni "en l'état". Jobio s'efforce d'assurer la disponibilité et la sécurité du Service mais ne garantit pas une disponibilité ininterrompue.

Jobio ne saurait être tenu responsable :
- Des dommages indirects liés à l'utilisation du Service
- De la perte de données en cas de force majeure
- Du contenu saisi par les utilisateurs

### 7.2 Responsabilité de l'utilisateur
L'utilisateur s'engage à utiliser le Service de manière conforme à la loi et aux présentes CGU. Il s'interdit notamment :
- Toute utilisation frauduleuse ou abusive
- La transmission de contenus illicites
- Toute tentative de contourner les mesures de sécurité

## 8. Résiliation

L'utilisateur peut résilier son compte à tout moment depuis les paramètres de son compte. La résiliation entraîne la suppression définitive de toutes les données après un délai de grâce de 30 jours.

Jobio se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU.

## 9. Modification des CGU

Jobio se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email de toute modification substantielle. L'utilisation continue du Service après modification vaut acceptation des nouvelles CGU.

## 10. Loi applicable et juridiction

Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents seront ceux du ressort du siège social de Jobio.

## 11. Contact

Pour toute question relative aux présentes CGU, contactez-nous à l'adresse indiquée sur la page Contact.
`;

export const metadata: Metadata = {
  title: `${SiteConfig.title} - Conditions Générales d'Utilisation`,
  description:
    "Conditions générales d'utilisation de Jobio, plateforme de gestion de prospection freelance.",
};

export default function page() {
  return (
    <div>
      <div className="bg-card flex w-full items-center justify-center p-8 lg:p-12">
        <Typography variant="h1">
          Conditions Générales d&apos;Utilisation
        </Typography>
      </div>
      <Layout>
        <LayoutContent className="typography m-auto mb-8">
          <MDXRemote source={markdown} />
        </LayoutContent>
      </Layout>
    </div>
  );
}
