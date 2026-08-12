# Radar Missions — contrat produit et exploitation

Statut initial : **bêta contrôlée Pro / essai Pro**. L’import manuel reste utilisable sans automatisation. La surface canonique est `/job/opportunities`.

## Invariants produit

- Une `OpportunityListing` est une annonce découverte, pas une mission.
- Seule l’action humaine « Ajouter au pipeline » crée une `Mission`.
- La conversion s’exécute dans une transaction sérialisable et relie le match à une mission unique.
- Aucun message, ajout au pipeline ou candidature n’est automatique.
- Chaque annonce conserve sa source, ses dates, son URL canonique et sa provenance. Une explication de score n’est jamais présentée comme une donnée de l’annonce.
- LinkedIn n’est ni scrappé, ni piloté, ni modifié. Une alerte LinkedIn peut être transférée par email par son destinataire.

## Sources et configuration

| Source              | Configuration                                                                    | Activation                                                          |
| ------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| France Travail      | `FRANCE_TRAVAIL_CLIENT_ID`, `FRANCE_TRAVAIL_CLIENT_SECRET`, endpoints optionnels | API OAuth configurée                                                |
| Adzuna              | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`                                                | Après validation de la licence, de l’attribution et de la rétention |
| Jooble              | `JOOBLE_API_KEY`                                                                 | Après validation de la licence, de l’attribution et de la rétention |
| Alertes transférées | `OPPORTUNITY_INBOUND_DOMAIN`, MX Resend, `RESEND_WEBHOOK_SECRET`                 | Webhook signé `email.received` et domaine de réception validé       |
| Import manuel       | aucune                                                                           | Toujours disponible                                                 |

Un provider absent est marqué `SKIPPED/PROVIDER_NOT_CONFIGURED` sans faire échouer les autres sources. Chaque run conserve volumes, latence, curseur, statut et erreur normalisée.

## Traitement inbound

Le webhook signé ne contient pas le corps. Jobio récupère le message via `GET /emails/receiving/:id`, refuse les payloads supérieurs à 500 Ko, ignore les pièces jointes et ne persiste que le contenu normalisé de l’annonce. Le corps HTML/text brut n’est jamais écrit dans la base Jobio. À la date de cette implémentation, l’API Resend documente la lecture mais pas la suppression d’un email reçu : `rawPurgedAt` signifie donc « abandonné de la mémoire Jobio après normalisation », pas « effacé de l’infrastructure Resend ». La rétention côté Resend doit être contractualisée avant GA.

## Synchronisation

Le cron `/api/cron/opportunity-sync` est inclus dans l’orchestrateur quotidien signé. Il prend au maximum 50 veilles dont la dernière synchronisation date de plus de 20 heures, traite les providers séquentiellement pour borner la charge, puis met à jour `lastSyncedAt`. Les synchronisations manuelles sont limitées à trois par cinq minutes et par utilisateur.

## Sécurité et minimisation

- Toutes les actions utilisateur filtrent par `userId`.
- Les URLs manuelles doivent être HTTPS publiques ; la capture distante valide aussi chaque résolution DNS et chaque redirection, limite taille/type et impose un timeout.
- L’adresse inbound utilise un token UUID non devinable et n’expose aucun identifiant utilisateur.
- Les emails inconnus sont ignorés sans persistance de données personnelles.
- Le parsing inbound est déterministe en bêta : aucun contenu d’email non fiable n’est envoyé au modèle.

## Gates avant activation en production

1. Appliquer la migration `20260812130000_add_opportunity_radar` et vérifier son rollback sur une branche de staging.
2. Valider contractuellement l’affichage, l’attribution, les quotas et la conservation pour chaque provider activé.
3. Configurer le sous-domaine MX, le webhook signé et mesurer la rétention Resend.
4. Exécuter les E2E complets avec deux utilisateurs, une source réelle, un doublon multi-source, une panne provider et une annonce expirée.
5. Valider clavier, lecteur d’écran et responsive 390/768/1280/1440.
6. Observer sept crons consécutifs, un backlog nul et un digest réellement livré.
7. Réaliser le dogfood top 10 et atteindre le seuil de 70 % de résultats jugés pertinents ou conservés.

Tant que ces preuves ne sont pas attachées à la release candidate, `opportunityDiscovery` reste `beta` et Jobio reste NO-GO pour une promotion publique générale.
