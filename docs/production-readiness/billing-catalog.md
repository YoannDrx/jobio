# Catalogue commercial et Stripe — Jobio v1

Dernière mise à jour : 10 août 2026

Source de vérité exécutable : `src/lib/stripe/billing-catalog.ts`
Statut live : **catalogue v1 synchronisé et contrôlé — transactions payantes live encore à prouver**

## État externe constaté le 10 août 2026

Le catalogue v1 est synchronisé en test et en live. Le contrôle live strict confirme sans erreur ni avertissement : Pro à `1900` centimes/mois et `19000` centimes/an, trois programmes à `3900` centimes, lookup keys versionnées, `tax_behavior=exclusive`, métadonnées, descriptions et images attendues. L’ancien produit Jobio à 9,99 €/99 € a été archivé après bascule ; le dry-run suivant ne détecte plus aucun produit Jobio obsolète.

Les entitlements Free/Pro v2 sont appliqués en production sans dérive DB. Des sessions Checkout live sans encaissement ont prouvé la résolution des cinq nouveaux Price et le portail Jobio live a été créé et ouvert avec un client temporaire. Les parcours sandbox ont reçu des webhooks signés réels sans backlog.

Le compte Stripe est partagé avec d’autres services de la même entreprise individuelle. Ce n’est pas un blocage technique : les objets Jobio sont isolés par `metadata.app=jobio`, SKU et lookup keys, et le synchroniseur refuse d’archiver les produits des autres applications. En revanche, branding, identité légale, relevés et certains réglages restent globaux au compte Stripe ; un compte Stripe séparé est recommandé à terme si Jobio doit avoir une marque, une comptabilité, une équipe ou une entité juridique distinctes.

La production contient un abonnement Ultra historique réel. Il reste fermé à toute nouvelle souscription et absent du pricing public, mais sa release et ses droits ne sont ni supprimés ni migrés automatiquement.

## Offres applicatives

| Limite                                |                              Free |                         Pro |
| ------------------------------------- | --------------------------------: | --------------------------: |
| Prix                                  |                               0 € | 19 € HT/mois ou 190 € HT/an |
| Essai                                 | 14 jours Pro sans carte, une fois |      sans objet après achat |
| Missions actives                      |                                15 |          illimité, fair use |
| Positionnements                       |                                 2 |                          10 |
| Contacts                              |                                30 |                       1 000 |
| Plateformes                           |                                 3 |          illimité, fair use |
| Entreprises                           |                                10 |                         500 |
| Requêtes IA / mois                    |                                 5 |                         100 |
| CV                                    |                        1, Classic |          20, tous templates |
| ATS / Coach / traduction / réécriture |                               non |                         oui |
| Relances                              |                         manuelles |                automatiques |
| Séquences                             |                                 0 |                          20 |
| Templates                             |                                 3 |                         100 |
| Historique analytics                  |                          30 jours |                    illimité |
| Clients                               |                                 3 |                    illimité |
| Devis                                 |                                 5 |                    illimité |
| Factures                              |                                 5 |                    illimité |
| Catalogue facturation                 |                                 5 |                    illimité |
| Récurrences actives                   |                                 0 |                          50 |
| Export et suppression                 |                            inclus |                      inclus |

Les données dépassant les limites Free restent lisibles après essai ou résiliation ; seules les nouvelles créations sont refusées. Free n’a aucun Product ni Price Stripe.

## Produits Stripe cibles

### Jobio Pro

- Nom : `Jobio Pro`
- SKU : `jobio_pro`
- Description : « Le cockpit tout-en-un des freelances tech : prospection, CRM, CV IA, relances, analytics et gestion d’activité. »
- Image : `https://jobio.fr/images/stripe/jobio-pro.png`, PNG 1024×1024.
- Statement descriptor : `JOBIO`.
- Métadonnées Product et Price : `app=jobio`, `sku=jobio_pro`, `plan=pro`, `catalog_version=1`.
- Mensuel : `1900 eur`, `month`, `tax_behavior=exclusive`, lookup `jobio_pro_monthly_v1`.
- Annuel : `19000 eur`, `year`, `tax_behavior=exclusive`, lookup `jobio_pro_yearly_v1`.

### Programmes LinkedIn à vie

| Slug applicatif       | Nom                                | Lookup key / SKU                |                          Prix | Image                            |
| --------------------- | ---------------------------------- | ------------------------------- | ----------------------------: | -------------------------------- |
| `attirer-clients`     | LinkedIn — Attirer des clients     | `linkedin_attirer_clients_v1`   | 3 900 centimes EUR HT, unique | `linkedin-attirer-clients.png`   |
| `personal-branding`   | LinkedIn — Personal branding       | `linkedin_personal_branding_v1` | 3 900 centimes EUR HT, unique | `linkedin-personal-branding.png` |
| `exploser-croissance` | LinkedIn — Accélérer sa croissance | `linkedin_croissance_v1`        | 3 900 centimes EUR HT, unique | `linkedin-croissance.png`        |

