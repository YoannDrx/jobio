# 03 - Runbook Search Console & Bing Webmaster

Date: 2026-02-22  
Owner recommandé: Growth + Engineering

## 1) Pré-requis

- Domaine principal en production: `https://jobio.fr`
- Accès admin:
  - Google Search Console
  - Bing Webmaster Tools
  - Vercel (pour vérifier les redirects/domaines)
- Endpoints SEO déjà en place:
  - `https://jobio.fr/sitemap.xml`
  - `https://jobio.fr/rss.xml`
  - `https://jobio.fr/robots.txt`

## 2) Google Search Console (GSC)

1. Ajouter une propriété `Domain` sur `jobio.fr` (pas uniquement URL prefix).
2. Vérifier la propriété via DNS (TXT record).
3. Soumettre le sitemap: `sitemap.xml`.
4. Vérifier que `rss.xml` est accessible et indexable (pas forcément soumis comme sitemap principal).
5. Ouvrir "Pages" -> contrôler:
   - pages indexées attendues
   - pages exclues non attendues
6. Contrôler les inspecteurs URL sur:
   - `/`
   - `/features`
   - `/docs`
   - `/blog`
   - `/contact`
7. Créer une annotation interne "SEO wave baseline - 2026-02-22".

## 3) Bing Webmaster Tools

1. Ajouter site `https://jobio.fr`.
2. Vérifier domaine (DNS recommandé).
3. Importer les settings GSC si proposé, sinon config manuelle.
4. Soumettre `https://jobio.fr/sitemap.xml`.
5. Vérifier le rapport Index Coverage:
   - pages valides
   - erreurs crawl
   - URLs bloquées par robots
6. Contrôler crawl sur pages piliers:
   - `/features`
   - `/docs`
   - `/blog`

## 4) Checklist hebdomadaire (30 min)

1. Requêtes:
   - top requêtes non-brand
   - requêtes en croissance
   - requêtes à fort volume mais CTR faible
2. Pages:
   - top pages SEO
   - pages en baisse de clics
   - nouvelles pages indexées
3. Qualité indexation:
   - nouvelles exclusions
   - erreurs server (`5xx`)
   - pages dupliquées ou canonical incohérente
4. Actions:
   - 1 action technique
   - 1 action contenu
   - 1 action maillage interne

## 5) Dashboard KPI minimal

- KPI acquisition:
  - clics organiques non-brand
  - impressions non-brand
  - CTR moyen non-brand
  - position moyenne des requêtes cibles
- KPI indexation:
  - pages publiques stratégiques indexées
  - pages privées indexées (doit rester à 0)
  - erreurs crawl critiques
- KPI conversion:
  - sessions SEO -> signup
  - signup SEO -> activation J+7

## 5.1) Injection des métriques dans l'admin Jobio

- Le module `/admin/ops` lit un snapshot JSON consolidé GSC/Bing.
- Deux modes supportés:
  - `SEO_SEARCH_METRICS_JSON`: payload JSON inline.
  - `SEO_SEARCH_METRICS_FILE`: chemin fichier JSON sur le serveur.
- Mode auto (recommandé):
  - `SEO_SEARCH_METRICS_ENDPOINT`: endpoint HTTPS qui expose le snapshot JSON.
  - `SEO_SEARCH_METRICS_BEARER_TOKEN`: token Bearer optionnel.
  - `SEO_SEARCH_METRICS_TIMEOUT_MS`: timeout fetch en ms (défaut 8000).
- Exemple de format:
  - `docs/seo/05-search-metrics-snapshot.example.json`

Checklist d'activation:
1. Générer un snapshot hebdo (current + previous) depuis vos exports GSC/Bing.
2. Alimenter `SEO_SEARCH_METRICS_JSON`, ou déposer le fichier (`SEO_SEARCH_METRICS_FILE`), ou brancher `SEO_SEARCH_METRICS_ENDPOINT`.
3. Vérifier `/admin/ops`:
   - statut "Configuré"
   - clics / impressions / CTR affichés
   - deltas période vs période visibles
4. Corriger immédiatement si statut "Invalide" (JSON malformé ou schéma non conforme).

## 6) Alertes opérationnelles (SLO SEO)

- Alerte P1:
  - une route privée (`/auth`, `/job`, `/freelance`, `/admin`) apparaît indexée
  - ou chute >30% des clics SEO non-brand semaine vs semaine
- Alerte P2:
  - augmentation continue des erreurs crawl pendant 2 semaines
  - ou baisse CTR >1.5 point sur pages piliers

## 7) Rituels et responsabilités

- Lundi (Growth): revue GSC + backlog d’actions.
- Mardi (Engineering): correctifs techniques SEO prioritaires.
- Jeudi (Content): publication/optimisation des pages ciblées.
- Vendredi (Produit): revue impact SEO -> signup -> activation.
