# Gates d’activation publique

Ce registre empêche de confondre une implémentation technique avec une preuve
de production. Une date ne doit être renseignée dans Vercel qu’après dépôt du
rapport correspondant dans le dossier de la release candidate.

| Gate               | Preuve exigée                                                                                            |  Validité | État au 12 août 2026                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------- | --------: | --------------------------------------------------------- |
| Cœur produit GA    | Auth, Aujourd’hui, Pipeline, Relances, CV, Contacts, Notifications et Profils marqués `ga` après recette |        RC | Bloqué : modules encore `beta`                            |
| Juridique          | validation CGU, confidentialité, cookies, prospection B2B et sous-traitants                              |     365 j | Externe, non signée                                       |
| Vie privée         | export, suppression, rétention, opposition et analyse Radar/IA                                           |     365 j | Technique vérifiée ; revue externe manquante              |
| Comptabilité       | TVA, arrondis, numérotation, avoirs, FEC, Factur-X et inaltérabilité                                     |     365 j | Externe, non signée                                       |
| Sécurité           | revue sans critique/élevée non acceptée, SSRF, isolation et secrets                                      |      90 j | Tests SSRF/isolation verts ; revue indépendante manquante |
| PITR               | restauration datée et rétention d’au moins 168 h                                                         |      90 j | Restauration réelle verte ; rétention Neon = 6 h          |
| Stripe live        | abonnement et programme payés puis remboursés en live                                                    |      90 j | Flux test verts ; encaissement live non exécuté           |
| Navigateurs/mobile | Chrome, Firefox, WebKit et responsive ; Lighthouse mobile ≥ 85                                           |      30 j | 84 scénarios multi-moteurs verts ; Lighthouse mobile = 79 |
| Crons              | dernier run de chacun des 7 jours UTC consécutifs en succès                                              | glissante | Gate automatique rouge                                    |
| Webhooks           | backlog Stripe et Resend nul avec observation datée                                                      |       7 j | Preuve glissante manquante                                |
| Radar bêta         | France Travail réel, domaine Resend inbound vérifié, webhook `email.received` et licences datées         |        RC | Webhook vert ; domaine/credentials bloqués                |

Les variables de preuve sont documentées dans `.env-template`. Le gate complet
est `pnpm production:preflight`; les diagnostics isolés sont
`pnpm production:verify-crons`, `pnpm radar:preflight`,
`pnpm account:lifecycle:verify` et `pnpm radar:verify`.

Le GO n’est pas une décision implicite du code : il exige la présence des
rapports, le nom du responsable, la date, le périmètre et les éventuelles
acceptations de risque.
