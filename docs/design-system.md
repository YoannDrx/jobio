# Jobio — design system

## Marque

Jobio est le cockpit commercial des freelances tech. Sa promesse V1 est : **« Savoir quoi faire aujourd'hui pour signer la prochaine mission. »** Le ton est direct, opérationnel et crédible. Le produit évite le jargon de CRM d'entreprise et ne présente pas l'IA comme une mascotte.

## Identité

- Canvas : `#F7F8FC`
- Surface : `#FFFFFF`
- Encre : `#0B132B`
- Cobalt : `#3B5CCC`
- Signal cyan : `#20B8D8`
- Succès : `#16865C`
- Attention : `#B7791F`
- Danger : `#C83E4D`
- Titres : Space Grotesk
- Produit : Geist Sans
- TJM, dates et métriques : Geist Mono

Les interfaces utilisent des rayons de 8 px, des bordures nettes et une densité supérieure à Moodday. Les illustrations représentent pipeline, calendrier, checklists et documents.

## Architecture V1

La navigation principale est limitée à Aujourd'hui, Pipeline, Relances, CV et Contacts. Aujourd'hui présente au maximum trois actions avec urgence, impact et contexte. Les analytics sont intégrées au contexte ; facturation avancée, programmes, plateformes, profil public, assistant généraliste et modules administratifs sont bloqués par le manifeste serveur.

## Composants

Une page possède un titre, un contexte et une seule action principale. Les listes affichent les filtres actifs et une remise à zéro. Les mutations optimistes doivent proposer annulation et reprise. Tous les écrans traitent chargement, vide, erreur, succès, accès refusé et quota.

## Motion et accessibilité

Le contenu SSR reste visible avant hydratation. Les transitions durent 120–200 ms. Les cibles interactives mesurent au moins 44 px sur mobile. `prefers-reduced-motion` neutralise les mouvements non essentiels. Statuts et graphiques utilisent texte, icône et couleur.

## Interdits

- métrique, témoignage ou résultat non vérifiable ;
- module caché uniquement par CSS ;
- notification sans lien vers son contexte ;
- action prioritaire sans justification ;
- nouveau souscripteur au plan Ultra pendant la validation V1.
