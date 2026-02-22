# 02 - SEO Execution Log

## 2026-02-22 - Wave 1 (foundation)

- Metadata helper durci (`src/lib/seo.ts`):
  - robots explicites index/noindex
  - keywords par défaut + fusion/dedup
  - support alternates enrichis
- `noindex` appliqué aux zones privées/auth:
  - `app/auth/layout.tsx`
  - `app/job/layout.tsx`
  - `app/freelance/layout.tsx`
  - `app/admin/layout.tsx`
  - `app/(logged-in)/(account-layout)/layout.tsx`
- `robots.txt` aligné sur les routes privées.
- `sitemap.xml` enrichi et stabilisé.
- Flux RSS créé: `app/rss.xml/route.ts`.
- JSON-LD ajouté:
  - FAQ landing
  - BlogPosting + Breadcrumb sur article blog.

## 2026-02-22 - Wave 2 (stabilisation)

- Tests SEO ajoutés:
  - `__tests__/seo-metadata.test.ts`
  - `__tests__/robots-route.test.ts`
  - `__tests__/sitemap-route.test.ts`
  - `__tests__/rss-route.test.ts`
- Blog listing enrichi avec schema `Blog`.
- Route modal signin explicitement `noindex`.

## 2026-02-22 - Wave 3 (perf SEO / CWV)

- Démos landing passées en chargement client au viewport:
  - nouveau composant: `src/features/landing/demos/lazy-landing-demo.tsx`
  - `app/page.tsx` migre vers `LazyLandingDemo` (skeleton + IntersectionObserver).
- Objectif: réduire le JS critique en entrée et améliorer LCP/INP sur la landing.
- Metadata globale enrichie avec alternate RSS dans `app/layout.tsx`.

## 2026-02-22 - Wave 4 (structured data coverage)

- Ajout d'un composant réutilisable:
  - `src/components/seo/breadcrumb-structured-data.tsx`
- Ajout de breadcrumbs JSON-LD sur pages marketing:
  - `app/(layout)/about/page.tsx`
  - `app/(layout)/features/page.tsx`
  - `app/(layout)/docs/page.tsx`
  - `app/(layout)/contact/page.tsx`
- Ajout d'un schema `HowTo` sur la page docs (`app/(layout)/docs/page.tsx`).

## 2026-02-22 - Wave 5 (indexability safety net + SEO ops)

- Coverage breadcrumbs étendue:
  - `app/(layout)/blog/page.tsx`
  - `app/(layout)/legal/terms/page.tsx`
  - `app/(layout)/legal/privacy/page.tsx`
- Landing enrichie avec schema `WebSite`:
  - `app/page.tsx`
- Test de non-régression JSON-LD breadcrumb:
  - `__tests__/breadcrumb-structured-data.test.tsx`
- Runbook opérationnel publié:
  - `docs/seo/03-search-console-bing-runbook.md`
  - `docs/seo/04-intent-map-content-backlog.md`

## 2026-02-22 - Wave 6 (internal linking module)

- Nouveau composant de maillage interne:
  - `src/features/layout/related-resources-section.tsx`
- Intégration du bloc "Ressources liées" sur:
  - `app/(layout)/features/page.tsx`
  - `app/(layout)/docs/page.tsx`
  - `app/(layout)/blog/page.tsx`
  - `app/(layout)/blog/[slug]/page.tsx`
- Test unitaire du composant:
  - `__tests__/related-resources-section.test.tsx`

## 2026-02-22 - Wave 7 (admin SEO KPI monitor)

- Nouveau calculateur KPI SEO:
  - `src/features/admin/seo-kpi.ts`
- Nouvelle action serveur pour consolider les signaux SEO:
  - `app/admin/_actions/seo.ts`
- Intégration d'un bloc "SEO hebdo" sur:
  - `app/admin/ops/page.tsx`
  - KPIs: couverture sitemap, blocage robots privé, cadence éditoriale, fraîcheur blog
  - checklist automatique + actions recommandées
- Test unitaire du calculateur:
  - `__tests__/seo-kpi.test.ts`

## 2026-02-22 - Wave 8 (Search Console/Bing metrics integration)

- Nouveau loader de métriques SEO externes:
  - `src/features/admin/seo-search-metrics.ts`
  - validation stricte du snapshot JSON (source `env` ou fichier)
- Extension du calculateur KPI SEO:
  - `src/features/admin/seo-kpi.ts`
  - ajout des signaux acquisition (clics, impressions, CTR, position, deltas)
  - checklist dédiée "Métriques Search Console / Bing"
  - actions recommandées pilotées par statut (`not_configured`, `invalid`, chute de clics)
- Intégration UI admin:
  - `app/admin/ops/page.tsx`
  - nouveau bloc acquisition SEO (KPIs + top requêtes + état de configuration)
- Documentation d'exploitation:
  - `docs/seo/03-search-console-bing-runbook.md`
  - `docs/seo/05-search-metrics-snapshot.example.json`
- Tests:
  - `__tests__/seo-kpi.test.ts` enrichi
  - `__tests__/seo-search-metrics.test.ts` ajouté

## 2026-02-22 - Wave 9 (content backlog S1-S2 publication)

- Publication de 2 contenus prioritaires du backlog:
  - `src/features/blog/blog-data.ts`
  - `/blog/structurer-prospection-freelance-2026`
  - `/blog/crm-freelance-criteres-stack-minimale`
- Chaque contenu inclut des liens contextuels vers:
  - `/features`
  - `/#pricing`
- Backlog éditorial mis à jour:
  - `docs/seo/04-intent-map-content-backlog.md`
  - S1-S2 items 1 et 2 marqués comme réalisés.

