# 06 - Validation Report

Date: 2026-02-21

## 1) Checks techniques

- [x] `pnpm ts` (OK)
- [x] `pnpm lint` (OK)
- [x] `pnpm test` (OK)

Resultat tests:
- 24 fichiers de tests passes
- 1 fichier de tests skippe
- 161 tests passes, 4 skippes

Remarque:
- Quelques warnings non bloquants apparaissent pendant les tests (accessibility Radix et query data undefined sur des tests providers), mais aucune erreur et suite verte.

## 2) Checks produit

- [x] Cards pricing coherentes avec `auth-plans.ts`
- [x] Billing page coherente (usage + limites + pourcentage robuste)
- [x] Limite analytics affichee sans faux compteur d'usage
- [x] CTA Free fonctionnel (pas de checkout Stripe sans priceId)
- [x] Upgrade links fonctionnels (`/account/billing`)
- [x] CV template gating (UI + serveur)
- [x] Duplicate template respecte limite plan (`messageTemplates`)
- [x] Discount annuel cohérent (calcul dynamique depuis `AUTH_PLANS`)

## 3) Checks Stripe live

- [x] produits Jobio identifies (`prod_TvpdKsfY08PCF0`, `prod_TvpdRzPqeJQGfX`)
- [x] prix actifs alignes code
- [x] descriptions alignees avec limites reelles

Snapshot Stripe verifie:
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
- documentation d'audit et matrice cible dans `docs/pricing-audit/`
