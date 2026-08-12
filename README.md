# Jobio - Le cockpit commercial des freelances tech

## Description

Jobio est le système d’exploitation commercial des freelances tech. Il relie la découverte d’une mission à sa qualification, la candidature, les relances, la signature puis au pilotage du revenu.

La suite complète est la destination produit, avec une **GA progressive par module**. Le statut `beta` du manifeste signifie qu’un parcours existe mais que ses preuves staging/live, accessibilité, observabilité et cas limites ne sont pas encore toutes réunies. Un module ne passe en `ga` qu’avec un dossier de preuve lié à l’audit de production.

Le suivi opérationnel de ce qui est livré, vérifié et encore bloquant est tenu
dans le [roadbook produit et production](docs/production-readiness/roadbook.md).

Le modele de validation repose sur **Free** et un seul plan **Pro**. Ultra n'est plus propose aux nouveaux utilisateurs ; aucun abonnement historique n'est modifie sans audit Stripe.

## Fonctionnalites

- **Pipeline de missions** : Kanban de suivi des opportunites avec scoring IA et parsing automatique des offres
- **Radar Missions** : veilles sur des sources autorisées, import d’alertes transférées, déduplication, score explicable et conversion humaine vers le pipeline
- **CV Lab** : Editeur de CV avec master CV, variantes par mission, analyse de compatibilite ATS et generation IA
- **Contacts / CRM** : Gestion des contacts professionnels avec score relationnel et historique d'interactions
- **Relances** : liste, calendrier, snooze et prevention de sur-sollicitation
- **Aujourd'hui** : trois actions prioritaires maximum, avec impact, urgence et contexte
- **Onboarding actionnable** : profil minimal, compétences, première opportunité et première relance, avec reprise au premier jalon incomplet
- **CV Lab** : profil maitre, variante par mission, apercu A4 et export ATS
- **Notifications push** : Rappels et alertes pour les actions importantes via Web Push (VAPID)
- **Profil public** : Partage de CV via lien unique avec token securise
- **Gestion freelance** : passage de la mission au devis, à la facture, au paiement et à la prévision de revenu ; ce module reste soumis aux gates comptables et juridiques documentés

Radar Missions n’effectue aucun scraping LinkedIn, aucune injection dans ses pages et aucune candidature automatique. Les alertes LinkedIn peuvent uniquement être transférées par l’utilisateur vers son adresse Jobio ; toute communication et toute création de mission exigent une validation humaine.

## Stack technique

| Categorie               | Technologie                                                    |
| ----------------------- | -------------------------------------------------------------- |
| Framework               | Next.js 16 (App Router, Turbopack)                             |
| Langage                 | TypeScript (mode strict)                                       |
| UI                      | TailwindCSS v4, Shadcn/UI, Radix UI                            |
| Base de donnees         | PostgreSQL + Prisma ORM                                        |
| Cache                   | Redis (ioredis)                                                |
| Authentification        | Better Auth (email/password, magic links, OAuth GitHub/Google) |
| Paiements               | Stripe (abonnements, webhooks)                                 |
| Email                   | Resend + React Email                                           |
| IA                      | OpenAI via AI SDK (Vercel)                                     |
| Formulaires             | React Hook Form + Zod                                          |
| Etat global             | Zustand, nuqs (URL state), TanStack Query                      |
| Editeur riche           | TipTap                                                         |
| Graphiques              | Recharts                                                       |
| Drag & Drop             | @hello-pangea/dnd                                              |
| Animations              | Motion (Framer Motion)                                         |
| Tests unitaires         | Vitest + React Testing Library                                 |
| Tests e2e               | Playwright                                                     |
| Gestionnaire de paquets | pnpm 10                                                        |

## Prerequis

- **Node.js** 20 ou superieur
- **pnpm** 10 ou superieur
- **PostgreSQL** (local ou heberge, par exemple Neon)
- **Redis** (local, Railway, Redis Cloud ou Upstash)
- **Compte Stripe** pour la gestion des paiements
- **Compte Resend** pour l'envoi d'emails transactionnels
- **Cle API OpenAI** pour les fonctionnalites IA

## Installation

```bash
# 1. Cloner le depot
git clone <url-du-depot>
cd jobio

# 2. Copier le template des variables d'environnement
cp .env-template .env

# 3. Remplir les variables dans le fichier .env (voir section ci-dessous)

# 4. Installer les dependances
pnpm install

# 5. Generer le client Prisma et appliquer les migrations
pnpm prisma:generate
pnpm prisma:migrate

# 6. (Optionnel) Peupler la base de donnees avec des donnees de test
pnpm prisma:seed

# 7. Lancer le serveur de developpement
pnpm dev
```

L'application sera accessible sur `http://localhost:3000`.

## Variables d'environnement

Toutes les variables sont definies dans le fichier `.env-template`. Voici les principales :