## 2026-02-22 - Wave 10 (features intent SEO + auto metrics endpoint)

- Page `/features` enrichie SEO:
  - `app/(layout)/features/page.tsx`
  - metadata keywords orientés intentions ("crm freelance", "prospection freelance", "cv ats", "facturation freelance")
  - section FAQ orientée intention
  - JSON-LD `FAQPage` dédié à la page features
- Source métriques SEO automatisable:
  - `src/features/admin/seo-search-metrics.ts`
  - nouveau mode `endpoint` avec Bearer token optionnel + timeout configurable
  - ordre de priorité: env JSON -> endpoint -> fichier
- Surface Ops admin enrichie:
  - `app/admin/ops/page.tsx`
  - affichage explicite de la source des métriques (ENV / Endpoint / Fichier)
- Configuration et runbook mis à jour:
  - `src/lib/env.ts`
  - `.env-template`
  - `docs/seo/03-search-console-bing-runbook.md`
- Tests:
  - `__tests__/seo-search-metrics.test.ts` étendu (mode endpoint + erreurs HTTP)

## 2026-02-22 - Wave 11 (metrics collector + content S3-S4)

- Collector SEO automatisé (endpoint -> Redis cache):
  - `src/features/admin/seo-search-metrics-cache.ts`
  - `src/features/admin/seo-search-metrics.ts`
  - route cron `app/api/cron/seo-search-metrics-sync/route.ts`
- Surface admin Ops:
  - source `Redis cache` affichée dans `app/admin/ops/page.tsx`
- Configuration:
  - `.env-template`
  - `src/lib/env.ts`
- Test loader/sync enrichi:
  - `__tests__/seo-search-metrics.test.ts`
- Publication des contenus S3-S4:
  - `/blog/guide-cv-freelance-compatible-ats`
  - `/blog/relances-freelance-cadence-templates-erreurs`
  - source: `src/features/blog/blog-data.ts`
- Roadmap contenu mise à jour:
  - `docs/seo/04-intent-map-content-backlog.md`
  - Sprint S3-S4 marqué comme réalisé.

## 2026-02-22 - Wave 12 (content S5-S6 + freshness guardrail)

- Publication / refresh contenus backlog S5-S6:
  - `src/features/blog/blog-data.ts`
  - `/blog/tableau-de-bord-freelance-kpi-hebdomadaires`
  - `/blog/comment-fixer-son-tjm` (refresh title + contenu + maillage interne)
- Maillage éditorial renforcé dans les nouveaux contenus:
  - liens vers `/features`, `/docs`, `/#pricing`
- Garder l'Ops SEO actionnable quand la collecte devient obsolète:
  - `src/features/admin/seo-kpi.ts`
  - ajout d'un signal de fraîcheur snapshot (`snapshotAgeDays`, `isSnapshotStale`)
  - warning + action recommandée si snapshot trop ancien
  - `app/admin/ops/page.tsx`
  - affichage d'un badge "snapshot frais/stale" dans le bloc acquisition
- Tests:
  - `__tests__/seo-kpi.test.ts` enrichi (cas snapshot stale)
- Backlog éditorial mis à jour:
  - `docs/seo/04-intent-map-content-backlog.md`
  - Sprint S5-S6 marqué comme réalisé (item docs déjà livré précédemment).

## 2026-02-22 - Wave 13 (content S7-S8 + pricing truth-source)

- Publication des contenus S7-S8 prioritaires:
  - `src/features/blog/blog-data.ts`
  - `/blog/facturation-freelance-devis-factures-conformite`
  - `/blog/pipeline-freelance-lead-contrat-signe`
- Maillage éditorial dans ces contenus:
  - liens vers `/features`, `/docs`, `/#pricing`
- Anti-dérive pricing côté UI:
  - nouvelle matrice centralisée dérivée de `getPlanLimits`:
    - `src/features/plans/pricing-matrix.ts`
  - tableau comparatif branché sur la matrice (plus de hardcode des valeurs):
    - `src/features/plans/pricing-comparison-table.tsx`
  - landing stat "historique analytics en Pro" alignée dynamiquement sur les limites:
    - `app/page.tsx`
- Tests:
  - `__tests__/pricing-matrix.test.ts` ajouté (cohérence matrix <-> plans)
- Backlog éditorial mis à jour:
  - `docs/seo/04-intent-map-content-backlog.md`
  - Items S7-S8 (1,2) marqués comme réalisés.

## 2026-02-22 - Wave 14 (SEO refresh candidates in Ops)

- Détection automatique des contenus à rafraîchir dans l'admin Ops:
  - `src/features/admin/seo-kpi.ts`
  - extraction de candidats refresh depuis `topPages` (focus pages blog)
  - critère initial: CTR faible sur impressions élevées
  - action recommandée dédiée ajoutée dans la checklist d'actions
- UI admin enrichie:
  - `app/admin/ops/page.tsx`
  - nouveau tableau "Candidats refresh contenu SEO" (page, impressions, clics, CTR, raison)
- Tests:
  - `__tests__/seo-kpi.test.ts` enrichi (cas candidat refresh faible CTR)

## Prochaine wave recommandée

- Exécuter la connexion GSC/Bing et soumettre `sitemap.xml` en prod.
- Planifier l'appel régulier de `POST /api/cron/seo-search-metrics-sync` (daily/weekly).
- Mettre à jour les 4 contenus les plus performants (refresh title, intro, CTA, maillage).
- Ajouter une boucle de suivi post-refresh (J+14/J+30) pour mesurer l'impact des updates sur CTR/clics.
