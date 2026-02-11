# Jobio Roadmap

Date de démarrage: 2026-02-10

## Objectif global

Construire une V1 fiable du cockpit commercial Jobio pour freelances tech, avec:

- un coeur produit réellement exécutable (capture mission, pipeline, follow-ups, Today),
- une cohérence stricte des données produit (compteurs, statuts, quotas),
- une qualité logicielle solide (TS/Lint/Unit/E2E verts),
- une base prête pour les premiers utilisateurs payants.

## Légende

- `[ ]` À faire
- `[~]` En cours
- `[x]` Terminé

## Phase 1 - Stabilisation qualité (P0)

- `[x]` Corriger la suite E2E cassée (selectors, parcours, labels)
- `[x]` Durcir les helpers E2E (création compte, attente DB, cleanup)
- `[x]` Corriger la config Playwright pour un run CI déterministe
- `[x]` Faire passer `pnpm ts`, `pnpm lint:ci`, `pnpm test:ci`, `pnpm test:e2e:ci`
- `[x]` Supprimer les flakiness évidentes

## Phase 2 - Execution Engine (P1)

- `[x]` Finaliser le cycle follow-up (create/edit/complete/snooze) dans le détail mission
- `[x]` Rendre l’application des séquences atomique et fiable
- `[x]` Renforcer Today (actions urgentes réellement actionnables)
- `[x]` Aligner notifications métier (due/overdue/stale/quota)

## Phase 3 - Product Truth (P1)

- `[x]` Harmoniser la machine de statuts mission dans toutes les vues
- `[x]` Aligner analytics, compteurs, exports et limites plan
- `[x]` Ajouter des tests de non-régression sur compteurs/quotas/statuts

## Phase 4 - Activation & Conversion (P2)

- `[ ]` Onboarding guidé de bout en bout (new user -> 1 mission -> 1 relance)
- `[ ]` Clarifier la landing (promesse + preuve + pricing + CTA)
- `[ ]` Ajouter instrumentation produit pour Activation D7 / Rétention / Conversion

## Journal d’avancement

### 2026-02-10

- `[x]` Audit du codebase et du dernier commit réalisé.
- `[x]` Identification des principaux blocages CI (10 échecs E2E).
- `[x]` Corrections ciblées appliquées:
  - robustesse des sélecteurs E2E (`missions`, `account`, `contacts`, `templates`, `profiles`, `follow-ups`),
  - helper de sign-out durci avec fallback cookie reset,
  - config Playwright fiabilisée (webServer conditionné à `EXTERNAL_BASE_URL`),
  - correction d'un anti-pattern React (`setState` en render) sur le kanban,
  - application des séquences follow-up rendue atomique (`Promise.all`).
- `[x]` Validation complète exécutée et verte:
  - `pnpm ts`,
  - `pnpm lint:ci`,
  - `pnpm test:ci`,
  - `pnpm build`,
  - `pnpm test:e2e:ci` (`13/13`).
- `[x]` Exécution de la Phase 2 livrée:
  - cycle follow-up complet dans `MissionDetailSheet` (planifier, modifier, compléter, supprimer, reporter +1j),
  - `Today` rendu actionnable (compléter, reporter +1j, planifier relance sur mission stale),
  - notifications métier `FOLLOW_UP_DUE / FOLLOW_UP_OVERDUE / MISSION_STALE` branchées avec déduplication,
  - sécurisation du rendu `Today` via `Promise.allSettled` pour éviter qu’une notification casse la page.
- `[x]` Re-validation complète après modifications Phase 2:
  - `pnpm ts`,
  - `pnpm lint:ci`,
  - `pnpm test:ci`,
  - `pnpm test:e2e:ci` (`13/13`),
  - `pnpm build`.
- `[x]` Démarrage Phase 3 (Product Truth) livré:
  - centralisation des statuts mission (`src/features/missions/mission-status.ts`),
  - harmonisation des statuts entre formulaire, filtres pipeline, kanban, Today et analytics,
  - correction analytics hebdo: les relances sont désormais comptées sur `completedAt` (et non `createdAt`),
  - ajustement limite plan missions pour compter uniquement les missions réellement actives,
  - ajout de tests de non-régression:
    - unitaires sur constantes de statuts (`__tests__/mission-status.test.ts`),
    - e2e mission `EN_PAUSE` visible dans le pipeline (`e2e/missions.spec.ts`).
- `[x]` Re-validation complète après refactor Product Truth:
  - `pnpm ts`,
  - `pnpm lint:ci`,
  - `pnpm test:ci`,
  - `pnpm test:e2e:ci` (`14/14`),
  - `pnpm build`.
- `[x]` Finalisation Product Truth livrée:
  - synchronisation des limites plan dans toutes les actions pipeline (create/update/archive/changement de statut),
  - correction UX sur création/édition manuelle de mission (gestion d’erreur explicite via toast),
  - export CSV aligné sur les missions actives du pipeline + libellés statut lisibles,
  - ajout de tests e2e de limite active Free:
    - blocage à 15 missions actives,
    - autorisation de création quand l’historique contient des missions archivées.
- `[x]` Validation finale post-finalisation Product Truth:
  - `pnpm ts`,
  - `pnpm lint:ci`,
  - `pnpm test:ci`,
  - `pnpm test:e2e:ci` (`17/17`),
  - `pnpm build`.
