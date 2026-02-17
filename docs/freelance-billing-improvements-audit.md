# Freelance Billing Improvements Audit

Date: 2026-02-16
Scope: espace `/freelance`

## Synthèse

Le module est fonctionnel (clients/devis/factures/paiements/rendus), mais plusieurs axes restent nécessaires pour atteindre un niveau premium Tiime/Abby-like: ergonomie studio document, action density, duplication de code, et montée en robustesse des workflows avancés.

## 1) UX/UI - constats et améliorations

### Navigation et architecture d'information

- [x][P0] Ouvrir les sections sidebar par défaut.
- [x][P0] Ajouter recherche rapide Command+K dans sidebar Freelance.
- [x][P1] Ajouter actions rapides persistantes en bas sidebar.
- [x][P1] Réorganiser la sidebar en groupes métier (Pilotage, Facturation, Dépenses, Configuration).
- [ ] [P1] Ajouter compteurs contextuels (retards, devis en attente) dans navigation.
- [ ] [P2] Ajouter raccourcis personnalisables utilisateur.

### Panneaux latéraux (right side panels)

- [x][P0] Remplacer popins/dialogs par side panel pour clients/devis/factures/paiements.
- [x][P0] Réduire largeur (environ 50% viewport desktop) et augmenter le padding.
- [x][P1] Uniformiser style via composant partagé `FreelanceSideSheet`.
- [x][P1] Forcer CTA footer en ligne (`Annuler` / `Créer`) dans les side panels.
- [ ] [P1] Ajouter sections visuelles plus marquées (cards internes, séparateurs, sticky CTA).
- [ ] [P2] Ajouter animations de transition plus douces et feedbacks visuels de validation.

### Clients

- [x][P0] Flow création multi-onglets Informations/Contacts/Notes.
- [x][P0] Support type pro/particulier.
- [x][P0] Recherche nom/SIREN/SIRET avec bouton `Appliquer`.
- [x][P1] Vue tableau/cards + KPI facturé/encaissé/encours/statut.
- [x][P1] Actions client enrichies: archivage + suppression définitive (avec garde-fous métier).
- [ ] [P0] Persistance multi-contacts via modèle dédié (aujourd'hui contact principal seulement).
- [ ] [P1] Edition client complète (actuellement création + archivage).

### Devis / Factures

- [x][P1] Préselection client via actions rapides sidebar.
- [x][P0] Invoice Studio facture: preview A4 live éditable + panneau d’édition synchronisé.
- [x][P1] Champs éditables preview en pointillés (fond blanc, sans radius).
- [x][P1] Grille lignes facture enrichie (Qté + Unité + PU + TVA + Montant HT).
- [ ] [P0] Unifier l'expérience creation/edition dans un même studio.
- [x][P1] Ajouter menu actions `...` sur factures (dupliquer, annuler, supprimer).
- [x][P1] Owner override suppression facture (tous statuts) avec audit metadata.
- [ ] [P1] Ajouter toggle tableau/cards sur devis/factures.

### Freelance Settings

- [x][P0] Ajouter labels explicites et infobulles sur champs métier (URSSAF, délais, pénalités, indemnité).
- [x][P0] Clarifier statut vs forme juridique (select forme juridique + mode personnalisé).
- [x][P1] Ajouter autocomplete adresse FR avec remplissage postal/ville.
- [x][P1] Remplacer code pays libre par select.
- [x][P1] Ajouter téléphone avec indicatif + drapeau.
- [x][P1] Rendre pickers de couleurs compacts.
- [x][P1] Ajouter upload logo + URL.
- [x][P0] Ajouter preview live A4 du template facture dans les settings.
- [x][P1] Sécuriser upload logo sans Blob token (fallback local `public/uploads`).
- [ ] [P1] Ajouter preview PDF serveur du template (sans document existant).

## 2) Performance - constats et améliorations

- [ ] [P0] Réduire appels redondants sur pages devis/factures (chargement clients/catalogue/documents en parallèle + cache local par session).
- [ ] [P1] Optimiser rendering des listes larges (pagination serveur stricte + virtualisation si >500).
- [ ] [P1] Mémoriser les résultats SIREN/SIRET côté client (debounce + cache TTL court).
- [ ] [P2] Précharger rendu preview document à la volée pendant édition (améliore perception de latence).

## 3) Refactor - constats et améliorations

- [ ] [P0] Extraire un `BillingDocumentStudio` commun (devis/facture) pour supprimer duplication massive.
- [ ] [P1] Extraire hooks `useBillingClients`, `useBillingCatalog`, `useBillingDocuments`.
- [ ] [P1] Extraire composants réutilisables: `DocumentLinesEditor`, `DocumentTotals`, `DocumentActionsBar`.
- [ ] [P1] Centraliser mapping statuts/actions par type document.
- [ ] [P2] Ajouter tests de snapshot UI sur composants premium critiques.

## 4) Fiabilité & conformité - constats et améliorations

- [x][P0] Quotas plan facturation backend + UI.
- [x][P0] Checklist conformité statut/régime + presets URSSAF.
- [ ] [P0] Durcir les règles d'édition rétroactive (trace before/after par champ sensible).
- [ ] [P1] Introduire verrouillage des documents émis + workflow d'avoir systématique.
- [ ] [P1] Export pack audit/compliance complet (logs + registres + metadata légales).

## 5) Nouvelles features - opportunités

- [x][P1] Prévision IA 90 jours (gated plan payant).
- [ ] [P1] Assistant de relance IA sur retards (template + timing recommandé).
- [ ] [P1] Dépenses v1 (factures fournisseurs, notes de frais, trajets) avec matching.
- [ ] [P2] Score risque client (retard moyen, encours, fréquence impayés).
- [ ] [P2] Scénarios prévisionnels (optimiste/réaliste/prudent).

## 6) Exécution en cours

### Déjà livré dans cette vague

- Sidebar premium remaniée + Command+K + actions rapides.
- Dépenses: routes de base intégrées à la navigation.
- Clients: flow création premium + recherche SIREN/SIRET + bouton appliquer.
- Panels: migration popins -> right side sheets + largeur/padding premium.

### Prochaines implémentations recommandées (ordre)

1. `BillingDocumentStudio` (preview live + édition contextuelle).
2. Menus actions `...` et mode cards/table sur devis/factures.
3. Modèle multi-contacts client + édition client complète.
4. Dépenses v1 persistées + matching comptable.
