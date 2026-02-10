import { Typography } from "@/components/nowts/typography";
import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";

const markdown = `
# Politique de Confidentialité

**Dernière mise à jour** : 10 février 2026

## 1. Introduction

La présente Politique de Confidentialité décrit comment Jobio (ci-après "nous") collecte, utilise et protège vos données personnelles dans le cadre de l'utilisation de la plateforme ${SiteConfig.title}.

Nous nous engageons à respecter le Règlement Général sur la Protection des Données (RGPD) et la loi Informatique et Libertés.

## 2. Données collectées

### 2.1 Données d'inscription
- Nom et prénom
- Adresse email
- Mot de passe (chiffré)

### 2.2 Données d'utilisation
- Missions freelance (titre, entreprise, TJM, description, statut)
- Contacts professionnels (nom, email, entreprise, rôle)
- Profils freelance (compétences, TJM cible, préférences)
- Relances et interactions
- Historique d'activité sur la plateforme

### 2.3 Données techniques
- Adresse IP
- Type de navigateur
- Données de session et cookies d'authentification

## 3. Utilisation des données

Vos données sont utilisées exclusivement pour :

- **Fonctionnement du Service** : gestion de votre compte, vos missions, contacts et relances
- **Fonctionnalités IA** : analyse de missions et suggestions (les données ne sont pas utilisées pour entraîner des modèles)
- **Analytics** : statistiques de votre prospection (visibles uniquement par vous)
- **Communications** : emails transactionnels (bienvenue, relances, facturation)
- **Amélioration du Service** : analyse agrégée et anonymisée de l'utilisation

Nous ne vendons jamais vos données à des tiers.

## 4. Hébergement et sous-traitants

| Service | Usage | Localisation |
|---------|-------|-------------|
| Vercel | Hébergement de l'application | EU/US |
| Neon / PostgreSQL | Base de données | EU |
| Stripe | Paiements | US (certifié Privacy Shield) |
| Resend | Envoi d'emails transactionnels | US |
| OpenAI | Fonctionnalités IA (parsing de missions) | US |

Tous nos sous-traitants sont conformes au RGPD ou offrent des garanties équivalentes.

## 5. Cookies

Nous utilisons uniquement des cookies essentiels au fonctionnement du Service :

- **Cookie de session** : authentification de l'utilisateur (durée : 20 jours)
- **Cookie de préférence** : thème sombre/clair

Nous n'utilisons pas de cookies publicitaires ni de tracking tiers.

## 6. Durée de conservation

- **Données de compte** : conservées pendant la durée d'utilisation du Service + 30 jours après suppression du compte
- **Données d'utilisation** : conservées pendant la durée d'utilisation du Service
- **Logs techniques** : conservés 12 mois maximum

## 7. Vos droits (RGPD)

Conformément au RGPD, vous disposez des droits suivants :

- **Droit d'accès** : obtenir une copie de vos données personnelles
- **Droit de rectification** : corriger vos données inexactes
- **Droit à l'effacement** : supprimer votre compte et toutes vos données
- **Droit à la portabilité** : recevoir vos données dans un format structuré
- **Droit d'opposition** : vous opposer au traitement de vos données
- **Droit à la limitation** : limiter le traitement de vos données

Pour exercer ces droits, rendez-vous dans les paramètres de votre compte ou contactez-nous via la page Contact.

La suppression du compte est accessible directement dans les paramètres de votre compte et entraîne la suppression irréversible de toutes vos données.

## 8. Sécurité

Nous mettons en œuvre les mesures suivantes pour protéger vos données :

- Chiffrement des mots de passe (bcrypt)
- Communications HTTPS
- Tokens de session signés et chiffrés
- Accès restreint aux bases de données
- Audits réguliers de sécurité

## 9. Modifications

Nous pouvons mettre à jour cette politique de confidentialité. Les modifications significatives seront communiquées par email. La date de dernière mise à jour est indiquée en haut de cette page.

## 10. Contact

Pour toute question relative à la protection de vos données personnelles, contactez notre DPO à l'adresse indiquée sur la page Contact.

Vous pouvez également adresser une réclamation à la CNIL : [www.cnil.fr](https://www.cnil.fr)
`;

export const metadata: Metadata = {
  title: `${SiteConfig.title} - Politique de Confidentialité`,
  description:
    "Politique de confidentialité de Jobio. Découvrez comment nous protégeons vos données personnelles.",
};

export default function page() {
  return (
    <div>
      <div className="bg-card flex w-full items-center justify-center p-8 lg:p-12">
        <Typography variant="h1">Politique de Confidentialité</Typography>
      </div>
      <Layout>
        <LayoutContent className="typography m-auto mb-8">
          <MDXRemote source={markdown} />
        </LayoutContent>
      </Layout>
    </div>
  );
}
