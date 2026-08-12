# Roadbook produit et production — Jobio

Dernière mise à jour : 12 août 2026

Release candidate : `rc-2026-08-12.1`
Décision actuelle : **bêta contrôlée possible, activation publique générale NO-GO**

Ce document est le point d’entrée opérationnel de la release. L’audit détaillé
reste dans `functional-technical-audit.md`, les critères bloquants dans
`launch-gates.md` et la procédure de déploiement/rollback dans
`release-runbook.md`.

## Livré

### Produit et Radar Missions

- Suite complète conservée comme destination, avec promotion GA module par
  module et manifeste serveur comme autorité.
- Radar Missions sur `/job/opportunities`, séparé du pipeline.
- Veilles, import manuel URL/texte, alertes inbound, providers France Travail,
  Adzuna et Jooble désactivés tant que leurs credentials/licences manquent.
- Normalisation, provenance, déduplication multi-source, expiration, scoring
  explicable et filtres déterministes avant IA.
- Sauvegarde, écartement motivé et conversion humaine transactionnelle vers une
  mission, sans candidature ni communication automatique.
- Top 3 dans Aujourd’hui, digest quotidien idempotent et cron de
  synchronisation observable.
- Webhook Resend signé pour `email.received`, destinataires tokenisés et purge
  du message brut après normalisation ; pièces jointes refusées en V1.
- Extension Chrome retirée de LinkedIn, domaine corrigé vers `jobio.fr` et
  route corrigée vers `/job/pipeline`.

### Sécurité, données et IA

- Capture URL protégée contre SSRF : HTTPS public, DNS, réseaux privés,
  redirections, taille, MIME et timeout contrôlés avec `upfetch`.
- Quota IA atomique avec libération idempotente en cas d’échec fournisseur.
- Ledger IA commun : modèle, tokens, coût estimé, latence, statut, erreur,
  request ID et contexte fonctionnel.
- Export utilisateur portable et suppression transversale Radar/IA/fichiers.
- Ownership des assets, validation par signature binaire et suppression des
  fichiers locaux ou externes.
- Rétention anti-abus de l’essai Pro pseudonymisée et bornée.
- Métriques admin fictives remplacées par des agrégats PostgreSQL.
- Recommandations statistiques basées sur les événements métier datés et un
  volume minimal, sans formulation causale trompeuse.

### Fiabilité et exploitation

- Client Prisma partagé par processus, pool borné et retry unique réservé aux
  lectures sûres sur `P1001`/`P1017`.
- Prisma retiré du proxy et contrôle automatique des traces Next.js.
- Preflight production, preuve de sept jours de crons, readiness Radar, smoke
  paiement/remboursement Stripe et vérification du cycle de vie du compte.
- Migrations Radar, digest, rétention et ownership appliquées sans reset : les
  bases connectées contenaient 22 utilisateurs et 9 missions avant intervention.
- Restauration PITR Neon exécutée avec succès.
- Webhook Resend de production étendu à `email.received`.

## Preuves de la release candidate

| Contrôle                     | Résultat                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------- |
| TypeScript                   | Vert                                                                            |
| ESLint complet               | Vert                                                                            |
| Prisma validate              | Vert                                                                            |
| Vitest                       | 72 fichiers, 475 tests verts                                                    |
| E2E applicatifs              | 84 scénarios validés sur Chromium, Firefox et WebKit, sans retry                |
| Accessibilité Radar          | Axe sans violation sur 390/768/1280/1440                                        |
| Build Next.js                | 160 pages générées                                                              |
| Traces serveur               | 138 traces, maximum 52 Mio/379 fichiers, aucun avertissement Prisma             |
| Preflight statique           | 28/28                                                                           |
| Audit dépendances production | 0 critique/élevée/modérée, 2 faibles suivies                                    |
| Cycle de vie du compte       | Export, cascades et rétention vérifiés                                          |
| Radar métier                 | Isolation, déduplication, expiration, conversion et digest concurrents vérifiés |

