# 10 - Entitlements V2 Ops & Verify (Phase A2/B1)

Date: 2026-02-22

## Livré

- Actions admin:
  - `createPlanEntitlementVersionAction`
  - `activatePlanEntitlementVersionAction`
  - `getPlanEntitlementsOverview`
- UI admin:
  - section "Entitlements plans (versionnés)" dans `/admin/ops`
  - boutons de clonage (`active` / `statique`)
  - boutons d'activation par version
- Guardrail release:
  - script `scripts/pricing-verify.ts`
  - commande `pnpm pricing:verify`

## Contrôles couverts par `pricing:verify`

1. Plans statiques:
   - présence des plans `free`, `pro`, `ultra`
   - cohérence des `priceId` / `annualDiscountPriceId` pour plans payants
2. Entitlements DB:
   - présence d'une release active par plan
   - présence des feature keys attendues
   - détection des dérives DB vs statique
3. Stripe:
   - vérification des price IDs configurés
   - montant, devise, intervalle billing
   - metadata `plan` et `billing`

## Mode opératoire recommandé

Avant release pricing:
```bash
pnpm pricing:verify --strict
```

En CI:
```bash
pnpm pricing:verify --strict --json
```
