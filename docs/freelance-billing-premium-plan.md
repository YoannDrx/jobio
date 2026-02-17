# Freelance Billing Premium Plan

Date: 2026-02-16
Owner: Product + Engineering

## Objectif produit

Construire un espace Freelance Billing premium (inspiré des standards Tiime/Abby) avec:

- UX rapide et intuitive pour créer, éditer, émettre et suivre devis/factures.
- Prévisualisation live du document (style PDF A4) éditable par interaction directe.
- CRM client enrichi (pro/particulier, préremplissage SIREN/SIRET, contacts, notes).
- Pilotage legal/compliance (mentions, statuts juridiques, URSSAF, historique d'audit).
- Segmentation plan (free/pro/ultra) et parcours d'upgrade clairs.

## Etat actuel

- [x] Espace Freelance avec sidebar dédiée et pages coeur (clients, devis, factures, paiements, registres, settings, insights, logs).
- [x] Personnalisation documents (logo, couleurs, toggles d'affichage, footer).
- [x] Moteur de rendu HTML/PDF pour devis/factures/avoirs.
- [x] Conformité statut/regime (presets, checklist légale, déclarations).
- [x] Quotas plan sur objets facturation (clients, devis, factures, catalogue).
- [x] Gating premium initial (prévision IA, exports avancés UI, garde-fou backend IA).

## Delta demandé (toi)

- Sidebar: groupes ouverts par défaut, structure inspirée Tiime, actions rapides en bas, Command+K visible.
- Création facture: UX studio live preview A4 + edition contextuelle via side panel.
- Client creation: flow par onglets (Informations/Contacts/Notes), type pro/particulier, recherche SIREN/SIRET.
- Vue listes: toggle tableau/cards, actions rapides par ligne (icones + menu 3 points), statuts fluides.
- Dépenses: section dédiée (factures, notes de frais, trajets).
- UI premium: bords plus doux, palette plus soft/pastel, hiérarchie visuelle plus forte.
- Freelance Settings: labels explicites + infobulles, clarification statut vs forme juridique,
  autocomplete adresse, sélecteurs pays/téléphone, upload logo, preview live template A4.

## Backlog exécutable détaillé

### Epic A - Navigation & Information Architecture

- [x] BIL-A01 - Ouvrir tous les groupes sidebar Freelance par défaut.
- [x] BIL-A02 - Ajouter Command+K dédié dans la sidebar Freelance.
- [x] BIL-A03 - Ajouter actions rapides en bas sidebar (facture, devis, client).
- [x] BIL-A04 - Réorganiser sidebar en groupes: Pilotage, Facturation, Dépenses, Configuration.
- [x] BIL-A05 - Ajouter pages Dépenses placeholder: factures, notes de frais, trajets.
- [ ] BIL-A06 - Ajouter état "raccourcis favoris" personnalisable utilisateur.
- [ ] BIL-A07 - Ajouter compteurs contextuels sidebar (ex: factures en retard, devis à valider).

### Epic B - Client CRM Premium

- [x] BIL-B01 - Refonte UI création client en modal multi-onglets.
- [x] BIL-B02 - Choix type client Professionnel/Particulier.
- [x] BIL-B03 - Recherche entreprise via API publique (nom/SIREN/SIRET) + préremplissage.
- [x] BIL-B04 - Ajouter section contact principal (nom/prénom/fonction/mail/téléphone).
- [x] BIL-B05 - Ajouter notes client et métadonnée "inclure cette adresse lors des envois".
- [x] BIL-B06 - Ajouter vue clients tableau/cards.
- [x] BIL-B07 - Ajouter KPI client par ligne (facturé/encaissé/encours/statut).
- [ ] BIL-B08 - Ajouter modèle `BillingClientContact` pour multi-contacts persistés.
- [ ] BIL-B09 - Ajouter persistance explicite du toggle "inclure dans envoi mail".
- [ ] BIL-B10 - Ajouter edition client inline (pas seulement création/archivage).

### Epic C - Invoice & Quote Studio (core UX)

- [ ] BIL-C01 - Créer composant `BillingDocumentStudio` commun (devis/facture).
- [x] BIL-C02 - Layout studio facture: preview A4 center + panneau options droit + CTA.
- [x] BIL-C03 - Preview facture live synchronisé au formulaire sans refresh.
- [x] BIL-C04 - Clic sur bloc preview => focus section d'édition correspondante.
- [ ] BIL-C05 - Palette options document: type, langue, affichage champs, conditions, champs libres.
- [x] BIL-C06 - Inline edition lignes (description, quantite, TVA, montant) depuis preview facture.
- [x] BIL-C06b - Champs éditables preview en style pointillé (fond blanc, sans radius).
- [x] BIL-C06c - Lignes facture étendues: Qté + Unité (select) + Prix unitaire + TVA + Montant HT.
- [ ] BIL-C07 - Support logo émetteur draggable + resize dans preview.
- [ ] BIL-C08 - Sauvegarde brouillon + émission finale depuis le studio.
- [ ] BIL-C09 - Réutiliser studio pour edition d'une facture/devis existant.
- [ ] BIL-C10 - Ajouter fallback mobile (édition full-form sans preview complexe).

### Epic D - Listes, statuts, actions rapides par ligne

- [ ] BIL-D01 - Ajouter toggle tableau/cards sur devis.
- [ ] BIL-D02 - Ajouter toggle tableau/cards sur factures.
- [ ] BIL-D03 - Remplacer boutons texte actions par icones standardisées.
- [ ] BIL-D04 - Menu 3 points devis: dupliquer, annuler, supprimer.
- [x] BIL-D05 - Menu 3 points factures: dupliquer, annuler, supprimer.
- [x] BIL-D05b - Suppression facture en mode owner override (même émise/payée), journalisée.
- [ ] BIL-D06 - Ajouter action "ajouter au registre" depuis lignes documents.
- [ ] BIL-D07 - Ajouter action "matcher" (préparation rapprochement dépenses).
- [ ] BIL-D08 - Uniformiser machine de statuts: brouillon -> envoyé/émis -> payé/clos.
- [ ] BIL-D09 - Ajouter transitions bulk (sélection multiple) sur listes.

### Epic J - Freelance Settings UX & fiabilité profil

- [x] BIL-J01 - Ajouter labels explicites sur tous les champs sensibles (URSSAF, délais, pénalités, indemnité).
- [x] BIL-J02 - Ajouter infobulles sur champs métier ambigus.
- [x] BIL-J03 - Clarifier statut freelance vs forme juridique (select + explication).
- [x] BIL-J04 - Ajouter autocomplete adresse FR et application rapide.
- [x] BIL-J05 - Remplacer code pays libre par select de pays.
- [x] BIL-J06 - Ajouter saisie téléphone avec indicatif + drapeau.
- [x] BIL-J07 - Réduire largeur perçue des pickers couleur (inputs compacts).
- [x] BIL-J08 - Ajouter upload logo (en plus de l'URL).
- [x] BIL-J09 - Ajouter preview live A4 du rendu facture dans settings.
- [ ] BIL-J10 - Ajouter preview PDF serveur "réel" (rendu API) sans document existant.
- [x] BIL-J11 - Upload logo robuste sans token Blob (fallback local auto + traçabilité dev).

### Epic E - Dépenses (phase fondation)

- [x] BIL-E01 - Créer les routes/pages Dépenses dans l'espace Freelance.
- [ ] BIL-E02 - Modèle Prisma dépenses: `ExpenseInvoice`, `ExpenseNote`, `ExpenseTrip`.
- [ ] BIL-E03 - CRUD factures dépenses + upload justificatif.
- [ ] BIL-E04 - CRUD notes de frais + catégories + TVA récupérable.
- [ ] BIL-E05 - CRUD trajets + barème kilométrique.
- [ ] BIL-E06 - Matching dépenses <-> paiements sortants.
- [ ] BIL-E07 - Exports dépenses comptables (CSV + journal).

### Epic F - Compliance, légal, fiabilité

- [x] BIL-F01 - Presets statut/regime + checklist conformité.
- [x] BIL-F02 - Mentions TVA / art 293B dans rendu document.
- [x] BIL-F03 - Gating plan sur opérations facturation clés.
- [ ] BIL-F04 - Guardrails d'édition rétroactive (audit enrichi: avant/après par champ).
- [ ] BIL-F05 - Verrouillage des documents émis avec flow d'avoir/annulation tracé.
- [ ] BIL-F06 - Export package conformité (audit + journaux + metadata légales).

### Epic G - Premium visual design system

- [ ] BIL-G01 - Définir tokens Freelance (palette pastel, radius, borders, ombres, spacing).
- [ ] BIL-G02 - Appliquer tokens sur sidebar, cards, tables, dialogs.
- [ ] BIL-G03 - Réviser micro-interactions (hover, focus, confirmation).
- [ ] BIL-G04 - Accessibilité: contrastes, tab order, labels, states.
- [ ] BIL-G05 - Harmoniser typographie et densité (desktop + mobile).

### Epic H - IA produit (facturation)

- [x] BIL-H01 - Prévision IA 90j (CA facturé/encaissé, risques, reco).
- [ ] BIL-H02 - Simulateur de scénario (optimiste / réaliste / prudent).
- [ ] BIL-H03 - Assistant de relance IA ciblé sur factures en retard.
- [ ] BIL-H04 - Scoring risque client (retard moyen, encours, fréquence retard).

### Epic I - QA & non-régression

- [x] BIL-I01 - Tests unitaires maths/rendu/compliance/quotas.
- [x] BIL-I02 - E2E devis -> facture -> paiement.
- [ ] BIL-I03 - E2E création client (pro + préfill SIREN).
- [ ] BIL-I04 - E2E studio facture (édition via preview).
- [ ] BIL-I05 - E2E actions ligne (icones + menu 3 points).

## Plan d'exécution recommandé

### Vague 1 (en cours)

- Navigation premium + CRM client de base + quotas plan.
- Done: A01-A05, B01-B07, F03.

### Vague 2 (prochaine)

- Studio facture/devis live preview éditable (Epic C).
- Menus actions avancées et vues cards/table sur devis/factures (Epic D partiel).

### Vague 3

- Backend dépenses complet (Epic E) + matching.
- Hardening compliance avancée (F04-F06).

### Vague 4

- Polish design system premium (Epic G) + IA avancée (H02-H04).

## Risques et arbitrages

- Studio preview interactif est la partie la plus coûteuse UI; prioriser facture puis réutiliser pour devis.
- Multi-contacts client nécessite extension Prisma dédiée pour éviter la dette (B08).
- Dépenses + matching dépendra du modèle comptable cible (rapprochement manuel vs semi-automatique).

## Definition of Done (DoD) cible

- Flux principal stable: client -> devis -> facture -> paiement -> registre.
- Edition live document accessible desktop/mobile.
- Chaque liste supporte table/cards + actions rapides + menu 3 points.
- Gating plans cohérent UI + backend.
- Tests unitaires + E2E couvrant les parcours premium critiques.
