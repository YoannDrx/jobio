# Jobio Premium Backlog

Date: 2026-02-14
Owner: Product + Engineering

## Goal

Pass from a solid V1 to a premium product quality level on:

- user dashboard and core workflows,
- admin 360 monitoring and operations,
- SEO, performance, UX polish, and reliability.

## Legend

- `[ ]` todo
- `[~]` in progress
- `[x]` done
- Priority: `P0` critical, `P1` high value, `P2` optimization

## Delivered in this cycle

- `[x][P0]` Pipeline deep-link now works end-to-end (`missionId` in URL opens mission detail).
- `[x][P0]` Contacts deep-link now works end-to-end (`contactId` in URL opens contact detail).
- `[x][P0]` Follow-ups list/calendar now load global data (no hidden month-only scope in list view).
- `[x][P0]` AI chat API hardened:
  - validate payload before quota consumption,
  - reject invalid/empty user prompt,
  - thread title now derived from user prompt (not assistant answer).
- `[x][P1]` Contacts search flow cleaned to avoid duplicate fetch on each keystroke.
- `[x][P1]` Notifications are now context-aware deep-links (direct open on target mission).
- `[x][P1]` Contacts bulk actions now refresh data immediately after completion.
- `[x][P1]` Pipeline saved views (local presets) for filters/sort/view mode.
- `[x][P1]` Contacts relationship score (`hot/warm/cold`) + next action in list view.
- `[x][P1]` Contact detail sheet now surfaces relationship score and freshness context.
- `[x][P1]` Contacts list now supports sorting by relationship score (strongest/weakest).
- `[x][P1]` Contacts filtering by relationship tier (`Hot/Warm/Cold`) added.
- `[x][P1]` One-click "next action" from contacts list (auto follow-up creation when relevant).
- `[x][P0]` CV Coach IA MVP shipped:
  - conversational CV interview session,
  - structured snapshot persistence,
  - missing data + inconsistency detection,
  - completeness score and priority questions,
  - manual snapshot editing + apply to profile (merge/replace).

## Product audit by feature area

### Dashboard / Today

- Current value:
  - strong "today cockpit" with urgent actions and suggestions.
- Pain points:
  - heavy server page with many responsibilities.
  - limited adaptive prioritization by user context (plan, goals, stage).
- Backlog:
  - `[ ] [P1]` split data providers from presentational blocks.
  - `[ ] [P1]` add "priority score" per task (impact x urgency x confidence).
  - `[ ] [P2]` add "focus mode" (top 3 actions only, no noise).

### Pipeline

- Current value:
  - Kanban + list + filters + capture + detail sheet.
- Pain points:
  - page is large and mixes orchestration, data, and UI.
  - no saved views for recurring filter sets.
- Backlog:
- `[x] [P1]` saved views ("Remote high TJM", "Urgent follow-up", etc.).
  - `[ ] [P1]` bulk status transitions with undo.
  - `[ ] [P2]` pipeline health score per stage with bottleneck hints.
  - `[ ] [P2]` keyboard-first navigation in table/kanban.

### Contacts CRM

- Current value:
  - contact CRUD, tags, interactions, CSV import/export.
- Pain points:
  - no relationship strength scoring, limited enrichment.
- Backlog:
- `[x] [P1]` relationship score (last touch, response rate, mission outcomes).
  - `[ ] [P1]` smart dedupe assistant with merge preview.
  - `[ ] [P2]` enrichment connectors (LinkedIn/manual company data).
  - `[ ] [P2]` next-best-action suggestion per contact.

### Follow-ups / Sequences

- Current value:
  - complete follow-up lifecycle, sequence apply, calendar/list views.
- Pain points:
  - follow-up strategy remains mostly manual.
- Backlog:
  - `[ ] [P1]` strategy presets by mission status.
  - `[ ] [P1]` SLA guardrails (ex: max 5 days without touch after interview).
  - `[ ] [P2]` sequence effectiveness analytics (reply rate by step/type).
  - `[ ] [P2]` anti-overload caps (max follow-ups/day per user).

### AI Chat / Copilot

- Current value:
  - integrated assistant with real data tools.
- Pain points:
  - limited conversation memory structuring and suggested prompts.
- Backlog:
  - `[ ] [P1]` prompt chips by context (pipeline, contacts, pricing, emails).
  - `[ ] [P1]` "action plan" output mode (checklist auto-generated).
  - `[ ] [P2]` conversation foldering/tags.
  - `[ ] [P2]` post-answer CTA buttons ("create follow-up", "update mission").

### CV Lab (premium direction)

- Current value:
  - CV studio with templates and rendering baseline.
- Pain points:
  - needs stronger editing ergonomics and final rendering controls.
- Backlog:
  - `[~][P0]` split editor/preview layout (left editor, right live preview).
  - `[~][P0]` enforce A4 rendering constraints.
  - `[~][P0]` keep unitary section blocks to avoid bad cross-page cuts.
  - `[x][P0]` CV Coach IA guided intake linked to profile data model.
  - `[ ] [P1]` multiple named CV variants per target role.
  - `[ ] [P1]` visual themes with strict typography scale and spacing rules.
  - `[ ] [P1]` PDF export quality modes (standard, print, ATS-safe).
  - `[ ] [P1]` CV Coach source evidence panel (field-by-field provenance from chat turns).
  - `[ ] [P1]` CV Coach confidence score per field (high/medium/low confidence).
  - `[ ] [P1]` one-click \"apply missing questions\" in chat queue (guided interview flow).
  - `[ ] [P1]` conversion quality checks before export (date consistency, tense consistency, ATS wording).
  - `[ ] [P2]` voice-to-CV intake (audio transcription + structured extraction).
  - `[ ] [P2]` cover letter lab with synchronized profile context.

