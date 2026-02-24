# 01 - Inventaire Features Jobio (implémentation réelle)

Date d'audit: 2026-02-21
Source: codebase locale (`app/`, `src/features/`, `src/lib/plan-limits.ts`)

## 1) Prospection (Job workspace)

### Pipeline missions
- Pages: `app/job/pipeline/page.tsx`
- Actions clés: `src/features/missions/missions.action.ts`, `src/features/missions/export-missions.action.ts`
- Capacités:
  - CRUD mission, Kanban + liste
  - score mission, filtres, vues sauvegardées
  - export CSV
  - batch (update statut, archivage)

### Contacts CRM
- Pages: `app/job/contacts/page.tsx`
- Actions clés: `src/features/contacts/contacts.action.ts`, `src/features/contacts/import-contacts.action.ts`, `src/features/contacts/export-contacts.action.ts`
- Capacités:
  - CRUD contacts
  - import CSV, export CSV
  - détection doublons + fusion contacts
  - interactions, tags, tri relationnel

### Profils freelance
- Pages: `app/job/profiles/page.tsx`
- Actions clés: `src/features/profiles/profiles.action.ts`
- Capacités:
  - multi-profils
  - skills/expériences/formation/langues/projets
  - import LinkedIn (actions dédiées)

### Plateformes
- Pages: `app/job/platforms/page.tsx`
- Actions clés: `src/features/platforms/platforms.action.ts`
- Capacités:
  - association utilisateur <-> plateformes
  - statuts plateforme + URL profil

### Entreprises cibles
- UI: accès depuis pipeline
- Actions clés: `src/features/companies/companies.action.ts`
- Capacités:
  - ajout/suivi entreprises cibles

## 2) Exécution commerciale

### Relances
- Pages: `app/job/follow-ups/page.tsx`, `app/job/calendar/page.tsx`
- Actions clés: `src/features/follow-ups/follow-ups.action.ts`
- Capacités:
  - relances manuelles
  - calendrier/listing
  - batch et notifications

### Séquences
- Pages: `app/job/sequences/page.tsx`
- Actions clés: `src/features/sequences/sequences.action.ts`
- Capacités:
  - CRUD séquences
  - application sur missions

### Templates messages
- Pages: `app/job/templates/page.tsx`
- Actions clés: `src/features/templates/templates.action.ts`
- Capacités:
  - templates custom + templates system
  - duplication template

## 3) IA & automatisation

### Quota IA transverse
- Fichier central: `src/features/ai/ai-quota.ts`
- Utilisé par: parsing mission, génération emails, LinkedIn audit, CV coach, stratégie du jour, forecast billing, etc.

### IA premium explicite
- Génération email: `src/features/ai/generate-email.action.ts`
- LinkedIn audit: `src/features/ai/linkedin-audit.action.ts`
- Coach CV chat: `app/api/cv-lab/coach/chat/route.ts`

## 4) CV Lab / CV Studio

### CV Master + CV Lab
- Pages: `app/job/cv-studio/page.tsx`, `app/job/cv-lab/page.tsx`
- Actions clés: `src/features/cv-lab/cv-lab.action.ts`, `src/features/cv-lab/master-cv.action.ts`
- Capacités:
  - documents CV multiples
  - templates CV (Classic, Two-column, Executive, Compact)
  - versioning CV
  - export PDF

### ATS scoring
- Action: `analyzeCvLabAtsAction` dans `src/features/cv-lab/cv-lab.action.ts`

### CV Coach IA
- Route API: `app/api/cv-lab/coach/chat/route.ts`
- Studio: `src/features/cv-lab/components/cv-coach-studio.tsx`

## 5) Analytics

- Page: `app/job/analytics/page.tsx`
- Actions: `src/features/analytics/actions/*`
- Capacités:
  - activité hebdo
  - funnel
  - revenue forecast
  - plateformes, performance, velocity
  - fenêtre d'historique selon plan (`analyticsHistoryDays`)

## 6) Freelance Billing Studio

### Dashboard et pages
- Dashboard: `app/freelance/page.tsx`
- Clients: `app/freelance/clients/page.tsx`
- Devis: `app/freelance/quotes/page.tsx`
- Factures: `app/freelance/invoices/page.tsx`
- Paiements: `app/freelance/payments/page.tsx`
- Catalogue: `app/freelance/catalog/page.tsx`
- Registres/exports: `app/freelance/registers/page.tsx`
- Insights URSSAF/activité: `app/freelance/insights/page.tsx`
- Dépenses: `app/freelance/expenses/*`

### Actions clés
- `src/features/freelance/billing-clients.action.ts`
- `src/features/freelance/billing-documents.action.ts`
- `src/features/freelance/billing-catalog.action.ts`
- `src/features/freelance/billing-ai-forecast.action.ts`

## 7) Plans & facturation abonnement

- Configuration plans: `src/lib/auth/stripe/auth-plans.ts`
- Enforcement: `src/lib/plan-limits.ts`
- UI pricing: `src/features/plans/pricing-section.tsx`, `src/features/plans/pricing-card.tsx`, `src/features/plans/pricing-comparison-table.tsx`
- Billing account: `app/(logged-in)/(account-layout)/account/billing/page.tsx`
- Stripe checkout: `src/features/plans/plans.action.ts`
- Stripe webhook: `app/api/webhooks/stripe/route.ts`

## 8) Constats synthèse

- Le produit est déjà large (prospection + CV + billing), pas uniquement CRM.
- Le gating principal existe et est structuré.
- Les écarts observés pendant l'audit sont surtout:
  - cohérence UX (liens, CTA, tableau comparaison)
  - quelques bypasss de limites sur flux secondaires (duplication)
  - alignement marketing vs réalité d'implémentation.
