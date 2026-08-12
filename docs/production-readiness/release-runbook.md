# Runbook déploiement, rollback et incidents — Jobio

Dernière mise à jour : 10 août 2026

## Principes

- `jobio.fr` est canonique ; `www.jobio.fr` redirige en 308.
- Les fonctions Vercel sont épinglées à Paris (`cdg1`) ; vérifier à chaque déploiement que la configuration projet ne diverge pas.
- Aucun déploiement public si `pnpm production:preflight` échoue.
- La release publique exige que le périmètre cœur sélectionné soit `ga`. Les modules
  explicitement annoncés comme bêta contrôlée peuvent rester `beta`, à condition
  d'être isolés du parcours GA, correctement labellisés et couverts par leurs
  propres gates. Un module `internal` n'est jamais exposé au public.
- Les migrations sont forward-only. Un rollback applicatif ne doit jamais supposer qu’un schéma peut être supprimé.
- Production, preview et développement utilisent des DB, Redis, Stripe, Resend et clés IA séparés.
- Les droits Ultra historiques sont conservés ; aucune nouvelle souscription Ultra n’est autorisée.

## Matrice d’environnement

| Groupe       | Development             | Preview/Staging                | Production                             |
| ------------ | ----------------------- | ------------------------------ | -------------------------------------- |
| Domaine/Auth | localhost               | domaine preview stable         | `https://jobio.fr`                     |
| PostgreSQL   | DB locale dédiée        | projet staging UE + PITR       | projet production UE + PITR            |
| Redis        | instance locale         | instance staging UE            | instance production UE + alertes       |
| Stripe       | test                    | test isolé                     | live uniquement après gate             |
| Resend       | destinataires de test   | domaine/sandbox staging        | domaine Jobio SPF/DKIM/DMARC validé    |
| OpenAI       | clé limitée             | clé/projet staging avec budget | clé/projet production avec alertes     |
| PostHog      | désactivé ou projet dev | projet staging                 | projet UE prod, consentement préalable |
| VAPID        | paire locale            | paire staging                  | paire prod sauvegardée                 |

Les variables exigées sont listées dans `scripts/production-preflight.ts` et `.env-template`. Les informations légales ne doivent jamais être inventées : production échoue tant qu’elles ne sont pas renseignées.

## Préparation d’une release candidate

1. Geler le périmètre et créer un identifiant `rc-YYYY-MM-DD.N`.
2. Vérifier le diff, les migrations et l’absence de secret dans Git.
3. Installer exactement : `corepack enable && pnpm install --frozen-lockfile`.
4. Générer Prisma : `pnpm prisma:generate`.
5. Exécuter :
   - `pnpm security:audit`
   - `pnpm production:preflight:static`
   - `pnpm ts`
   - `pnpm lint:ci`
   - `pnpm format:check`
   - `pnpm test:ci`
   - `pnpm build`
   - `pnpm test:e2e:ci`
6. Déployer en staging sans réutiliser les secrets production.
7. Appliquer les migrations staging et contrôler les entitlements v2.
8. Exécuter les E2E externes Stripe test, Resend, OpenAI et push.
9. Exécuter Lighthouse mobile/desktop et la matrice 390/768/1280/1440 sur Chrome, Firefox et Safari.
10. Dogfood sept jours ; joindre les runs cron, erreurs, webhooks et résultats au dossier RC.

### État de la RC du 10 août 2026

- DB production sauvegardée par la branche Neon `backup-before-release-migration-20260810` (`br-young-tooth-agyhu199`).
- 45 migrations appliquées sur la production et la branche de validation isolée ; Free/Pro utilisent la release d’entitlements v2 et Ultra historique reste sur sa release v1.
- `CRON_SECRET` et VAPID sont renseignés en Production ; `BETTER_AUTH_URL` et `NEXT_PUBLIC_APP_URL` sont alignés sur `https://jobio.fr`.
- Domaine : apex actif, `www` → apex en 308.
- Vitest 72 fichiers/475 tests ; 84 scénarios applicatifs validés sur Chromium, Firefox et WebKit, sans retry, plus 4 E2E fournisseurs externes historiques.
- Smoke compte post-durcissement : 3/3 sur le compute Neon isolé explicitement forcé, sans retry.
- Webhook Resend actif pour les six événements de livraison ; un envoi livré a produit un webhook signé accepté en production.
- Webhook Stripe Jobio live actif avec les 14 événements requis ; catalogue v1, Price IDs Vercel et portail Jobio sont synchronisés et strictement conformes. L’ancien produit Jobio a été archivé sans toucher aux autres services du compte.
- Préflight statique : 28 contrôles verts. Le mode release bloque encore les
  modules cœur tant qu'ils ne sont pas promus `ga` avec leurs preuves ; Radar
  reste volontairement une bêta contrôlée.
- Déploiement production `dpl_B8c67kH8hokoH3aZEwhUyREcnxB1` `READY` ; apex, redirection `www`, pages légales, assets et healthcheck DB/Redis sont verts, sans 5xx observée après mise en ligne.
- Cron signé production : 7/7 tâches `SUCCESS` le 10 août 2026. Six journées consécutives supplémentaires sont encore requises.
- Lighthouse : desktop 99/95/96/100 ; mobile 79/95/96/100. La cible mobile ≥85 reste un gate, malgré la séparation Server/Client du hero, le rendu différé sous le fold et la réduction du JavaScript inutilisé.
- Gates encore rouges : validations juridique/comptable/sécurité, paiements/remboursements Stripe live, statuts GA, Lighthouse mobile ≥85, sept jours de cron, rétention PITR ≥168 h et providers/domaine inbound Radar.

