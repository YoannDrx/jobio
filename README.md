# Jobio - Le cockpit commercial des freelances tech

## Description

Jobio est un CRM / cockpit commercial intelligent concu pour les freelances tech. Il centralise l'ensemble du cycle commercial : de la recherche de missions a la signature de contrats, en passant par le suivi des relances et la facturation.

L'objectif est d'offrir aux freelances un outil tout-en-un qui les aide a trouver des missions plus rapidement, relancer au bon moment et signer davantage de contrats. Jobio integre une couche d'intelligence artificielle pour scorer les opportunites, optimiser les CV et generer des messages de candidature personnalises.

Le modele de monetisation repose sur trois plans Stripe : **Free**, **Pro** et **Ultra**, offrant des fonctionnalites progressives selon les besoins du freelance.

## Fonctionnalites

- **Pipeline de missions** : Kanban de suivi des opportunites avec scoring IA et parsing automatique des offres
- **CV Lab** : Editeur de CV avec master CV, variantes par mission, analyse de compatibilite ATS et generation IA
- **Contacts / CRM** : Gestion des contacts professionnels avec score relationnel et historique d'interactions
- **Follow-ups et Sequences** : Systeme de relances automatisees et sequences email configurables
- **Facturation freelance** : Creation de devis et factures, gestion clients, catalogue de prestations
- **Analytics et Dashboard** : KPIs, funnel de conversion, previsions de revenus
- **IA integree** : Chat IA, generation de messages, scoring de missions, coaching CV, strategie quotidienne
- **Notifications push** : Rappels et alertes pour les actions importantes via Web Push (VAPID)
- **Profil public** : Partage de CV via lien unique avec token securise

## Stack technique

| Categorie | Technologie |
|-----------|-------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Langage | TypeScript (mode strict) |
| UI | TailwindCSS v4, Shadcn/UI, Radix UI |
| Base de donnees | PostgreSQL + Prisma ORM |
| Cache | Redis (ioredis) |
| Authentification | Better Auth (email/password, magic links, OAuth GitHub/Google) |
| Paiements | Stripe (abonnements, webhooks) |
| Email | Resend + React Email |
| IA | OpenAI via AI SDK (Vercel) |
| Formulaires | React Hook Form + Zod |
| Etat global | Zustand, nuqs (URL state), TanStack Query |
| Editeur riche | TipTap |
| Graphiques | Recharts |
| Drag & Drop | @hello-pangea/dnd |
| Animations | Motion (Framer Motion) |
| Tests unitaires | Vitest + React Testing Library |
| Tests e2e | Playwright |
| Gestionnaire de paquets | pnpm 10 |

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

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | Oui |
| `DATABASE_URL_UNPOOLED` | URL PostgreSQL sans pooling (migrations) | Non |
| `REDIS_URL` | URL de connexion Redis | Oui |
| `BETTER_AUTH_URL` | URL de base de l'application (ex: `http://localhost:3000`) | Oui |
| `BETTER_AUTH_SECRET` | Secret pour Better Auth | Oui |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth GitHub | Non |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google | Non |
| `RESEND_API_KEY` | Cle API Resend | Oui |
| `EMAIL_FROM` | Adresse email d'expedition | Oui |
| `NEXT_PUBLIC_EMAIL_CONTACT` | Email de contact public | Oui |
| `STRIPE_SECRET_KEY` | Cle secrete Stripe | Oui |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Cle publique Stripe | Oui |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | Non |
| `STRIPE_PRO_PLAN_ID` | ID du plan Pro Stripe (mensuel) | Oui |
| `STRIPE_PRO_YEARLY_PLAN_ID` | ID du plan Pro Stripe (annuel) | Oui |
| `STRIPE_ULTRA_PLAN_ID` | ID du plan Ultra Stripe (mensuel) | Oui |
| `STRIPE_ULTRA_YEARLY_PLAN_ID` | ID du plan Ultra Stripe (annuel) | Oui |
| `OPENAI_API_KEY` | Cle API OpenAI | Oui |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Cles VAPID pour les notifications push | Non |
| `NEXT_PUBLIC_POSTHOG_KEY` | Cle PostHog (analytics) | Non |

## Commandes

### Developpement

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lancer le serveur de developpement (Turbopack) |
| `pnpm build` | Build de production |
| `pnpm start` | Lancer le serveur de production |

### Qualite du code

| Commande | Description |
|----------|-------------|
| `pnpm ts` | Verification des types TypeScript |
| `pnpm lint` | ESLint avec correction automatique |
| `pnpm lint:ci` | ESLint sans correction (CI) |
| `pnpm format` | Formatter le code avec Prettier |
| `pnpm clean` | Lint + type check + format |
| `pnpm knip` | Detection du code inutilise |

### Tests

| Commande | Description |
|----------|-------------|
| `pnpm test` | Tests unitaires (mode watch) |
| `pnpm test:ci` | Tests unitaires (CI, une seule execution) |
| `pnpm test:e2e` | Tests e2e avec interface Playwright |
| `pnpm test:e2e:ci` | Tests e2e en mode headless (CI) |

### Base de donnees

| Commande | Description |
|----------|-------------|
| `pnpm prisma:generate` | Generer le client Prisma |
| `pnpm prisma:migrate` | Appliquer les migrations |
| `pnpm prisma:seed` | Peupler la base avec des donnees de test |
| `pnpm better-auth:migrate` | Generer le schema Prisma pour Better Auth |

### Outils

| Commande | Description |
|----------|-------------|
| `pnpm email` | Serveur de developpement pour les emails |
| `pnpm stripe-webhooks` | Ecouter les webhooks Stripe en local |

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