## New feature ideas (value expansion)

- `[ ] [P1]` Opportunity Radar:
  - central feed of mission opportunities scored against user profile.
- `[ ] [P1]` Win/Loss Journal:
  - force reason capture on accepted/refused outcomes, feed analytics.
- `[ ] [P1]` Client Portal:
  - share polished mission pipeline snapshots to prospects/partners.
- `[ ] [P2]` Revenue Planner:
  - forecast from pipeline probability x TJM x duration.
- `[ ] [P2]` Personal KPI Coach:
  - weekly "what to improve next" digest with exact actions.

## Admin 360 (target state)

### User operations

- `[x][P0]` impersonate user flow available.
- `[x][P0]` AI credits and subscription operations available.
- `[ ] [P1]` grant/revoke feature flags per user.
- `[ ] [P1]` session risk flags (geo/device anomalies).
- `[ ] [P1]` one-click account recovery playbooks.

### Billing / compliance

- `[x][P0]` invoice timeline and Stripe operations available.
- `[ ] [P1]` dispute and chargeback cockpit.
- `[ ] [P1]` tax/VAT status monitoring.
- `[ ] [P2]` compliance audit export package per user.

### Monitoring / support

- `[x][P0]` admin audit logs visible.
- `[ ] [P1]` per-user health score (errors, drop-off, inactivity, billing risk).
- `[ ] [P1]` support timeline (notes + actions + outcome).
- `[ ] [P2]` SLA dashboard for support response times.

## SEO / Growth

- `[ ] [P1]` extend structured data (Product, FAQ, Breadcrumb where relevant).
- `[ ] [P1]` programmatic internal linking from blog/docs to conversion pages.
- `[ ] [P1]` content clusters around freelance pipeline pain points.
- `[ ] [P2]` optimize OG image generation per page type.
- `[ ] [P2]` monitor index coverage and CWV deltas in a monthly ritual.

## Performance / Reliability

- `[ ] [P0]` extract large pages into feature containers + server/client boundaries.
- `[ ] [P1]` shared query strategy for dashboard data (reduce duplicate fetching).
- `[ ] [P1]` add optimistic updates where safe (follow-ups, contacts tags).
- `[ ] [P1]` add API-level tracing IDs for support/debug.
- `[ ] [P2]` budget guardrails (bundle size and interaction latency thresholds).

## UI / UX Premium Checklist

- `[ ] [P1]` stronger visual hierarchy in dashboard cards and tables.
- `[ ] [P1]` consistent empty/loading/error states across all user pages.
- `[ ] [P1]` keyboard and accessibility pass on command palette + tables + sheets.
- `[ ] [P2]` subtle but intentional motion system (entry, state transition, confirmation).
- `[ ] [P2]` microcopy upgrade (clear outcomes, next action hints, less ambiguity).

## Deep optimization list (next waves)

- `[ ] [P1]` Dashboard:
  - split Today page data loader into independent server data blocks to reduce full-page rerender risk.
  - progressive hydration for heavy widgets (analytics/charts after critical actions).
- `[ ] [P1]` Pipeline:
  - optimistic status move with undo toast and retry queue.
  - keyboard command mode for mission triage (`J/K`, `E` edit, `F` follow-up).
- `[ ] [P1]` Contacts:
  - contact timeline auto-summary (last 30 days) generated nightly.
  - duplicate detection by fuzzy match on name/email/company with merge assistant.
- `[ ] [P1]` Follow-ups:
  - strategy advisor by mission stage with expected response windows.
  - stop-condition rules to avoid over-relance and protect brand image.
- `[ ] [P1]` AI:
  - prompt versioning + offline evaluation set for regression control.
  - per-feature token budget dashboard for cost governance.
- `[ ] [P1]` CV Lab / Coach:
  - field-level lock mode (prevent AI overwriting validated blocks).
  - CV diff view between two target roles to track positioning changes.
  - ATS target keyword planner with gap closure checklist.
- `[ ] [P1]` Admin 360:
  - user risk timeline (billing + product + support incidents unified).
  - admin playbooks (refund, quota grant, temporary plan override) with one-click workflows.
  - secure impersonation banner + mandatory reason capture + auto-expire guardrails.
- `[ ] [P1]` Performance:
  - route-level bundle budget and CI guardrail (fail on regression threshold).
  - fetch dedup policy audit (remove duplicate calls in mounted client features).
- `[ ] [P1]` SEO:
  - canonical/alternate/hreflang quality pass for all marketing pages.
  - semantic heading map and FAQ schema for conversion pages.
- `[ ] [P2]` Reliability:
  - synthetic monitoring on critical user flows (auth, create mission, create follow-up, CV export).
  - structured incident template and postmortem checklist in repo.

## KPI frame (track weekly)

- Activation:
  - `% new users with first mission in < 24h`
  - `% users with first follow-up in < 48h`
- Retention:
  - `WAU/MAU`
  - `% users with >=3 meaningful actions/week`
- Conversion:
  - `free -> paid conversion`
  - `trial -> active paid`
- Product quality:
  - `p95 page interactive latency`
  - `error rate by feature`
  - `support tickets per 100 active users`

## Next execution batches

- Batch A (P0 immediate): deep-link reliability, follow-ups scope, AI chat payload hardening.
- Batch B (P1 user premium): saved views, relationship score, sequence analytics, CV Lab premium editing.
- Batch C (P1 admin 360): risk scoring, support timeline, feature flags by user.
- Batch D (P1 growth/perf): SEO structure, page decomposition, query/data strategy.
