# Extraction du prototype Administration freelance

Date de décision : 17 juillet 2026.

Le prototype Administration freelance n'est pas un second produit. Les patterns
retenus sont absorbés par Jobio uniquement lorsqu'ils renforcent le workflow
commercial V1. Les données de démonstration, devis, contrats, PDF, signatures et
fonctions de facturation du prototype ne sont pas importés.

## Tickets de consolidation

| Ticket      | Pattern retenu                                              | État dans Jobio      | Preuve d'implémentation                                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AF-JB-001` | Prochaine action avant les métriques                        | Fermé                | `TodayPriorities` agrège les relances et opportunités, les ordonne puis limite la surface à trois actions dans `src/features/missions/components/today/today-priorities.tsx`.                                   |
| `AF-JB-002` | Recherche transversale et accès rapide au contexte          | Fermé                | `AppCommand` filtre les routes avec le manifeste serveur, recherche missions et contacts, puis ouvre leurs deep-links dans `app/job/_navigation/app-command.tsx`.                                               |
| `AF-JB-003` | Fiche contact avec contexte humain et prochaine interaction | Fermé                | `ContactDetailSheet` réunit relation, missions, interactions et prochaine action dans `src/features/contacts/components/contact-detail-sheet.tsx`.                                                              |
| `AF-JB-004` | Statut accessible par texte et couleur                      | Fermé sur le cœur V1 | Les priorités, missions et contacts associent leurs couleurs à un libellé explicite ; la couleur seule n'est pas l'information.                                                                                 |
| `AF-JB-005` | Devis, contrats et structure documentaire                   | Différé              | `freelanceAdmin` reste `hidden` dans `src/config/product-features.ts`. Une réactivation exige des entretiens utilisateurs, un périmètre séparé et des tests d'autorisations ; elle ne fait pas partie de la V1. |

## Contrat de non-régression

- `/freelance` reste bloqué pour les nouveaux utilisateurs par le manifeste.
- Aujourd'hui conserve au maximum trois priorités.
- La palette n'affiche aucune route `hidden`.
- Les résultats de recherche ouvrent le bon contexte mission/contact.
- Les notes de contact et les données documentaires ne sont jamais envoyées à
  l'analytics.
- Aucun fichier ou enregistrement de démonstration du prototype n'est copié dans
  Jobio.

## Sortie

L'extraction est complète pour le périmètre V1. Le dépôt Administration freelance
peut être archivé après publication de sa dernière branche de référence. Le ticket
`AF-JB-005` reste une décision produit différée, pas une fonctionnalité incomplète.
