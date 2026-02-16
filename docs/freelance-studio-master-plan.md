# Freelance Studio Master Plan (100% Coverage)

Date: 2026-02-16
Owner: Product + Engineering
Status: In progress

## Objective

Deliver a fully operational Freelance Studio that covers the complete invoicing lifecycle with premium UX:

- Clients, quotes, invoices, payments, credit notes, registers, URSSAF, logs
- Full editing freedom (owner override) with traceable audit logs
- Advanced customization (layout + templates + visual identity)
- Imports (CSV/PDF) for historical invoices and client data
- Expense management (supplier invoices, expense notes, trips)
- AI-assisted forecasting and operational recommendations

## Delivery Waves

### Wave 1 - UX/Actions Parity + Owner Controls + Preview Reliability

- [x] Quotes:
  - [x] Add `...` action menu (duplicate, cancel, delete)
  - [x] Add quote duplicate and quote delete backend actions
  - [x] Add table/cards view switch
- [x] Invoices:
  - [x] Add table/cards view switch
  - [x] Keep icon-only quick actions and preserve existing menu `...`
- [x] Clients:
  - [x] Enable hard delete owner override even with linked documents via safe reassignment
  - [x] Keep full audit trail for owner override deletions
- [x] Settings:
  - [x] Add server-rendered template preview endpoint (HTML/PDF)
  - [x] Add explicit "real PDF preview" action from settings

### Wave 2 - Shared Studio Architecture

- [ ] Extract a shared `BillingDocumentStudio` used by both quotes and invoices
- [ ] Share line editor, totals, legal blocks, metadata blocks, options panel
- [ ] Ensure same live A4 preview language in Settings and Studio
- [ ] Keep clickable sections in preview linked to right-side editor panel

### Wave 3 - Client Data Depth

- [x] Add persistent multi-contact model (`BillingClientContact`)
- [x] Full client edition workflow (not just create/archive)
- [x] Contact-level email inclusion flags
- [x] Import clients mapping to multi-contacts when available

### Wave 4 - Expenses Complete

- [x] Add Prisma models and actions:
  - [x] Supplier invoices
  - [x] Expense notes
  - [x] Trips
- [x] CRUD UX in Freelance side panels
- [x] Attachments and statuses
- [x] Matching logic with outgoing payments (manual + assisted)
- [x] CSV exports for expense accounting registers

### Wave 5 - Compliance and Audit Hardening

- [x] Field-level before/after snapshots on sensitive updates
- [x] Compliance export package (audit + legal metadata + registers)
- [ ] Advanced safeguards and reversible operations where relevant
- [ ] Bulk action workflows with explicit audit context

### Wave 6 - AI + Advanced Insights

- [ ] Scenario simulator (optimistic / realistic / conservative)
- [ ] Late payment risk scoring by client
- [ ] AI reminder assistant for overdue invoices
- [ ] Time-window and drill-down analytics in dashboards

### Wave 7 - Final QA and Premium Polish

- [ ] Complete design-system pass on Freelance screens
- [ ] Accessibility pass (focus, contrast, keyboard flow)
- [ ] Unit + integration + e2e on critical billing flows
- [ ] Performance pass on heavy tables and parsers
- [ ] Release checklist and operational readiness

## Definition of Done

- Every Freelance sidebar section is functional (no placeholder pages)
- Core lifecycle is robust end-to-end:
  - client -> quote -> invoice -> payment -> register -> declaration
- Owner override rules are explicit, safe, and audited
- All critical operations are available through premium, coherent UX
- Tests and lint pass on the final scope
