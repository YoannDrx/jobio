# 01 - Chantier SEO Jobio (Plan directeur)

Date de démarrage: 2026-02-22  
Owner: Produit / Growth / Engineering

## 1) Objectifs business SEO

- Augmenter l'acquisition organique qualifiée (freelances tech FR).
- Aligner ce que Google indexe avec les vraies pages de valeur (marketing, blog, docs).
- Renforcer la conversion SEO -> signup -> activation.

## 2) Périmètre du chantier

- SEO technique: indexation, crawl budget, sitemap, robots, metadata, données structurées.
- SEO contenu: clusters éditoriaux orientés intention (prospection, TJM, LinkedIn, CV, facturation freelance).
- SEO produit: alignement des pages marketing avec les features réellement implémentées.
- SEO mesure: instrumentation Search Console + KPI opérationnels.

## 3) Baseline actuelle (Semaine 0)

### Livré immédiatement dans ce chantier

- `noindex` harmonisé sur zones privées:
  - `app/auth/layout.tsx`
  - `app/job/layout.tsx`
  - `app/freelance/layout.tsx`
  - `app/admin/layout.tsx`
  - `app/(logged-in)/(account-layout)/layout.tsx`
- Metadata globales renforcées: canonical, OG/Twitter enrichi, robots par défaut.
- `robots.txt` simplifié pour bloquer les espaces privés (`/auth`, `/job`, `/freelance`, `/admin`, `/api`, `/app`).
- `sitemap.xml` enrichi avec `/rss.xml` + `lastModified` stable par build.
- Nouveau flux RSS: `app/rss.xml/route.ts`.
- Données structurées:
  - `FAQPage` sur la landing (`app/page.tsx`)
  - `BlogPosting` + `BreadcrumbList` sur les articles (`app/(layout)/blog/[slug]/page.tsx`)
- Canonical/OG ajoutés aux pages légales via `buildMarketingMetadata`.

## 4) KPI et cibles (90 jours)

- Sessions organiques non-brand: +40%.
- Clics Search Console sur requêtes "freelance prospection / crm freelance / tjm freelance": +50%.
- CTR moyen pages blog: +2 points.
- Taux de conversion SEO -> signup: +30%.
- Pages valides indexées (Search Console): 100% des pages publiques stratégiques, 0% des routes privées.

## 5) Backlog priorisé

## Phase A - Technique (Semaine 1-2)

1. Connecter Google Search Console et Bing Webmaster.
2. Soumettre sitemap (`/sitemap.xml`) et flux RSS (`/rss.xml`).
3. Configurer monitoring hebdomadaire:
   - pages exclues
   - erreurs d'exploration
   - couverture indexation
4. Ajouter tests d'intégrité SEO:
   - metadata canonical sur pages publiques critiques
   - présence JSON-LD sur landing/blog
5. Vérifier Core Web Vitals sur landing/blog (LCP, INP, CLS) et corriger les points rouges.

## Phase B - Architecture & Intent (Semaine 2-4)

1. Construire mapping intention -> page:
   - "crm freelance tech"
   - "organiser prospection freelance"
   - "fixer son tjm"
   - "cv freelance ats"
   - "facturation freelance"
2. Définir pages piliers:
   - `/features` (hub produit)
   - `/docs` (hub usage)
   - `/blog` (hub contenus experts)
3. Poser maillage interne systématique entre landing, features, docs, blog et pricing.

## Phase C - Contenu (Semaine 3-8)

1. Publier 2 articles SEO/semaine (minimum 1200 mots utiles, orientés cas réel).
2. Créer 4 pages guides longues:
   - guide prospection freelance
   - guide LinkedIn freelance
   - guide TJM et négociation
   - guide facturation freelance
3. Ajouter CTA de conversion mesurable sur chaque contenu (signup, demo, pricing).
4. Mettre à jour les contenus existants tous les 30-45 jours.

## Phase D - Conversion SEO (Semaine 4-10)

1. Créer variantes de landing par use-case:
   - développeur freelance
   - data/AI freelance
   - product/no-code freelance
2. Tester 3 variantes de hero + CTA + preuve sociale.
3. Ajouter social proof vérifiable (chiffres usage, témoignages, cas clients).

## Phase E - Autorité (Semaine 6-12)

1. Backlinks ciblés:
   - médias freelancing FR
   - communautés dev/produit
   - partenaires outils freelance
2. Distribution continue:
   - LinkedIn fondateur/produit
   - newsletters partenaires
   - republication partielle d'articles.

## 6) Gouvernance (rituel hebdo)

- Lundi: revue Search Console (requêtes, pages, CTR).
- Mercredi: publication contenu + mise à jour maillage interne.
- Vendredi: revue conversion SEO -> signup -> activation.
- Fin de mois: arbitrage backlog selon impact mesuré.

## 7) Risks à surveiller

- Cannibalisation entre pages blog trop proches.
- Dérive "marketing claims" non alignés avec implémentation.
- Indexation accidentelle de routes privées.
- Régressions perf sur landing (images/animations/libraries).

## 8) Définition de done SEO (niveau produit)

- Toute page publique importante a:
  - title/description/canonical cohérents
  - OG/Twitter valides
  - données structurées quand pertinent
  - maillage interne utile
  - CTA clair vers signup/pricing
- Toute page privée ou auth est `noindex`.
- Search Console ne remonte aucune anomalie critique pendant 2 cycles hebdo.
