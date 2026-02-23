# 05 - Stripe Runbook (Live)

Date: 2026-02-21
Scope: produits Jobio uniquement

## 1) Pré-check (read-only)

```bash
stripe products list --live --limit 50
stripe prices list --live --product prod_TvpdKsfY08PCF0 --limit 20
stripe prices list --live --product prod_TvpdRzPqeJQGfX --limit 20
```

Attendu:
- Pro annuel actif: `price_1T2zxnH4VwBfiTEIZu2BPZ1J` (9900)
- Ultra annuel actif: `price_1T2zxuH4VwBfiTEI7fC4lHOg` (19900)
- anciens annuels inactifs (9590 / 19190)

## 2) Mise à jour descriptions produits (si wording à ajuster)

Exemple:
```bash
stripe products update prod_TvpdKsfY08PCF0 --live \
  --description "Plan Pro Jobio : missions illimitées, 200 contacts, 50 requêtes IA/mois, relances automatiques, ATS scoring, export CSV, facturation freelance, support email prioritaire"

stripe products update prod_TvpdRzPqeJQGfX --live \
  --description "Plan Ultra Jobio : limites maximales (prospection + facturation), 999 requêtes IA/mois, CV Coach IA, ATS scoring, séquences illimitées, export CSV, support chat prioritaire"
```

## 3) Variables d'env à maintenir synchronisées

- `STRIPE_PRO_PLAN_ID`
- `STRIPE_PRO_YEARLY_PLAN_ID`
- `STRIPE_ULTRA_PLAN_ID`
- `STRIPE_ULTRA_YEARLY_PLAN_ID`

Vérifier dans `.env` après toute mutation Stripe.

## 4) Guardrails

- Ne toucher qu'aux produits `Jobio Pro` et `Jobio Ultra`.
- Ne pas inactiver de prix actifs sans vérifier l'impact abonnements en cours.
- Toujours faire un snapshot read-only avant/après changement.

## 5) Rollback

- Réappliquer description précédente via `stripe products update ... --description "..."`.
- En cas de mauvais price actif: réactiver l'ancien `price` puis remettre les env vars correspondantes.

## 6) Vérification automatique (app/DB/Stripe)

Commande:
```bash
pnpm pricing:verify
```

Options utiles:
- `--skip-stripe`: ignore les appels Stripe live
- `--skip-db`: ignore la lecture des entitlements DB
- `--strict`: fail aussi sur warnings
- `--json`: sortie machine-readable

Exemple CI stricte:
```bash
pnpm pricing:verify --strict --json
```