Métadonnées : `app=jobio`, `type=linkedin_program`, `slug`, `sku`, `catalog_version=1`. Le programme d’introduction gratuit n’existe que dans Jobio et ne doit jamais être créé dans Stripe.

## Procédure de synchronisation

1. Exporter une clé restreinte au catalogue du mode visé.
2. Audit test sans écriture : `pnpm stripe:catalog:sync`.
3. Appliquer en test : `pnpm stripe:catalog:sync -- --apply`.
4. Copier les Price IDs retournés dans les variables test.
5. Vérifier le catalogue et les entitlements : `pnpm pricing:verify -- --strict`.
6. Exécuter les scénarios checkout/webhook test.
7. Audit live : `pnpm stripe:catalog:sync -- --live`.
8. Après double contrôle humain, appliquer : `pnpm stripe:catalog:sync -- --live --apply`.
9. Copier les Price IDs live, exécuter le preflight, puis deux achats live remboursés.

État au 10 août 2026 : étapes 1 à 8 validées en sandbox et en live. Les variables Vercel Production pointent vers les nouveaux Price, le portail Jobio est actif et l’ancien catalogue Jobio est archivé. L’étape 9 reste bloquée par la validation comptable du régime de TVA et par deux paiements live réels à rembourser. Le branding global du compte reste celui de Pressay/Yodev et doit être accepté comme tel ou isolé dans un compte Stripe Jobio distinct.

Le synchroniseur met à jour textes/images/métadonnées, réutilise uniquement un Price strictement identique et archive les Price actifs incompatibles avec le lookup key. Avant toute archive de produit historique Jobio/Ultra, il liste les abonnements et protège les produits encore utilisés par un abonnement actif, en essai, en retard, impayé ou suspendu. Un montant n’identifie jamais un plan.

## Checkout et portail

- Marché B2B, EUR, montants affichés HT.
- `automatic_tax.enabled=true`.
- Adresse de facturation et identifiant TVA collectés.
- Adresse et nom du client Stripe mis à jour depuis Checkout.
- Un seul abonnement actif/trialing/past_due/unpaid/paused par client.
- Aucun trial Stripe : l’essai est géré dans Jobio ; Checkout facture immédiatement.
- Le portail doit autoriser factures, moyens de paiement, adresse/TVA, annulation fin de période et motif ; aucun changement de plan.

## Webhooks requis

| Événement                                                                 | Effet métier                                  | Idempotence / ordre                                    |
| ------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `checkout.session.completed`                                              | Achat programme ou synchronisation abonnement | ledger `StripeWebhookEvent`, session unique            |
| `checkout.session.async_payment_succeeded/async_payment_failed/expired`   | Finalise ou échoue un achat différé           | horodatage Stripe : l’événement le plus récent gagne   |
| `customer.subscription.created/updated/deleted/paused/resumed`            | état abonnement local                         | `stripeEventCreatedAt` refuse un événement plus ancien |
| `invoice.paid/payment_failed/payment_action_required/finalization_failed` | resynchronise l’abonnement concerné           | récupération de l’abonnement source                    |
| `charge.refunded`                                                         | accès révoqué après remboursement total       | un remboursement partiel conserve l’accès              |

Le ledger conserve statut, tentatives, type, live/test, objet Stripe, objet métier, payload minimal, réception, traitement, échec et dernière erreur. Les événements `FAILED` restent rejouables ; les événements `PROCESSED` sont ignorés comme doublons. `ProgramPurchase.stripeEventCreatedAt` empêche un événement checkout ou remboursement ancien d’écraser une décision d’accès plus récente. L’endpoint Stripe live Jobio est actif et abonné aux 14 événements de cette matrice ; le smoke sans encaissement est vert, mais le traitement d’un paiement et d’un remboursement live reste à prouver.

## Checklist live obligatoire

- [x] Compte reconnecté et clé live confirmée.
- [ ] Identité vendeur et régime de TVA confirmés par le comptable.
- [x] Tous les produits Jobio v1 actifs ont le bon nom, texte, image et statement descriptor.
- [x] Tous les Price Jobio v1 ont montant, devise, intervalle, lookup key, `exclusive` et métadonnées exacts.
- [x] Aucun doublon ni ancien tarif Jobio v1 vendable ; les droits Ultra historiques sont préservés.
- [x] Portail client Jobio configuré et URL de retour `https://jobio.fr`.
- [x] Endpoint webhook live, signature et événements sélectionnés.
- [ ] Mensuel, annuel, trois programmes, annulation, renouvellement, échec, remboursement et replay prouvés.
- [ ] Deux transactions live remboursées et accès restaurés/révoqués correctement.
- [ ] Backlog webhook nul et alertes actives.

Exception documentée : le Price/Product Ultra utilisé par l’abonnement historique peut être archivé pour empêcher toute nouvelle vente, mais l’abonnement et ses droits applicatifs doivent continuer à fonctionner. Toute synchronisation doit d’abord identifier les abonnements actifs liés aux objets à archiver.