## Scénarios de recette bloquants

- Inscription → onboarding → essai → expiration → Free, puis réinscription sans nouvel essai.
- Free → checkout mensuel et annuel → webhook → Pro → portail → annulation → Free.
- Chacun des trois programmes : achat, double clic, annulation, webhook retardé, replay, remboursement.
- Mission → contact → CV adapté → email → relance → signature → devis → facture → paiement.
- Stripe échoué, événement dupliqué/hors ordre, Resend bounced/complained, Redis indisponible, OpenAI indisponible.
- Deux utilisateurs utilisent les mêmes IDs dans routes/actions publiques et privées : tous les accès croisés échouent.
- Export complet puis suppression : données, contacts Resend, références Stripe et fichiers vérifiés.
- Navigation mobile, clavier, lecteur d’écran, contraste, taille tactile et `prefers-reduced-motion`.

## Déploiement production

1. Confirmer fenêtre, responsable, observateur et canal incident.
2. Vérifier sauvegarde récente, PITR actif et restauration staging datée.
3. Lancer le dry-run SQL si disponible et relire les opérations destructives/verrous.
4. Synchroniser/auditer le catalogue Stripe live sans écriture, puis appliquer avec double validation.
5. Renseigner les Price IDs retournés et toutes les variables Vercel Production.
6. Lancer `pnpm production:preflight` dans un contexte chargé avec les variables live.
7. Promouvoir uniquement les features cœur prouvées de `beta` à `ga`, conserver
   les surfaces contrôlées sous leur statut `beta`/`internal`, puis relancer le
   preflight.
8. Déployer l’application, puis appliquer les migrations avec `prisma migrate deploy` selon la politique Vercel définie.
9. Smoke tests immédiats : `/`, `/auth/signin`, `/api/health`, création mission, relance, CV, gestion, checkout test contrôlé.
10. Exécuter un achat abonnement live et un achat programme live, puis rembourser et vérifier les droits.
11. Surveiller 60 minutes : erreurs, latence, saturation DB/Redis, webhooks, emails, IA, crons.

## Rollback

### Application uniquement

1. Suspendre les promotions GA/flags risqués.
2. Revenir au déploiement Vercel précédemment validé.
3. Ne pas inverser automatiquement une migration déjà appliquée.
4. Vérifier `/api/health`, auth, lecture DB et webhooks après retour.
5. Documenter l’incident et préserver logs/IDs sans données personnelles inutiles.

### Migration incompatible

1. Bloquer les écritures du parcours concerné via flag ou maintenance ciblée.
2. Déployer un correctif forward-compatible qui accepte ancien et nouveau schémas.
3. Restaurer depuis PITR uniquement si la perte de données induite est comprise, approuvée et bornée.
4. Réconcilier Stripe/Resend/webhooks reçus pendant la fenêtre avant réouverture.

### Catalogue ou abonnement Stripe

1. Ne jamais modifier le montant d’un Price existant ; archiver et versionner.
2. Désactiver le checkout côté Jobio si les Price IDs sont incohérents.
3. Conserver le webhook actif pour ne pas perdre les événements ; laisser les échecs dans le ledger.
4. Corriger configuration/code, rejouer les événements `FAILED`, puis contrôler les droits utilisateur.

## Playbooks incidents

### Cron quotidien en échec

- Vérifier `CRON_SECRET`, l’en-tête Bearer, l’URL interne et le dernier `CronJobRun`.
- Relancer une fois manuellement avec l’idempotency key conservée.
- Si DB/Redis/Resend est indisponible, ne pas boucler ; corriger la dépendance puis rejouer.
- Le gate exige sept exécutions consécutives `SUCCESS`.

### Webhooks Stripe en backlog

- Filtrer `StripeWebhookEvent` par `FAILED`/`PROCESSING`, ancienneté et tentatives.
- Comparer l’objet Stripe courant avant replay ; le statut d’abonnement le plus récent gagne.
- Rejouer par Event ID, vérifier `PROCESSED` et l’objet métier associé.
- Alerter immédiatement si un paiement réussi ne donne pas le droit attendu.

### Redis indisponible

- Le rate limit échoue ouvert pour préserver le service : augmenter la surveillance anti-abus.
- Vérifier DNS/TLS/quota/connexions, basculer vers l’instance de secours documentée.
- Contrôler les tâches et caches après restauration ; aucun droit ne doit dépendre uniquement de Redis.

### OpenAI indisponible ou budget dépassé

- Désactiver les actions IA via flag tout en maintenant les parcours manuels.
- Afficher une erreur française actionnable, sans facturer de quota sur l’échec.
- Rejouer uniquement une demande explicitement confirmée par l’utilisateur.

### Fuite ou exposition de secret

- Révoquer et remplacer immédiatement la clé chez le fournisseur.
- Mettre à jour staging/production séparément et invalider sessions si nécessaire.
- Rechercher l’exposition dans logs, Git, artefacts et trackers ; documenter périmètre et obligations de notification.

## Critère final GO

Le GO exige simultanément : zéro P0/P1, audit production sans critique/élevée
non acceptée, toutes les features du périmètre cœur choisies `ga`, surfaces bêta
clairement isolées, CI/E2E/Lighthouse verts, healthcheck vert, sept crons
réussis, backlog webhook nul, achats live remboursés, restauration prouvée et
validations juridique/comptable signées.
