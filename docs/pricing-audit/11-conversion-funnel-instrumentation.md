# 11 - Conversion Funnel Instrumentation (Phase C1)

Date: 2026-02-23

## Objectif

Mesurer le funnel pricing/upgrade end-to-end et exposer les conversions dans l'admin.

## Implémentation

- Modèle DB:
  - `prisma/schema/pricing-funnel-event.prisma`
  - migration: `20260223003000_add_pricing_funnel_events`
- Service:
  - `src/lib/pricing/pricing-funnel-events.ts`
  - capture des events avec fallback si table absente
  - agrégation funnel 30j (totaux + split pro/ultra + conversion rates)
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
- Upgrade checkout:
  - `src/features/plans/plans.action.ts`
- Webhook Stripe:
  - `app/api/webhooks/stripe/route.ts`
- Paywall server:
  - `src/lib/plan-limits.ts`

## Surface admin

- `/admin/ops`:
  - carte "Conversion pricing (30 jours)"
  - totaux funnel
  - conversion checkout et subscription
  - tableau pro/ultra

## Notes ops

- Si la migration n'est pas déployée, le système ne casse pas:
  - la capture est best-effort (fallback silencieux)
  - `/admin/ops` affiche l'état indisponible.
