# 03 - Claims vs Réalité (site + billing + Stripe)

Date d'audit: 2026-02-21

## 1) Pricing cards / Landing

| Claim                       | Source                                   | Réalité code                              | Verdict         |
| --------------------------- | ---------------------------------------- | ----------------------------------------- | --------------- |
| 3 plans Free / Pro / Ultra  | `src/features/plans/pricing-section.tsx` | `AUTH_PLANS` contient 3 plans             | Vrai            |
| Pro: 9.99€/mois, 99€/an     | `auth-plans.ts` + card                   | Stripe Live price actif 999 / 9900        | Vrai            |
| Ultra: 19.99€/mois, 199€/an | `auth-plans.ts` + card                   | Stripe Live price actif 1999 / 19900      | Vrai            |
| "-20%" annuel               | `pricing-section.tsx`                    | discount réel calculé ~17% (99 vs 119.88) | Faux -> corrigé |
| Free CTA doit fonctionner   | `pricing-card.tsx`                       | appelait checkout Stripe sans priceId     | Faux -> corrigé |

## 2) Billing page (compte)

| Claim                                    | Source             | Réalité code                                      | Verdict            |
| ---------------------------------------- | ------------------ | ------------------------------------------------- | ------------------ |
| Afficher les limites du plan en cours    | `user-billing.tsx` | oui via `getPlanLimits`                           | Vrai               |
| Afficher usage sur limites quantitatives | `billing/page.tsx` | certaines limites non calculées (ex. `companies`) | Partiel -> corrigé |

## 3) Gating messages / upgrade

| Claim                                            | Source                  | Réalité code                             | Verdict         |
| ------------------------------------------------ | ----------------------- | ---------------------------------------- | --------------- |
| Message upgrade dynamique Free->Pro / Pro->Ultra | `plan-limits.ts`        | `getPlanUpgradeLabel/ButtonText/Message` | Vrai            |
| Bouton banner de limite vers page billing        | `plan-limit-banner.tsx` | lien `/app/account/billing` incohérent   | Faux -> corrigé |

## 4) CV Lab

| Claim                                | Source                             | Réalité code                   | Verdict            |
| ------------------------------------ | ---------------------------------- | ------------------------------ | ------------------ |
| Templates premium réservés Pro/Ultra | `auth-plans.ts` (`cvTemplatesAll`) | pas enforce partout auparavant | Partiel -> corrigé |
| ATS scoring réservé Pro+             | `auth-plans.ts`                    | enforce côté serveur           | Vrai               |
| CV Coach IA réservé Ultra            | `auth-plans.ts`                    | check route chat coach         | Vrai               |

## 5) Stripe Live (Jobio uniquement)

Produits audités:

- `prod_TvpdKsfY08PCF0` (Jobio Pro)
- `prod_TvpdRzPqeJQGfX` (Jobio Ultra)

Prix actifs constatés:

- Pro mensuel: `price_1SxxydH4VwBfiTEI0f4jurPk` (999)
- Pro annuel: `price_1T2zxnH4VwBfiTEIZu2BPZ1J` (9900)
- Ultra mensuel: `price_1SxxyhH4VwBfiTEIUllwpt4V` (1999)
- Ultra annuel: `price_1T2zxuH4VwBfiTEI7fC4lHOg` (19900)

Anciennes annuelles inactives:

- Pro 95.90: `price_1SxxygH4VwBfiTEI9a7e8RrQ`
- Ultra 191.90: `price_1SxxyjH4VwBfiTEIq4YIk4e3`

Verdict Stripe pricing: aligné.
