# 02 - Matrice de Gating (état réel)

Date d'audit: 2026-02-21

## 1) Limites quantitatives (check/enforce)

| Feature | Limite | Check | Enforce principal | Statut |
|---|---:|---|---|---|
| missions | 15 / illimité | `checkPlanLimit("missions")` | `missions.action.ts`, extension API | OK |
| profiles | 2 / 5 / illimité | `checkPlanLimit("profiles")` | `profiles.action.ts` | OK |
| contacts | 30 / 200 / illimité | `checkPlanLimit("contacts")` | `contacts.action.ts`, import contacts | OK |
| platforms | 3 / 10 / illimité | `checkPlanLimit("platforms")` | `platforms.action.ts` | OK |
| companies | 10 / 50 / illimité | `checkPlanLimit("companies")` | `companies.action.ts` | OK |
| billingClients | 0 / 10 / illimité | `checkPlanLimit("billingClients")` | `billing-clients.action.ts` | OK |
| billingQuotes | 0 / 50 / illimité | `checkPlanLimit("billingQuotes")` | `billing-documents.action.ts` | OK |
| billingInvoices | 0 / 50 / illimité | `checkPlanLimit("billingInvoices")` | `billing-documents.action.ts` | OK |
| billingCatalogItems | 0 / 25 / illimité | `checkPlanLimit("billingCatalogItems")` | `billing-catalog.action.ts` | OK |
| aiRequestsPerMonth | 5 / 50 / 999 | `checkPlanLimit("aiRequestsPerMonth")` | `ai-quota.ts` | OK |
| cvDocuments | 1 / 10 / illimité | `checkPlanLimit("cvDocuments")` | `cv-lab.action.ts` | OK |
| sequences | 0 / 3 / illimité | `checkPlanLimit("sequences")` | `sequences.action.ts` | OK |
| messageTemplates | 3 / 20 / illimité | `checkPlanLimit("messageTemplates")` | `templates.action.ts` | Corrigé (duplication couverte) |

## 2) Features booléennes (check/enforce)

| Feature | Free | Pro | Ultra | Enforcement | Statut |
|---|---|---|---|---|---|
| cvTemplatesAll | Non | Oui | Oui | `cv-lab.action.ts` + UI CV Lab | Corrigé |
| cvCoachAI | Non | Non | Oui | `app/api/cv-lab/coach/chat/route.ts` | OK |
| atsScoring | Non | Oui | Oui | `cv-lab.action.ts` (`analyzeCvLabAtsAction`) | OK |
| autoFollowUps | Non | Oui | Oui | `follow-up-rules-engine.ts` | OK |
| csvExport | Non | Oui | Oui | `export-missions.action.ts`, `export-contacts.action.ts` | OK |
| aiEmailGeneration | Non | Oui | Oui | `generate-email.action.ts` | OK |
| aiLinkedinAudit | Non | Oui | Oui | `linkedin-audit.action.ts` | OK |

## 3) Points de vigilance restants

- Les claims de support ("email prioritaire", "chat prioritaire") sont marketing; pas de routage/support queue différent implémenté aujourd'hui.
- Certains contenus marketing historiques peuvent encore mentionner des promesses non strictement contractuelles (à harmoniser avec `auth-plans.ts`).
