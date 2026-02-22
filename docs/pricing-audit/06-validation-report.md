# 06 - Validation Report

Date: 2026-02-22

## 1) Checks techniques

- [x] `pnpm ts` (OK)
- [x] `pnpm lint` (OK)
- [x] `pnpm test:ci __tests__/pricing-matrix.test.ts __tests__/plan-copy.test.ts __tests__/next-prerender-interrupted.test.ts` (OK)
- [x] `pnpm build` (OK)

Remarque build:
- Le bruit `Unknown Error / NEXT_PRERENDER_INTERRUPTED` a ete retire via un filtre cible:
  - `src/lib/errors/next-prerender-interrupted.ts`
  - `src/lib/zod-route.ts`
  - `src/lib/actions/safe-actions.ts`
- Le build final affiche uniquement le tableau des routes (plus de spam d'erreurs attendues Next.js).

## 2) Checks produit

- [x] Cards pricing coherentes avec `auth-plans.ts`
- [x] Billing page coherente (usage + limites + pourcentage robuste)
- [x] Limite analytics affichee sans faux compteur d'usage
- [x] CTA Free fonctionnel (pas de checkout Stripe sans priceId)
- [x] Upgrade links fonctionnels (`/account/billing`)
- [x] CV template gating (UI + serveur)
- [x] Duplicate template respecte limite plan (`messageTemplates`)
- [x] Discount annuel cohérent (calcul dynamique depuis `AUTH_PLANS`)
- [x] Sidebar usage plan alignée sur les limites (inclut `cvDocuments`, `sequences`, `messageTemplates`)
- [x] Copy marketing anti-derive sur pages publiques:
  - `/features` annote explicitement les features plan-gatees (`Pro+` / `Ultra`)
  - `/docs` resume les limites dynamiquement depuis `getPlanLimits`
  - wording support dans pricing clarifie (niveau selon plan)

## 3) Checks Stripe live

- [x] produits Jobio identifies (`prod_TvpdKsfY08PCF0`, `prod_TvpdRzPqeJQGfX`)
- [x] prix actifs alignes code
- [x] descriptions alignees avec limites reelles

Snapshot Stripe verifie (live):
- Jobio Pro mensuel actif: `price_1SxxydH4VwBfiTEI0f4jurPk` (999)
- Jobio Pro annuel actif: `price_1T2zxnH4VwBfiTEIZu2BPZ1J` (9900)
- Jobio Pro annuel legacy inactif: `price_1SxxygH4VwBfiTEI9a7e8RrQ` (9590)
- Jobio Ultra mensuel actif: `price_1SxxyhH4VwBfiTEIUllwpt4V` (1999)
- Jobio Ultra annuel actif: `price_1T2zxuH4VwBfiTEI7fC4lHOg` (19900)
- Jobio Ultra annuel legacy inactif: `price_1SxxyjH4VwBfiTEIq4YIk4e3` (19190)

Descriptions produits live:
- Jobio Pro: "missions illimitees, 200 contacts, 50 requetes IA/mois, relances automatiques, ATS scoring, export CSV, facturation freelance, support email prioritaire"
- Jobio Ultra: "limites maximales (prospection + facturation), 999 requetes IA/mois, CV Coach IA, ATS scoring, sequences illimitees, export CSV, support chat prioritaire"

## 4) Résultat

Etat final: valide.

Le scope livre couvre:
- alignement pricing UI/billing/code/Stripe
- durcissement du gating sur features critiques
- correction de regressions UX de pricing
- garde-fous anti-derive copy sur pages publiques
- reduction du bruit de logs build pour mieux detecter les vraies anomalies
- documentation d'audit et matrice cible dans `docs/pricing-audit/`

## 5) Prochain gros chantier recommandé

- Voir `docs/pricing-audit/08-entitlements-v2-roadmap.md`
- Axe stratégique: passer à une architecture "Entitlements V2" pilotée par données + instrumentation conversion/upsell.