La campagne E2E complète initiale a produit 83/84 en 14,2 minutes : l’audit Axe
Firefox multi-résolution a uniquement atteint le timeout global de 70 secondes.
Le scénario, déclaré lent en raison de ses cinq scans complets, a ensuite passé
Firefox isolément en 26,6 secondes sans retry.

## Reste à faire avant activation publique

| Priorité | Gate                 | Prochaine action                                                                                                | Preuve attendue                                   |
| -------- | -------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| P0       | Statuts GA cœur      | Recetter Auth, Aujourd’hui, Pipeline, Contacts, Relances, CV/Profils et Notifications puis joindre les rapports | Modules cœur `ga`, Radar maintenu `beta`          |
| P0       | Juridique/vie privée | Faire valider CGU, confidentialité, cookies, prospection B2B, sous-traitants, export et rétention               | Avis daté et signé, valable 365 jours             |
| P0       | Comptabilité         | Faire auditer TVA, arrondis, numérotation, avoirs, FEC, Factur-X et inaltérabilité                              | Avis daté et signé, aucune promesse non certifiée |
| P0       | Sécurité             | Faire réaliser une revue indépendante incluant SSRF, isolation, secrets et prompt injection                     | Rapport sans critique/élevée non acceptée         |
| P0       | PITR                 | Porter la rétention Neon de 6 h à au moins 168 h puis refaire une restauration                                  | Rapport daté avec RPO/RTO                         |
| P0       | Stripe live          | Exécuter un abonnement et un programme réellement payés puis remboursés                                         | IDs Stripe, ledger et droits réconciliés          |
| P0       | Crons                | Obtenir sept journées UTC consécutives avec chaque tâche en succès                                              | `pnpm production:verify-crons` vert               |
| P0       | Webhooks             | Observer Stripe et Resend pendant sept jours avec backlog nul                                                   | Rapport daté et volumes                           |
| P0       | Mobile               | Porter Lighthouse mobile de 79 à au moins 85                                                                    | Rapport production valable 30 jours               |
| P1       | Radar France Travail | Obtenir les credentials et confirmer les règles d’attribution/conservation                                      | Run API réel et source visible dans l’UI          |
| P1       | Radar inbound        | Libérer/acheter un domaine Resend, configurer le sous-domaine et les MX                                         | Domaine vérifié, email inbound réel purgé         |
| P1       | Providers            | Valider licences, quotas, attribution et rétention Adzuna/Jooble avant activation                               | Fiche fournisseur datée par provider              |
| P1       | IA live              | Observer modèle, coût et latence sur 100 % des appels pendant le dogfood                                        | Dashboard/rapport sans ligne incomplète           |
| P1       | Auth externe         | Rejouer OAuth, OTP, Resend et push réels en staging                                                             | E2E fournisseurs et révocation verts              |

## Séquence recommandée

1. Fusionner et déployer cette release candidate en staging.
2. Appliquer les migrations avec `prisma migrate deploy` et vérifier la dérive.
3. Exécuter `pnpm production:preflight:static`, `pnpm account:lifecycle:verify`
   et `pnpm radar:verify` sur l’environnement staging explicitement chargé.
4. Rejouer les E2E applicatifs et fournisseurs, puis Lighthouse.
5. Ouvrir le dogfood de sept jours et conserver les preuves crons/webhooks/IA.
6. Fermer les revues externes et le PITR 168 h.
7. Promouvoir uniquement les modules cœur prouvés en `ga`.
8. Exécuter `pnpm production:preflight`; le GO exige zéro erreur.

## Règles permanentes

- LinkedIn reste une source d’alertes transférées et une destination humaine :
  aucun scraping, injection dans la page ou automatisation de compte.
- Aucun résultat Radar n’entre dans le pipeline sans validation humaine.
- Aucun message ou candidature n’est envoyé automatiquement.
- Une donnée générée par IA reste distinguée d’une donnée provenant de
  l’annonce et conserve son contexte de génération.
- Une gate externe ne doit jamais être contournée par une date ou une preuve
  fictive dans les variables de production.
