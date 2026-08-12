# 04 - Mapping Intentions -> Pages + Backlog Contenu

Date: 2026-02-22  
Owner: Growth + Product Marketing

## 1) Principes de mapping

- Une intention principale par page (éviter la cannibalisation).
- Le contenu doit refléter strictement les features réellement implémentées.
- Chaque page cible doit pointer vers un CTA mesurable (`/auth/signup` ou `/#pricing`).

## 2) Intentions cibles (FR, freelance tech)

| Cluster                 | Intention principale              | Page cible                                | Statut      |
| ----------------------- | --------------------------------- | ----------------------------------------- | ----------- |
| CRM freelance           | "crm freelance tech"              | `/features`                               | Active      |
| Prospection freelance   | "organiser prospection freelance" | `/docs` + landing `/`                     | Active      |
| CV ATS freelance        | "cv freelance ats"                | `/features` + `/blog`                     | À renforcer |
| Facturation freelance   | "outil facturation freelance"     | landing `/` (suite billing) + futur guide | À renforcer |
| Relances & séquences    | "relance client freelance"        | `/features`                               | Active      |
| Performance commerciale | "analyser conversion prospection" | `/blog` + `/docs`                         | À renforcer |

## 3) Gaps actuels

- Pas encore de pages guides longues dédiées:
  - guide prospection freelance
  - guide LinkedIn freelance
  - guide TJM/négociation
  - guide facturation freelance
- Couverture sémantique partielle sur les use-cases "freelance admin/billing".
- Maillage inter-pages encore insuffisant entre blog -> docs -> pricing.

## 4) Backlog éditorial 8 semaines (priorisé)

## Sprint S1-S2

1. ✅ Publier article: `Comment structurer sa prospection freelance en 2026` (`/blog/structurer-prospection-freelance-2026`).
2. ✅ Publier article: `CRM freelance: critères de choix et stack minimale` (`/blog/crm-freelance-criteres-stack-minimale`).
3. ✅ Optimiser `/features` avec section FAQ ciblée intention (`/features`).

## Sprint S3-S4

1. ✅ Publier guide long: `Guide complet du CV freelance compatible ATS` (`/blog/guide-cv-freelance-compatible-ats`).
2. ✅ Publier article: `Relances freelance: cadence, templates et erreurs` (`/blog/relances-freelance-cadence-templates-erreurs`).
3. ✅ Ajouter liens contextuels blog -> `/features` + `/#pricing` (dans les contenus S3-S4).

## Sprint S5-S6

1. ✅ Publier guide long: `Fixer son TJM et négocier sans se brader` (`/blog/comment-fixer-son-tjm`).
2. ✅ Publier article: `Tableau de bord freelance: KPI à suivre chaque semaine` (`/blog/tableau-de-bord-freelance-kpi-hebdomadaires`).
3. ✅ Ajouter section "ressources liées" en bas de `/docs` (livré via module `RelatedResourcesSection`).

## Sprint S7-S8

1. ✅ Publier guide long: `Facturation freelance: devis, factures, conformité` (`/blog/facturation-freelance-devis-factures-conformite`).
2. ✅ Publier article: `Pipeline freelance: du lead au contrat signé` (`/blog/pipeline-freelance-lead-contrat-signe`).
3. ✅ Mettre à jour 4 meilleurs contenus (refresh title, intro, CTA, maillage).

## 5) Structure type d’une page SEO Jobio

1. Intro claire (problème + promesse).
2. Framework actionnable (étapes concrètes).
3. Cas réel freelance (avant/après).
4. Section outillage Jobio (sans surpromesse).
5. FAQ orientée objections.
6. CTA vers signup + pricing.

## 6) Règles anti-dérive

- Ne jamais annoncer "illimité" si limite technique existe.
- Ne pas mentionner de feature non disponible en production.
- Revalider pricing copy avec `auth-plans.ts` et Stripe avant publication.

## 7) Mesure par contenu

- KPI article:
  - impressions
  - clics
  - CTR
  - conversions signup assistées
- Fenêtre d’évaluation:
  - J+14 (validation indexation)
  - J+30 (premier arbitrage)
  - J+60 (refresh ou consolidation)
