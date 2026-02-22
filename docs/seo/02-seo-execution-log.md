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

## Prochaine wave recommandée

- Exécuter la connexion GSC/Bing et soumettre `sitemap.xml`.
- Publier 2 premiers contenus du backlog (S1-S2).
- Ajouter un module "ressources liées" partagé sur blog/docs/features.
