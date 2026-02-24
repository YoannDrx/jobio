# 09 - Entitlements V2 Foundation (Phase A1)

Date: 2026-02-22

## Objectif

Poser la base data-driven des droits plan/features sans casser le comportement actuel.

## Livré

- Schéma Prisma:
  - `plan_entitlement_release` (version active par plan)
  - `plan_entitlement` (limites versionnées par feature)
- Migration seedée:
  - version `1` pour `free`, `pro`, `ultra`
  - valeurs alignées sur `src/lib/auth/stripe/auth-plans.ts`
- Resolver serveur:
  - `src/lib/auth/stripe/plan-entitlements.ts`
  - fallback automatique vers les limites statiques en cas d'erreur DB
  - support d'override applicatif (preview/expérimentation)
- Intégration applicative:
  - gating serveur (`src/lib/plan-limits.ts`)
  - billing (`app/(logged-in)/(account-layout)/account/billing/page.tsx`)
  - actions analytics (historique plan)
  - check limits / usage actions
  - pages freelance insights/registers
  - export CSV pipeline/contacts aligné avec limites résolues serveur

## Kill Switch

- `PLAN_ENTITLEMENTS_DB_ENABLED=false`
- Effet: retour immédiat au mode statique (`auth-plans.ts`) sans migration rollback.

## Validation

- `pnpm prisma generate`
- `pnpm ts`
- `pnpm lint`
- `pnpm test:ci __tests__/plan-entitlements.test.ts __tests__/pricing-matrix.test.ts __tests__/auth-plan-billing-limits.test.ts`
- `pnpm build`

## Prochain incrément Phase A2

- Créer UI/admin ops pour publier une nouvelle version d'entitlements (v2, v3...).
- Ajouter snapshot test automatique "DB entitlements vs pricing matrix UI".
- Ajouter script CI de cohérence Stripe metadata (`plan`, `billing`, `version`).
