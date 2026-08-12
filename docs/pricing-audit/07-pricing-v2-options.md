# 07 - Pricing V2 (Options, impacts, recommandation)

Date: 2026-02-21
Contexte: Jobio est un produit multi-suite (prospection CRM + CV Studio IA + Freelance Billing).
Objectif: maximiser la conversion Free -> Pro tout en augmentant l'ARPU Ultra.

## 1) Hypotheses produit/commerciales

- Le "aha moment" principal est sur la prospection (pipeline + relances + export).
- Le "wow moment" est sur l'IA et le CV Studio (ATS + Coach).
- La valeur monetisable la plus forte est sur l'usage professionnel intensif (sequences, billing illimite, coach IA).

## 2) Option A - Conversion-first (recommandee)

### Positionnement prix

- Free: 0 EUR
- Pro: 9.99 EUR/mois, 99 EUR/an
- Ultra: 19.99 EUR/mois, 199 EUR/an

### Gating cle

- Free:
  - missions 15, profils 2, contacts 30, plateformes 3, entreprises 10
  - IA 5/mois
  - CV: 1 document, template Classic
  - pas d'ATS, pas de CV Coach, pas d'export CSV
  - pas de billing
- Pro:
  - prospection operationnelle (missions illimitees, 200 contacts, 10 plateformes)
  - IA 50/mois
  - CV: 10 docs, tous templates, ATS inclus
  - sequences 3, templates messages 20, relances auto
  - export CSV + billing borne (10 clients, 50 devis/factures)
- Ultra:
  - limites maximales (prospection + billing)
  - IA 999/mois
  - CV Coach IA inclus
  - sequences et templates messages illimites
  - support prioritaire

### Impact attendu

- Hausse conversion Free -> Pro grace a un Pro tres actionnable sans friction.
- Hausse ARPU via Ultra reserve aux usages experts (volume + coach IA + illimite).
- Bonne lisibilite marketing (3 paliers nets et simples).

## 3) Option B - Upsell agressif

### Positionnement prix

- Free: 0 EUR
- Pro: 12.99 EUR/mois, 129 EUR/an
- Ultra: 24.99 EUR/mois, 249 EUR/an

### Difference vs Option A

- Pro plus contraint: contacts 150, sequences 2, templates 15.
- Ultra conserve la pleine valeur.

### Impact attendu

- ARPU plus fort.
- Risque superieur de friction au passage Pro pour les freelances en debut de cycle.
- Recommande uniquement si traction inbound deja forte et churn bas.

## 4) Option C - Expansion grand public

### Positionnement prix

- Free: 0 EUR
- Pro: 7.99 EUR/mois, 79 EUR/an
- Ultra: 17.99 EUR/mois, 179 EUR/an

### Difference vs Option A

- Pro un peu plus permissif sur l'entree (contacts 250, templates 30).
- Ultra reste le palier expert.

### Impact attendu

- Conversion volume plus forte.
- ARPU plus faible.
- Pertinent si priorite: base utilisateurs rapide + upsell secondaire.

## 5) Recommandation finale

Choix recommande: Option A (Conversion-first).

Pourquoi:

- C'est l'equilibre le plus robuste entre accessibilite et monetisation.
- C'est deja aligne avec l'implementation actuelle et les plans Stripe Live verifies.
- Le cout de migration est minimal (pas de refonte lourde de gating).

## 6) Plan d'execution recommande (30 jours)

- Semaine 1:
  - figer le wording pricing (landing + billing + Stripe)
  - instrumenter les events (view pricing, click CTA, checkout, upgrade)
- Semaine 2:
  - lancer suivi cohortes Free -> Pro (J1/J7/J30)
  - lancer suivi usage limites (contacts, sequences, IA)
- Semaine 3:
  - ajuster nudges in-app sur limites atteintes
  - tester 2 variantes de copy Pro/Ultra
- Semaine 4:
  - arbitrer evolution prix (Option B/C partielle) selon donnees reelles

## 7) KPIs de pilotage

- Conversion visiteur -> signup
- Conversion Free -> Pro a 30 jours
- Conversion Pro -> Ultra a 60 jours
- MRR, ARPU, churn logo et churn revenu
- Usage median par limite cle (contacts, IA, templates, sequences)

## 8) Risques et garde-fous

- Risque: promesses marketing superieures au produit reel.
  - Garde-fou: checklist coherence obligatoire avant release pricing.
- Risque: gating trop strict sur Free -> activation faible.
  - Garde-fou: surveiller activation J7 et assouplir 1 ou 2 limites si necessaire.
- Risque: Ultra percu comme trop proche de Pro.
  - Garde-fou: maintenir des differenciateurs clairs (Coach IA, illimite, support prioritaire).
