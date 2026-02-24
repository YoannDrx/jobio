# 11 - Conversion Funnel Instrumentation (Phase C1/C2)

Date: 2026-02-23

## Objectif

Mesurer le funnel pricing/upgrade end-to-end et exposer les conversions dans l'admin.

## Implémentation

- Modèle DB:
  - `prisma/schema/pricing-funnel-event.prisma`
  - migration: `20260223003000_add_pricing_funnel_events`
  - migration: `20260223120000_add_pricing_funnel_experiment_variant`
- Service:
  - `src/lib/pricing/pricing-funnel-events.ts`
  - capture des events avec fallback si table absente
  - agrégation funnel 30j:
    - totaux
    - split pro/ultra
    - split par variante d'expérience (`control`, `value_stack`, `roi_focus`)
    - split par `entryPoint` (SEO use-case, landing, billing, paywall, etc.)
    - conversion rates
- Events capturés:
  - `PRICING_PAGE_VIEWED`
  - `PLAN_SELECTED`
  - `CHECKOUT_STARTED`
  - `SUBSCRIPTION_COMPLETED`
  - `PAYWALL_HIT`

## Points de capture

- UI pricing:
  - `src/features/plans/pricing-section.tsx`
  - `src/features/plans/pricing-card.tsx`
  - attribution variante A/B via paramètre `?pv=` + persistance locale
- Upgrade checkout:
  - `src/features/plans/plans.action.ts`
  - metadata Stripe enrichie avec `experimentVariant`
- Webhook Stripe:
  - `app/api/webhooks/stripe/route.ts`
  - récupération variante depuis metadata checkout/subscription
- Paywall server:
  - `src/lib/plan-limits.ts`

## Surface admin

- `/admin/ops`:
  - carte "Conversion pricing (30 jours)"
  - totaux funnel
  - conversion checkout et subscription
  - tableau pro/ultra
  - tableau conversion par variante d'expérience
  - tableau conversion par entry point

## Notes ops

- Si la migration n'est pas déployée, le système ne casse pas:
  - la capture est best-effort (fallback silencieux)
  - `/admin/ops` affiche l'état indisponible.