| Variable                                                    | Description                                                | Requis                  |
| ----------------------------------------------------------- | ---------------------------------------------------------- | ----------------------- |
| `DATABASE_URL`                                              | URL de connexion PostgreSQL                                | Oui                     |
| `DATABASE_URL_UNPOOLED`                                     | URL PostgreSQL sans pooling (migrations)                   | Non                     |
| `REDIS_URL`                                                 | URL de connexion Redis                                     | Oui                     |
| `BETTER_AUTH_URL`                                           | URL de base de l'application (ex: `http://localhost:3000`) | Oui                     |
| `BETTER_AUTH_SECRET`                                        | Secret pour Better Auth                                    | Oui                     |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`                 | OAuth GitHub                                               | Non                     |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                 | OAuth Google                                               | Non                     |
| `RESEND_API_KEY`                                            | Cle API Resend                                             | Oui                     |
| `RESEND_WEBHOOK_SECRET`                                     | Signature des webhooks Resend, dont `email.received`       | Oui en production       |
| `OPPORTUNITY_INBOUND_DOMAIN`                                | Sous-domaine MX dédié aux alertes transférées              | Pour l’inbound Radar    |
| `EMAIL_FROM`                                                | Adresse email d'expedition                                 | Oui                     |
| `NEXT_PUBLIC_EMAIL_CONTACT`                                 | Email de contact public                                    | Oui                     |
| `STRIPE_SECRET_KEY`                                         | Cle secrete Stripe                                         | Oui                     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                        | Cle publique Stripe                                        | Oui                     |
| `STRIPE_WEBHOOK_SECRET`                                     | Secret webhook Stripe                                      | Non                     |
| `STRIPE_PRO_PLAN_ID`                                        | ID du plan Pro Stripe (mensuel)                            | Oui                     |
| `STRIPE_PRO_YEARLY_PLAN_ID`                                 | ID du plan Pro Stripe (annuel)                             | Oui                     |
| `STRIPE_PROGRAM_ATTIRER_PRICE_ID`                           | ID du programme Attirer des clients                        | Oui                     |
| `STRIPE_PROGRAM_BRANDING_PRICE_ID`                          | ID du programme Personal branding                          | Oui                     |
| `STRIPE_PROGRAM_CROISSANCE_PRICE_ID`                        | ID du programme Croissance                                 | Oui                     |
| `OPENAI_API_KEY`                                            | Cle API OpenAI                                             | Oui                     |
| `FRANCE_TRAVAIL_CLIENT_ID` / `FRANCE_TRAVAIL_CLIENT_SECRET` | OAuth API Offres d’emploi France Travail                   | Pour cette source Radar |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY`                          | Identifiants Adzuna après validation de licence            | Pour cette source Radar |
| `JOOBLE_API_KEY`                                            | Clé Jooble après validation de licence                     | Pour cette source Radar |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`                    | Cles VAPID pour les notifications push                     | Non                     |
| `NEXT_PUBLIC_POSTHOG_KEY`                                   | Cle PostHog (analytics)                                    | Non                     |

## Commandes

### Developpement

| Commande     | Description                                    |
| ------------ | ---------------------------------------------- |
| `pnpm dev`   | Lancer le serveur de developpement (Turbopack) |
| `pnpm build` | Build de production                            |
| `pnpm start` | Lancer le serveur de production                |

### Qualite du code

| Commande       | Description                        |
| -------------- | ---------------------------------- |
| `pnpm ts`      | Verification des types TypeScript  |
| `pnpm lint`    | ESLint avec correction automatique |
| `pnpm lint:ci` | ESLint sans correction (CI)        |
| `pnpm format`  | Formatter le code avec Prettier    |
| `pnpm clean`   | Lint + type check + format         |
| `pnpm knip`    | Detection du code inutilise        |

### Tests

| Commande           | Description                               |
| ------------------ | ----------------------------------------- |
| `pnpm test`        | Tests unitaires (mode watch)              |
| `pnpm test:ci`     | Tests unitaires (CI, une seule execution) |
| `pnpm test:e2e`    | Tests e2e avec interface Playwright       |
| `pnpm test:e2e:ci` | Tests e2e en mode headless (CI)           |

### Base de donnees

| Commande                   | Description                               |
| -------------------------- | ----------------------------------------- |
| `pnpm prisma:generate`     | Generer le client Prisma                  |
| `pnpm prisma:migrate`      | Appliquer les migrations                  |
| `pnpm prisma:seed`         | Peupler la base avec des donnees de test  |
| `pnpm better-auth:migrate` | Generer le schema Prisma pour Better Auth |

### Outils

| Commande               | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm email`           | Serveur de developpement pour les emails |
| `pnpm stripe-webhooks` | Ecouter les webhooks Stripe en local     |

## Architecture

```
jobio/
  app/                    # Pages et layouts Next.js (App Router)
  src/
    components/
      ui/                 # Composants Shadcn/UI
      nowts/              # Composants custom du projet
    features/             # Modules fonctionnels (cv-lab, facturation, pipeline...)
    lib/                  # Utilitaires, configs et services
    hooks/                # Hooks React custom
  emails/                 # Templates email (React Email)
  prisma/
    schema/               # Schemas Prisma (multi-fichiers)
    migrations/           # Migrations de base de donnees
  e2e/                    # Tests end-to-end (Playwright)
  __tests__/              # Tests unitaires (Vitest)
```

### Organisation par features

Chaque module fonctionnel dans `src/features/` regroupe ses composants, hooks, actions serveur et schemas dans un meme dossier. Les actions serveur suivent la convention de nommage `*.action.ts`.

## Tests

### Tests unitaires

Les tests unitaires utilisent **Vitest** avec **React Testing Library**. Ils sont situes dans le dossier `__tests__/`.

```bash
# Mode watch (developpement)
pnpm test

# Execution unique (CI)
pnpm test:ci
```

### Tests end-to-end

Les tests e2e utilisent **Playwright** avec des utilitaires custom dans `e2e/utils/`.

```bash
# Avec interface graphique
pnpm test:e2e

# Mode headless (CI)
pnpm test:e2e:ci
```

## Licence

Projet prive et proprietaire. Tous droits reserves.
