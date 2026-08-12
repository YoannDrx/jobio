# 08 - Entitlements V2 & Croissance Pricing (prochain gros chantier)

Date: 2026-02-22  
Owner recommandé: Product + Engineering + Growth

## 1) Pourquoi c'est le prochain gros chantier

- Le socle actuel est solide (gating, copy, Stripe, SEO ops), mais les règles plan/features restent majoritairement codées en dur.
- Toute évolution tarifaire future (nouveau plan, feature add-on, promotion ciblée) demandera sinon des modifications dispersées.
- Le levier business principal n'est plus "corriger la cohérence", mais "accélérer la conversion et l'upsell sans régression produit".

## 2) Objectif cible

Créer un système d'entitlements piloté par données, connecté à Stripe et instrumenté conversion, pour faire évoluer Free/Pro/Ultra rapidement et en sécurité.

## 3) Scope du chantier

## Phase A - Entitlements data-driven (Semaine 1-2)

1. Créer un modèle source de vérité des droits:
   - plan
   - version de plan
   - feature key
   - limite numérique / booléenne
2. Exposer un read model unique côté app (remplace la logique dispersée).
3. Ajouter un mode "plan versionné" pour rollout progressif.
4. Prévoir fallback robuste si lecture DB indisponible.

Livrables:

- schéma DB + migration
- couche `entitlements` serveur
- tests unitaires et tests d'intégration gating

## Phase B - Stripe sync & anti-dérive automatique (Semaine 2-3)

1. Générer un diff automatique:
   - entitlements internes
   - prix/produits Stripe live
2. Ajouter un script de vérification pré-release.
3. Ajouter des guardrails CI sur les IDs Stripe critiques.
4. Normaliser metadata Stripe (`plan`, `billing`, `version`).

Livrables:

- script `pricing:verify`
- rapport diff machine-readable
- doc runbook mise à jour

## Phase C - Funnel conversion & expérimentation (Semaine 3-5)

1. Instrumenter le funnel complet:
   - vue pricing
   - clic CTA plan
   - tentative feature lockée
   - checkout démarré
   - abonnement actif
2. Déployer A/B tests:
   - copy pricing
   - ordre des bénéfices
   - nudges contextuels
3. Mesurer impact par plan et par segment utilisateur.

Livrables:

- dashboard conversion Free -> Pro -> Ultra
- plan d'expérimentation 4 semaines
- framework d'arrêt/rollback d'expérience

## Phase D - Upsell in-product intelligent (Semaine 4-6)

1. Remplacer les nudges statiques par nudges contextuels (usage + valeur).
2. Ajouter pages d'upgrade par feature (one intent, one CTA).
3. Ajouter "reason-aware paywall" (pourquoi ça bloque + valeur débloquée).
4. Optimiser le parcours post-upgrade (activation immédiate de la feature).

Livrables:

- composants paywall/nudge unifiés
- parcours upgrade contextualisé
- tests E2E critiques upgrade

## 4) KPIs de pilotage

- Taux de conversion Free -> Pro
- Taux de conversion Pro -> Ultra
- Taux d'activation J+7 post-upgrade
- Paywall hit -> upgrade rate
- Churn M+1 par plan
- ARPA par plan

## 5) Risques & garde-fous

- Risque: régression d'accès feature.
  - Garde-fou: tests d'entitlements exhaustifs + matrice snapshot.
- Risque: dérive Stripe / app.
  - Garde-fou: diff auto + check CI bloquant.
- Risque: baisse conversion suite à expérimentation.
  - Garde-fou: feature flags + kill switch + monitor temps réel.

## 6) Définition de done

- Toute règle d'accès plan/feature provient d'une seule source versionnée.
- Stripe et app sont vérifiés automatiquement avant release.
- Funnel conversion est visible en temps réel.
- Au moins 2 cycles d'expérimentation terminés avec décisions data-driven.
