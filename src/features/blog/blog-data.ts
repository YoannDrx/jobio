export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
  readingTime: number;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "guide-cv-freelance-compatible-ats",
    title: "Guide complet du CV freelance compatible ATS",
    description:
      "Methode complete pour construire un CV freelance lisible par les ATS, credible pour les recruteurs, et aligne sur les missions ciblees.",
    date: "2026-02-22",
    tags: ["CV ATS", "Freelance", "Positionnement"],
    readingTime: 10,
    content: `
<h2>Pourquoi un CV ATS est critique pour un freelance tech</h2>
<p>Un bon CV freelance ne sert pas seulement a convaincre un humain. Il doit aussi passer les filtres ATS utilises par de nombreuses entreprises et cabinets. Si ton CV n'est pas correctement structure, tu peux etre ecarte avant meme la lecture du contenu.</p>
<p>L'objectif n'est pas de "tricher" avec l'ATS. L'objectif est de rendre ton experience lisible, precise, et coherente avec les besoins de la mission.</p>

<h2>Les erreurs qui font chuter un CV dans un ATS</h2>
<ul>
<li>Utiliser des layouts tres graphiques avec colonnes complexes</li>
<li>Remplacer les intitulés standards par des titres flous</li>
<li>Sous-detailler les resultats mesurables sur les missions</li>
<li>Lister trop de competences sans contexte d'usage</li>
<li>Ne pas adapter le CV au vocabulaire de la fiche mission</li>
</ul>
<p>Ces erreurs reduisent la compatibilite ATS et la comprehension humaine en meme temps.</p>

<h2>Structure recommandee d'un CV freelance ATS-friendly</h2>
<p>Une structure simple et robuste:</p>
<ul>
<li><strong>Header:</strong> nom, role, zone geographique, contacts</li>
<li><strong>Pitch:</strong> proposition de valeur en 3-4 lignes</li>
<li><strong>Competences:</strong> stack principale + secondaires</li>
<li><strong>Experiences:</strong> contexte, actions, impact mesure</li>
<li><strong>Projets:</strong> references pertinentes pour la mission cible</li>
<li><strong>Formation/Certifications:</strong> uniquement ce qui apporte de la credibilite</li>
</ul>
<p>Le point le plus important: chaque section doit servir une decision de recrutement.</p>

<h2>Comment adapter un CV a une mission en 20 minutes</h2>
<p><strong>Etape 1:</strong> extraire les mots cles de la fiche mission (stack, enjeux, livrables).</p>
<p><strong>Etape 2:</strong> classer tes experiences selon la proximite avec ces enjeux.</p>
<p><strong>Etape 3:</strong> reecrire les bullets d'experience en mode impact (avant/apres, KPI, delai, volume).</p>
<p><strong>Etape 4:</strong> verifier que les mots cles essentiels apparaissent naturellement.</p>
<p><strong>Etape 5:</strong> export PDF propre et verif rapide ATS.</p>
<p>Tu ne dois pas refaire un CV de zero a chaque fois. Tu dois reconfigurer une base solide.</p>

<h2>Exemple de bullet orientee impact</h2>
<p>Version faible: "Developpement frontend React."</p>
<p>Version forte: "Refonte frontend React d'un espace client B2B, reduction du temps de chargement de 38% et baisse des tickets support de 22% en 2 mois."</p>
<p>Un ATS comprend mieux la seconde version, et un humain la retient mieux aussi.</p>

<h2>Lien entre CV, prospection et pricing</h2>
<p>Un CV adapte augmente ton taux de conversion sur les missions qualifiees. C'est directement connecte a ta prospection: meilleurs messages, meilleurs entretiens, meilleure negociation.</p>
<p>Pour aligner ton workflow complet, combine:</p>
<ul>
<li>CV cible par mission</li>
<li>relances cadencees</li>
<li>suivi pipeline et conversion</li>
</ul>
<p>Tu peux relier ces briques dans <a href="/features">/features</a> et verifier les limites par plan via <a href="/#pricing">/#pricing</a>.</p>

<h2>Checklist finale avant envoi</h2>
<ul>
<li>Le titre correspond au role cible</li>
<li>Les mots cles essentiels sont presents sans bourrage</li>
<li>Chaque experience contient un impact mesurable</li>
<li>Le document reste lisible en texte brut</li>
<li>Le PDF est propre et coherent</li>
</ul>
<p>Un CV ATS compatible est un outil de vente. Traite-le comme un asset commercial, pas comme un document administratif.</p>
`,
  },
  {
    slug: "relances-freelance-cadence-templates-erreurs",
    title: "Relances freelance: cadence, templates et erreurs",
    description:
      "Cadence de relance, exemples de templates et anti-patterns a eviter pour augmenter les reponses sans abimer la relation client.",
    date: "2026-02-22",
    tags: ["Relances", "Prospection", "Templates"],
    readingTime: 9,
    content: `
<h2>La relance est le levier le plus rentable de la prospection freelance</h2>
<p>Beaucoup de freelances abandonnent trop vite apres un premier message. Pourtant, une part significative des opportunites se debloquent apres 2 a 4 interactions utiles. La relance n'est pas du spam: c'est du suivi professionnel.</p>
<p>La difference se joue sur la cadence et la valeur apportee a chaque contact.</p>

<h2>Cadence recommandee sur 14 jours</h2>
<ul>
<li><strong>J0:</strong> premier message ultra cible</li>
<li><strong>J+3:</strong> relance courte, rappel du contexte</li>
<li><strong>J+7:</strong> relance avec angle nouveau (cas, benchmark, proposition)</li>
<li><strong>J+14:</strong> message de cloture elegant avec porte ouverte</li>
</ul>
<p>Au-dela, passe en nurture (suivi faible frequence) au lieu de pousser en boucle.</p>

<h2>3 templates de relance utiles</h2>
<h3>Template 1 - rappel contextualise (J+3)</h3>
<p>"Bonjour {{prenom}}, je me permets un suivi rapide suite a mon message sur {{sujet}}. Je pense pouvoir t'aider sur {{enjeu}} avec un demarrage rapide si besoin."</p>

<h3>Template 2 - valeur concrete (J+7)</h3>
<p>"Je te partage un retour terrain: sur une mission similaire, on a reduit {{kpi}} en {{delai}}. Si utile, je peux te proposer un plan d'action en 3 etapes."</p>

<h3>Template 3 - cloture propre (J+14)</h3>
<p>"Je clos la boucle pour ne pas surcharger ta boite. Si le sujet {{enjeu}} redevient prioritaire, je suis dispo pour en parler rapidement."</p>

<h2>Erreurs frequentes qui tuent les reponses</h2>
<ul>
<li>Relancer sans nouvel element de valeur</li>
<li>Utiliser un ton passif-agressif ("je me permets de revenir encore")</li>
<li>Envoyer trop de messages trop rapproches</li>
<li>Ne pas personnaliser selon le contexte du prospect</li>
<li>Continuer a relancer un lead non qualifie</li>
</ul>
<p>Une bonne relance est specifique, utile, concise.</p>

<h2>Comment industrialiser sans perdre la personnalisation</h2>
<p>Le bon modele est hybride:</p>
<ul>
<li>des templates de base par scenario (cold, warm, post-call)</li>
<li>des variables contextuelles (enjeu, stack, timing)</li>
<li>une revue hebdo pour supprimer les messages qui performent mal</li>
</ul>
<p>Tu gagnes en vitesse sans tomber dans l'automatisation aveugle.</p>

<h2>KPI a suivre pour piloter tes relances</h2>
<ul>
<li><strong>Taux de reponse apres relance 1</strong></li>
<li><strong>Taux de reponse apres relance 2</strong></li>
<li><strong>Taux de meeting obtenu</strong></li>
<li><strong>Delai moyen entre premier contact et call</strong></li>
</ul>
<p>Le but n'est pas d'envoyer plus. Le but est d'obtenir plus de conversations qualifiees.</p>

<h2>Relier relances, pipeline et conversion</h2>
<p>Une cadence solide n'a de valeur que si elle est connectee au pipeline: prochaine action, date, statut, motif de blocage. C'est ce qui te permet d'identifier ou ca casse et corriger vite.</p>
<p>Pour aligner process et outils, consulte <a href="/features">/features</a> et compare les capacites Free/Pro/Ultra sur <a href="/#pricing">/#pricing</a>.</p>

<h2>Plan d'action en une semaine</h2>
<p><strong>Jour 1:</strong> definir 3 templates de base.</p>
<p><strong>Jour 2:</strong> segmenter tes leads (chaud, tiede, froid).</p>
<p><strong>Jour 3-5:</strong> executer la cadence sur un lot pilote.</p>
<p><strong>Jour 6:</strong> mesurer taux de reponse et rdv.</p>
<p><strong>Jour 7:</strong> ajuster les templates et supprimer le bruit.</p>
<p>En 7 jours, tu peux transformer une prospection reactive en routine previsible.</p>
`,
  },
  {
    slug: "tableau-de-bord-freelance-kpi-hebdomadaires",
    title: "Tableau de bord freelance: KPI a suivre chaque semaine",
    description:
      "Le tableau de bord minimal pour piloter ta prospection freelance avec les bons KPI hebdo et prendre des decisions data-driven.",
    date: "2026-02-22",
    tags: ["KPI", "Dashboard", "Freelance"],
    readingTime: 9,
    content: `
<h2>Pourquoi un tableau de bord hebdomadaire change ton business freelance</h2>
<p>Sans pilotage, la prospection devient emotionnelle: tu acceleres quand tu stresses, tu ralentis quand tu as une mission. Le resultat est instable. Un tableau de bord hebdomadaire te force a piloter par les signaux reels, pas par l'impression du moment.</p>
<p>L'objectif n'est pas de tracker 50 metrics. L'objectif est d'avoir 8 a 12 KPI actionnables qui te disent ou intervenir cette semaine.</p>

<h2>Les 5 blocs KPI a suivre en priorite</h2>
<h3>1) Acquisition</h3>
<ul>
<li><strong>Nouveaux leads qualifies / semaine</strong></li>
<li><strong>Taux de reponse premier contact</strong></li>
<li><strong>Canal le plus performant</strong> (LinkedIn, plateforme, referral)</li>
</ul>

<h3>2) Pipeline</h3>
<ul>
<li><strong>Nombre d'opportunites actives</strong></li>
<li><strong>Opportunites sans prochaine action</strong></li>
<li><strong>Age moyen des deals par etape</strong></li>
</ul>

<h3>3) Conversion</h3>
<ul>
<li><strong>Taux lead -> call</strong></li>
<li><strong>Taux call -> proposition</strong></li>
<li><strong>Taux proposition -> signature</strong></li>
</ul>

<h3>4) Pricing</h3>
<ul>
<li><strong>TJM moyen negocie</strong></li>
<li><strong>Ecart TJM demande vs TJM signe</strong></li>
<li><strong>Taux de remise accordee</strong></li>
</ul>

<h3>5) Cash & operations</h3>
<ul>
<li><strong>CA signe a 30 jours</strong></li>
<li><strong>Factures emises et encaissees</strong></li>
<li><strong>DSO (delai moyen d'encaissement)</strong></li>
</ul>

<h2>Le dashboard minimal (et suffisant)</h2>
<p>Tu peux commencer avec 10 KPI seulement:</p>
<ul>
<li>Leads qualifies / semaine</li>
<li>Taux de reponse</li>
<li>Calls bookes</li>
<li>Taux lead -> call</li>
<li>Propositions envoyees</li>
<li>Taux proposition -> signature</li>
<li>TJM moyen signe</li>
<li>Pipeline ponderé (valeur x probabilite)</li>
<li>CA encaisse ce mois</li>
<li>Jours de runway (si objectif de tresorerie)</li>
</ul>
<p>Avec ces 10 indicateurs, tu vois deja si ton systeme commercial est sain ou en train de se degrader.</p>

<h2>Comment lire les KPI pour agir vite</h2>
<p>Chaque KPI doit etre relie a une action precise. Exemples:</p>
<ul>
<li><strong>Taux de reponse en baisse:</strong> revoir ciblage et accroche des messages</li>
<li><strong>Beaucoup d'opportunites sans prochaine action:</strong> imposer une hygiene pipeline quotidienne</li>
<li><strong>TJM moyen qui baisse:</strong> retravailler argumentaire valeur et qualification budget</li>
<li><strong>Cycle de vente qui s'allonge:</strong> renforcer cadence de relances et clarifier les next steps</li>
</ul>
<p>Un KPI sans action associee est juste une statistique decorative.</p>

<h2>Rituel hebdo recommande (45 minutes)</h2>
<p><strong>Bloc 1 - 15 min:</strong> lecture des KPI et detection des ecarts.</p>
<p><strong>Bloc 2 - 20 min:</strong> priorisation de 3 actions max pour la semaine.</p>
<p><strong>Bloc 3 - 10 min:</strong> nettoyage pipeline (next action, dates, statut).</p>
<p>Ce rituel est plus utile qu'un gros reporting mensuel fait trop tard.</p>

<h2>Erreurs frequentes a eviter</h2>
<ul>
<li>Suivre trop de KPI et n'en utiliser aucun pour decider</li>
<li>Confondre volume d'activite et progression commerciale</li>
<li>Mesurer uniquement l'acquisition et ignorer conversion + cash</li>
<li>Modifier son process chaque semaine sans periode de test minimale</li>
</ul>

<h2>Stack operationnelle pour industrialiser</h2>
<p>Pour rendre ce pilotage fiable, il faut connecter CRM, relances, analytics et facturation. C'est ce lien entre acquisition, conversion et cash qui cree une activite previsible.</p>
<p>Tu peux voir la structure produit complete sur <a href="/features">/features</a>, transformer ces KPI en process dans <a href="/docs">/docs</a>, puis verifier les limites de plan sur <a href="/#pricing">/#pricing</a>.</p>

<h2>Plan d'implementation en 7 jours</h2>
<p><strong>Jour 1:</strong> selectionner 10 KPI max.</p>
<p><strong>Jour 2:</strong> definir les seuils d'alerte.</p>
<p><strong>Jour 3:</strong> nettoyer pipeline et tags source.</p>
<p><strong>Jour 4-5:</strong> instrumenter reporting hebdo.</p>
<p><strong>Jour 6:</strong> revue pilote et ajustements.</p>
<p><strong>Jour 7:</strong> verrouiller le rituel hebdomadaire dans ton agenda.</p>
<p>Le but final: moins d'intuition brute, plus de decisions systematiques.</p>
`,
  },
  {
    slug: "facturation-freelance-devis-factures-conformite",
    title: "Facturation freelance: devis, factures, conformite",
    description:
      "Mode operatoire complet pour passer d'une mission signee a un encaissement propre: devis, factures, relances et hygiene de conformite.",
    date: "2026-02-22",
    tags: ["Facturation", "Freelance", "Conformite"],
    readingTime: 10,
    content: `
<h2>Pourquoi la facturation est un levier de marge, pas une corvee admin</h2>
<p>Beaucoup de freelances optimisent leur prospection puis perdent de la marge sur l'execution administrative: devis incomplets, factures tardives, relances de paiement improvisees. Le resultat est simple: plus de stress, plus de retard de cash, moins de pilotage.</p>
<p>Une stack de facturation propre transforme le revenu signe en revenu encaisse, sans frictions evitables.</p>

<h2>Le pipeline administratif minimal en 6 etapes</h2>
<ol>
<li>Qualification client (informations legales et contact facturation)</li>
<li>Emission d'un devis clair avec validite et conditions</li>
<li>Acceptation formelle (signature ou validation ecrite)</li>
<li>Emission de facture selon les jalons reels</li>
<li>Suivi des echeances et relances de paiement</li>
<li>Archivage et registre pour controle/compta</li>
</ol>
<p>Si une etape manque, le risque d'impaye ou de litige augmente fortement.</p>

<h2>Devis: ce qui doit etre verrouille avant demarrage</h2>
<p>Un bon devis reduit les discussions improductives en cours de mission. Il doit clarifier:</p>
<ul>
<li>scope et livrables inclus / exclus</li>
<li>modalite de facturation (forfait, TJM, jalons)</li>
<li>planning et conditions de validation</li>
<li>conditions de paiement (delai, acompte, penalites)</li>
<li>conditions de revision (changement de perimetre)</li>
</ul>
<p>Le devis n'est pas un simple PDF commercial. C'est ton cadre operationnel et financier.</p>

<h2>Factures: rigueur, cadence et preuve</h2>
<p>Les retards de facturation creent un trou de tresorerie immediat. Mets en place une cadence fixe: emission a date definie, verification des champs obligatoires, preuve de transmission.</p>
<p>Bonnes pratiques:</p>
<ul>
<li>facturer au plus tot apres jalon valide</li>
<li>standardiser tes templates facture/devis</li>
<li>associer chaque facture au bon dossier client</li>
<li>tracer statut: envoyee, vue, payee, relancee</li>
</ul>
<p>Pour les obligations legales selon ton statut, valide ton process avec ton expert-comptable.</p>

<h2>Relances de paiement sans degrader la relation</h2>
<p>Une relance de paiement n'est pas agressive si elle est cadencée et factuelle. Exemple de routine:</p>
<ul>
<li>J+1 apres echeance: rappel courtois</li>
<li>J+7: relance structuree avec recap de la facture</li>
<li>J+14: escalation avec proposition de call rapide</li>
</ul>
<p>Le point cle: relancer vite, documenter chaque interaction, rester professionnel.</p>

<h2>KPI admin a suivre chaque semaine</h2>
<ul>
<li><strong>DSO</strong> (delai moyen d'encaissement)</li>
<li><strong>Taux de factures payees a l'echeance</strong></li>
<li><strong>Montant en retard</strong></li>
<li><strong>Cycle devis signe -> 1ere facture emise</strong></li>
</ul>
<p>Ces indicateurs sont aussi importants que les KPI de prospection: ils pilotent ta stabilite cash.</p>

<h2>Checklist de conformite mensuelle</h2>
<ul>
<li>numerotation continue des devis/factures</li>
<li>coordonnees client et mentions obligatoires controlees</li>
<li>pieces justificatives archivees</li>
<li>registre exportable disponible en cas de demande</li>
</ul>
<p>Un process robuste t'evite les corrections urgentes en fin de trimestre.</p>

<h2>Relier facturation, pipeline et pricing</h2>
<p>Le meilleur systeme combine acquisition, conversion et encaissement dans une seule boucle de pilotage. Tu peux lier ces briques dans <a href="/features">/features</a>, executer tes routines dans <a href="/docs">/docs</a> et verifier les limites de ton plan via <a href="/#pricing">/#pricing</a>.</p>

<h2>Plan d'action 7 jours</h2>
<p><strong>Jour 1:</strong> audit complet du flux devis -> facture -> paiement.</p>
<p><strong>Jour 2:</strong> standardiser templates et mentions.</p>
<p><strong>Jour 3:</strong> structurer le suivi des echeances.</p>
<p><strong>Jour 4:</strong> definir cadence de relance.</p>
<p><strong>Jour 5:</strong> instrumenter KPI cash.</p>
<p><strong>Jour 6:</strong> nettoyer les dossiers clients ouverts.</p>
<p><strong>Jour 7:</strong> lancer la revue hebdo admin dans l'agenda.</p>
<p>Objectif: transformer la facturation en moteur de previsibilite, pas en zone de friction.</p>
`,
  },
  {
    slug: "pipeline-freelance-lead-contrat-signe",
    title: "Pipeline freelance: du lead au contrat signe",
    description:
      "Cadre de pipeline freelance pour convertir plus vite: etapes, criteres de passage, relances et KPI de conversion par stade.",
    date: "2026-02-22",
    tags: ["Pipeline", "Prospection", "Conversion"],
    readingTime: 9,
    content: `
<h2>Un pipeline n'est utile que si chaque etape force une action</h2>
<p>Beaucoup de pipelines freelances ressemblent a une liste statique de prospects. Sans criteres de passage, sans prochaine action datee, sans priorisation, le pipeline devient decoratif.</p>
<p>Un bon pipeline doit reduire l'incertitude: que faire aujourd'hui, sur quel deal, avec quel message.</p>

<h2>Les 7 etapes recommandees</h2>
<ol>
<li>Lead qualifie</li>
<li>Premier contact envoye</li>
<li>Echange actif</li>
<li>Call de qualification</li>
<li>Proposition emise</li>
<li>Negociation</li>
<li>Signe / perdu</li>
</ol>
<p>Garde ce framework simple et stable. Les sous-etapes sont possibles, mais seulement si elles changent une decision.</p>

<h2>Criteres de passage par etape</h2>
<p>Chaque deplacement dans le pipeline doit reposer sur un critere objectif:</p>
<ul>
<li><strong>Lead qualifie -> Contact envoye:</strong> ICP + enjeu + interlocuteur identifies</li>
<li><strong>Contact envoye -> Echange actif:</strong> reponse recue ou ouverture d'une discussion</li>
<li><strong>Echange actif -> Call:</strong> besoin confirme + disponibilite validee</li>
<li><strong>Call -> Proposition:</strong> scope, budget et timing clarifies</li>
<li><strong>Proposition -> Negociation:</strong> contre-proposition explicite ou ajustements demandes</li>
</ul>
<p>Ces criteres evitent les faux positifs et les previsions gonflees.</p>

<h2>Probabilite par stade (pour un pipeline ponderé)</h2>
<ul>
<li>Lead qualifie: 10%</li>
<li>Contact envoye: 20%</li>
<li>Echange actif: 35%</li>
<li>Call: 50%</li>
<li>Proposition: 65%</li>
<li>Negociation: 80%</li>
</ul>
<p>Ces pourcentages sont des points de depart. Ajuste-les avec tes donnees reelles au fil des semaines.</p>

<h2>Rituels operationnels pour accelerer la conversion</h2>
<ul>
<li><strong>Daily 10 min:</strong> verifier chaque opportunite sans prochaine action</li>
<li><strong>Hebdo 30 min:</strong> nettoyer les deals bloques et reprioriser</li>
<li><strong>Hebdo 20 min:</strong> analyser les pertes et adapter pitch/qualification</li>
</ul>
<p>Sans rituel, le pipeline se degrade naturellement.</p>

<h2>Les 5 KPI pipeline a suivre en priorite</h2>
<ul>
<li>taux de passage entre chaque etape</li>
<li>age moyen des deals par etape</li>
<li>valeur ponderée du pipeline</li>
<li>cycle moyen lead -> signature</li>
<li>taux de win sur propositions emises</li>
</ul>
<p>Ces KPI montrent exactement ou ton systeme perd des opportunites.</p>

<h2>Erreurs frequentes a corriger</h2>
<ul>
<li>garder des opportunites "fantomes" sans activite recente</li>
<li>ne pas disqualifier les leads hors scope/budget</li>
<li>ne pas relancer apres proposition</li>
<li>confondre volume de leads et qualite commerciale</li>
</ul>
<p>Un pipeline propre gagne souvent plus qu'une augmentation brute du volume.</p>

<h2>Relier pipeline, CV et pricing</h2>
<p>Ton pipeline convertit mieux quand ton positionnement (CV/pitch), ta cadence de relance et ton pricing sont alignes. Tu peux connecter ces modules sur <a href="/features">/features</a>, transformer la methode en execution quotidienne via <a href="/docs">/docs</a>, puis comparer les capacites de plan sur <a href="/#pricing">/#pricing</a>.</p>

<h2>Plan d'execution 14 jours</h2>
<p><strong>J1-J2:</strong> nettoyer les etapes et criteres de passage.</p>
<p><strong>J3-J5:</strong> relancer tous les deals sans prochaine action.</p>
<p><strong>J6-J8:</strong> standardiser call script et trame de proposition.</p>
<p><strong>J9-J11:</strong> instrumenter KPI de conversion.</p>
<p><strong>J12-J14:</strong> revue complete et ajustement des probabilites par stade.</p>
<p>Objectif: passer d'un suivi artisanal a une machine commerciale previsible.</p>
`,
  },
  {
    slug: "structurer-prospection-freelance-2026",
    title: "Structurer sa prospection freelance en 2026: framework 14 jours",
    description:
      "Framework concret en 5 blocs pour industrialiser la prospection freelance: ciblage, pipeline, relances, KPI et execution sur 14 jours.",
    date: "2026-02-22",
    tags: ["Prospection", "CRM", "Freelance"],
    readingTime: 8,
    content: `
<h2>Pourquoi la prospection freelance echoue encore en 2026</h2>
<p>La plupart des freelances tech ne manquent pas de competences. Ils manquent de systeme. La prospection reste reactive: quelques messages envoyes en urgence quand le planning se vide, puis plus rien quand une mission tombe. Ce mode "stop and go" cree des trous de revenus, une pression inutile et une qualite commerciale instable.</p>
<p>Structurer sa prospection en 2026, c'est accepter une regle simple: la prospection est un processus operationnel hebdomadaire, pas une tache ponctuelle.</p>

<h2>Le framework en 5 blocs</h2>
<p>Pour stabiliser ton flux de missions, organise ton dispositif autour de 5 blocs complementaires:</p>
<ul>
<li><strong>Cible:</strong> quels segments d'entreprises et quels decideurs viser</li>
<li><strong>Offre:</strong> quelle proposition de valeur formuler clairement</li>
<li><strong>Pipeline:</strong> comment suivre chaque opportunite du 1er contact a la signature</li>
<li><strong>Relances:</strong> quelle cadence adopter sans polluer la relation</li>
<li><strong>Pilotage:</strong> quels KPI suivre pour ajuster en continu</li>
</ul>
<p>Si un de ces blocs est faible, tout le systeme se degrade rapidement.</p>

<h2>Bloc 1: clarifier sa cible (ICP freelance)</h2>
<p>Ton ICP (Ideal Client Profile) n'a pas besoin d'etre complexe. Il doit etre exploitable. Definis 3 criteres de priorisation:</p>
<ul>
<li><strong>Maturite produit:</strong> startup en acceleration, PME en transformation, scale-up qui recrute</li>
<li><strong>Type de probleme:</strong> dette technique frontend, migration data, industrialisation CI/CD, etc.</li>
<li><strong>Capacite budget:</strong> interlocuteur avec mandat de depense et urgence reelle</li>
</ul>
<p>Tu peux ensuite segmenter ton sourcing en 2 listes: "priorite haute" (ouverture immediate) et "nurture" (a maturer).</p>

<h2>Bloc 2: formaliser une offre lisible en 30 secondes</h2>
<p>Ton message doit repondre en une phrase a "pourquoi toi". Evite la liste de technos. Parle resultat business + contexte tech.</p>
<p><strong>Exemple:</strong> "J'aide les equipes produit SaaS a reduire leur delai de livraison frontend de 20 a 30% sans degradations de qualite."</p>
<p>Cette phrase devient le socle de ton outreach, de ton profil LinkedIn et de ta landing perso.</p>

<h2>Bloc 3: installer un pipeline strict</h2>
<p>Un pipeline minimum pour freelance doit contenir des etapes actionnables:</p>
<ul>
<li>Lead identifie</li>
<li>Contact envoye</li>
<li>Reponse recue</li>
<li>Call de qualification</li>
<li>Proposition envoyee</li>
<li>Negociation</li>
<li>Signe / perdu</li>
</ul>
<p>Chaque transition doit declencher une action concrete (prochaine relance, doc a envoyer, date de suivi). Sans prochaine action, l'opportunite est en risque.</p>

<h2>Bloc 4: cadence de relance qui convertit</h2>
<p>La plupart des opportunites meurent faute de suivi. Une cadence simple et robuste:</p>
<ul>
<li>J+3: relance courte avec valeur ajoutee</li>
<li>J+7: relance orientee resultat (cas concret, point de friction resolu)</li>
<li>J+14: dernier message courtois avec sortie propre</li>
</ul>
<p>Chaque relance doit apporter un angle nouveau. Un "ping" sans contexte detruit ta credibilite.</p>

<h2>Bloc 5: piloter comme un funnel</h2>
<p>4 KPI suffisent pour commencer:</p>
<ul>
<li><strong>Taux de reponse:</strong> qualite de ciblage + qualite du message</li>
<li><strong>Taux de passage call:</strong> pertinence de l'offre</li>
<li><strong>Taux de signature:</strong> qualite qualification + proposition</li>
<li><strong>Cycle moyen de conversion:</strong> vitesse commerciale</li>
</ul>
<p>Revue hebdo recommandee: 30 minutes pour analyser, couper ce qui ne marche pas et doubler sur ce qui convertit.</p>

<h2>Stack minimale recommandee</h2>
<p>Tu n'as pas besoin de 10 outils. Une stack minimale en 2026:</p>
<ul>
<li>Un CRM pipeline avec historique contact</li>
<li>Un systeme de relances (manuelles + semi-automatiques)</li>
<li>Un suivi analytics de conversion</li>
<li>Un module de facturation pour accelerer le passage de la vente au cash</li>
</ul>
<p>Si tu veux une vue d'ensemble des modules disponibles, consulte la page <a href="/features">features Jobio</a>, puis applique les routines dans <a href="/docs">/docs</a> et compare les plans via <a href="/#pricing">/#pricing</a>.</p>

<h2>Plan d'execution sur 14 jours</h2>
<p><strong>Jour 1-2:</strong> definir ICP + proposition de valeur.</p>
<p><strong>Jour 3-4:</strong> nettoyer profil et assets commerciaux.</p>
<p><strong>Jour 5-7:</strong> lancer 30 premiers contacts qualifies.</p>
<p><strong>Jour 8-10:</strong> appliquer la cadence de relances.</p>
<p><strong>Jour 11-14:</strong> revue KPI et ajustements.</p>
<p>Objectif: transformer la prospection en systeme reproductible, pas en sprint de survie.</p>

<h2>Prochaine etape</h2>
<p>Si tu veux deployer ce framework sans perdre de temps, commence par configurer ton pipeline sur <a href="/features">/features</a>, suis une routine hebdo dans <a href="/docs">/docs</a> et valide les limites de ton plan sur <a href="/#pricing">/#pricing</a>.</p>
`,
  },
  {
    slug: "crm-freelance-criteres-stack-minimale",
    title: "CRM freelance: 7 criteres de choix + stack minimale",
    description:
      "Guide concret pour choisir un CRM freelance utile, eviter les anti-patterns et deployer une stack minimale qui convertit mieux.",
    date: "2026-02-22",
    tags: ["CRM", "Freelance", "Organisation"],
    readingTime: 8,
    content: `
<h2>Pourquoi un CRM est devenu obligatoire pour les freelances</h2>
<p>Des que tu depasses 15 a 20 opportunites actives, la memoire ne suffit plus. Sans CRM, tu perds des relances, tu oublies le contexte de discussion et tu sous-exploites ton pipeline. Resultat: moins de signatures pour le meme volume d'effort.</p>
<p>Un CRM freelance ne doit pas copier les usines a gaz des equipes enterprise. Il doit rester simple, actionnable et centre sur la conversion.</p>

<h2>Les 7 criteres de choix qui comptent vraiment</h2>
<h3>1. Vitesse de saisie</h3>
<p>Si l'ajout d'une opportunite prend plus de 30 secondes, tu ne l'utiliseras pas durablement. Priorise l'import rapide (URL, parsing, templates).</p>

<h3>2. Pipeline visible</h3>
<p>Le coeur du CRM est la visualisation de l'etat commercial: quelles missions sont bloquees, lesquelles sont chaudes, et ou agir aujourd'hui.</p>

<h3>3. Historique relationnel</h3>
<p>Tu dois retrouver en un clic les messages, relances et decisions precedentes pour personnaliser la suite.</p>

<h3>4. Relances cadencables</h3>
<p>Un bon CRM doit permettre de planifier et tracer les relances. Sinon, la discipline commerciale depend de ta charge mentale.</p>

<h3>5. Scoring / priorisation</h3>
<p>Quand tout semble urgent, rien ne l'est. Un systeme de score (fit client, urgence, budget, timing) aide a choisir les bons combats.</p>

<h3>6. Analytics exploitables</h3>
<p>Tu dois pouvoir repondre chaque semaine a: "quel canal convertit ?", "ou je perds des deals ?", "combien de temps pour signer ?"</p>

<h3>7. Continuite operationnelle</h3>
<p>Le CRM ideal connecte la vente a l'execution administrative: devis, factures, suivi de paiement. C'est ce qui transforme le pipeline en cash.</p>

<h2>Les anti-patterns frequents</h2>
<ul>
<li><strong>Tableur unique sans process:</strong> rapide au debut, fragile a moyen terme</li>
<li><strong>Trop d'automatisation trop tot:</strong> la strategie n'est pas claire, l'automatisation amplifie le bruit</li>
<li><strong>Aucun rituel hebdo:</strong> meme le meilleur outil est inutile sans revue reguliere</li>
<li><strong>Copier un setup d'agence:</strong> besoins differents, friction inutile</li>
</ul>

<h2>Stack minimale freelance (2026)</h2>
<p>Une stack compacte et efficace:</p>
<ul>
<li><strong>CRM pipeline:</strong> centraliser missions, etapes et prochaines actions</li>
<li><strong>Relances & templates:</strong> accelerer l'outreach sans sacrifier la personnalisation</li>
<li><strong>Module CV/positionnement:</strong> adapter rapidement son pitch selon le deal</li>
<li><strong>Module admin freelance:</strong> clients, devis, factures, paiements</li>
</ul>
<p>Tu peux visualiser cette logique produit sur <a href="/features">/features</a>, operationaliser ton process via <a href="/docs">/docs</a>, puis verifier les limites par plan sur <a href="/#pricing">/#pricing</a>.</p>

<h2>Checklist de selection en 20 minutes</h2>
<p>Avant de choisir ton CRM, reponds oui/non:</p>
<ul>
<li>Je peux importer une mission en moins de 30 secondes</li>
<li>Je vois mes opportunites par etape, sans effort manuel</li>
<li>Chaque opportunite a une "prochaine action" datee</li>
<li>Je peux tracer mes relances et leur impact</li>
<li>J'ai des KPI hebdo (reponse, conversion, cycle)</li>
<li>Je peux enchaîner vers devis/facture sans sortir du systeme</li>
</ul>
<p>Si tu as moins de 5 "oui", ton setup actuel freine probablement ta croissance.</p>

<h2>Plan de migration en douceur</h2>
<p><strong>Semaine 1:</strong> migrer uniquement les opportunites actives.</p>
<p><strong>Semaine 2:</strong> imposer une cadence de relance standard.</p>
<p><strong>Semaine 3:</strong> ajouter reporting hebdo et revue KPI.</p>
<p><strong>Semaine 4:</strong> connecter l'administratif (devis/factures).</p>
<p>L'objectif n'est pas d'avoir "le meilleur CRM", mais le meilleur rythme commercial pour ton contexte freelance.</p>

<h2>Prochaine etape</h2>
<p>Passe de la theorie a l'execution: configure ton setup sur <a href="/features">/features</a>, applique une cadence dans <a href="/docs">/docs</a> et aligne ton volume avec le bon plan via <a href="/#pricing">/#pricing</a>.</p>
`,
  },
  {
    slug: "5-conseils-prospection-freelance",
    title: "Prospection freelance tech: 5 leviers pour signer regulierement",
    description:
      "5 leviers operationnels pour stabiliser ton flux de missions freelance: positionnement, pipeline, relances, LinkedIn et pilotage KPI.",
    date: "2026-02-22",
    tags: ["Prospection", "Freelance", "Strategie"],
    readingTime: 8,
    content: `
<h2>Pourquoi ces 5 leviers font la difference</h2>
<p>La prospection freelance echoue rarement par manque de competence technique. Elle echoue surtout par manque de systeme. Ces 5 leviers te donnent une base simple pour passer d'une prospection reactive a une machine commerciale stable.</p>
<p>L'objectif n'est pas d'envoyer plus de messages. L'objectif est de signer plus de missions pertinentes avec moins de friction.</p>

<h2>1) Clarifier ton positionnement avant le moindre outreach</h2>
<p>Avant de prospecter, tu dois pouvoir repondre a 3 questions en une phrase: quel probleme tu resous, pour qui, et quel impact tu livres. Sans ca, tes messages restent generiques et ton TJM devient difficile a defendre.</p>
<p><strong>Action concrete:</strong> formule une promesse en 20 mots max. Exemple: "J'aide les equipes SaaS B2B a accelerer leur delivery frontend sans dette technique."</p>

<h2>2) Installer un pipeline structure</h2>
<p>Les freelances qui signent regulierement pilotent un pipeline, pas une todo liste. Chaque opportunite doit avoir un statut clair et une prochaine action datee.</p>
<p>Pipeline minimal recommande:</p>
<ul>
<li>Lead identifie</li>
<li>Premier contact envoye</li>
<li>Qualification faite</li>
<li>Proposition envoyee</li>
<li>Negociation</li>
<li>Signe / perdu</li>
</ul>
<p>Sans pipeline explicite, tu perds les bons deals dans le bruit quotidien.</p>

<h2>3) Industrialiser les relances sans perdre la personnalisation</h2>
<p>Une grande partie des missions se debloquent apres 2 a 4 interactions. Ne pas relancer, c'est abandonner des opportunites deja qualifiees.</p>
<p>Cadence simple:</p>
<ul>
<li>J+3: rappel contextualise</li>
<li>J+7: valeur concrete (cas, benchmark, proposition)</li>
<li>J+14: cloture elegante avec porte ouverte</li>
</ul>
<p><strong>Regle:</strong> chaque relance doit ajouter une information utile. Sinon, c'est du bruit.</p>

<h2>4) Exploiter LinkedIn comme canal d'acquisition</h2>
<p>Pour les freelances tech, LinkedIn reste le canal le plus rentable pour ouvrir des conversations qualifiees avec CTO, VP Engineering, Head of Product et fondateurs.</p>
<p>Checklist d'hygiene LinkedIn:</p>
<ul>
<li>Titre positionne sur resultat, pas sur stack brute</li>
<li>Resume oriente cas d'usage et preuves</li>
<li>2 posts/semaine sur problemes clients reels</li>
<li>Commentaires cibles sur les comptes prospects</li>
</ul>
<p>Un profil credible + une activite reguliere augmentent fortement la conversion de tes messages sortants.</p>

<h2>5) Piloter avec 4 KPI hebdo</h2>
<p>Sans mesure, tu ajustes a l'intuition. Avec 4 KPI, tu identifies rapidement ou agir:</p>
<ul>
<li>Taux de reponse premier contact</li>
<li>Taux lead -> call</li>
<li>Taux proposition -> signature</li>
<li>Cycle moyen de conversion</li>
</ul>
<p>Revue recommandee: 30 minutes chaque semaine pour couper ce qui ne marche pas et renforcer ce qui convertit.</p>

<h2>Plan d'action 7 jours</h2>
<p><strong>Jour 1:</strong> clarifier proposition de valeur.</p>
<p><strong>Jour 2:</strong> nettoyer pipeline et statuts.</p>
<p><strong>Jour 3-4:</strong> lancer outreach cible.</p>
<p><strong>Jour 5:</strong> executer relances J+3.</p>
<p><strong>Jour 6:</strong> publier 1 contenu LinkedIn utile.</p>
<p><strong>Jour 7:</strong> revue KPI et ajustements.</p>

<h2>Prochaine etape</h2>
<p>Pour passer de la theorie a l'execution, configure ton systeme sur <a href="/features">/features</a>, suis un cadre operationnel dans <a href="/docs">/docs</a> et aligne ton volume de prospection avec ton plan sur <a href="/#pricing">/#pricing</a>.</p>
`,
  },
  {
    slug: "optimiser-profil-linkedin-freelance",
    title: "Optimiser son profil LinkedIn freelance: guide conversion 2026",
    description:
      "Guide pratique pour transformer ton profil LinkedIn en actif commercial: titre, resume, preuves, contenus et routine hebdo.",
    date: "2026-02-22",
    tags: ["LinkedIn", "Personal Branding", "Freelance"],
    readingTime: 8,
    content: `
<h2>Pourquoi LinkedIn est un actif commercial (et pas juste une vitrine)</h2>
<p>Pour un freelance tech, LinkedIn influence directement la conversion: avant de repondre a ton message, le prospect verifie ton profil. S'il ne comprend pas clairement ton positionnement en 20 secondes, la conversation s'arrete la.</p>
<p>L'objectif n'est pas d'avoir un profil "beau". L'objectif est d'avoir un profil qui rassure, qualifie et convertit.</p>

<h2>1) Refaire ton titre comme une promesse client</h2>
<p>Ton titre doit expliquer ce que tu fais, pour qui, et avec quel impact.</p>
<p><strong>Erreurs classiques:</strong></p>
<ul>
<li>"Developpeur fullstack" (trop generique)</li>
<li>"En recherche de mission" (posture faible)</li>
<li>"React | Node | AWS | Docker" (liste sans contexte)</li>
</ul>
<p><strong>Formule robuste:</strong> [Resultat] pour [type de client] | [preuve].</p>
<p>Exemples:</p>
<ul>
<li>"J'aide les SaaS B2B a accelerer leur delivery frontend | Ex Lead Dev"</li>
<li>"CTO freelance: structuration d'equipe tech en phase scale | 12 ans XP"</li>
<li>"Data Engineer freelance: pipelines temps reel fintech | AWS Certified"</li>
</ul>

<h2>2) Ecrire un resume en 3 blocs orientes decision</h2>
<p>Ton resume doit se lire comme un mini business case:</p>
<p><strong>Bloc A - probleme:</strong> contexte client et enjeux.</p>
<p><strong>Bloc B - methode:</strong> ce que tu mets en place concretement.</p>
<p><strong>Bloc C - preuves:</strong> 2 a 3 resultats chiffres.</p>
<p>Sans chiffres ni contexte, ton resume reste declaratif et perd en credibilite.</p>

<h2>3) Transformer chaque experience en mini etude de cas</h2>
<p>Chaque experience doit repondre a 4 questions:</p>
<ul>
<li>Contexte: type d'entreprise, taille, enjeu</li>
<li>Defi: friction technique ou business</li>
<li>Contribution: decisions et execution</li>
<li>Resultat: impact mesurable (temps, cout, revenu, qualite)</li>
</ul>
<p>Ce format transforme ton profil en portfolio vivant et donne de la matiere a tes messages de prospection.</p>

<h2>4) Publier du contenu utile (pas du bruit)</h2>
<p>Un bon profil sans visibilite convertit peu. Publie de facon reguliere pour nourrir la confiance:</p>
<ul>
<li>retours d'experience mission</li>
<li>frameworks actionnables</li>
<li>erreurs frequentes et correctifs</li>
<li>avant/apres avec KPI</li>
</ul>
<p>Cadence minimale: 2 posts/semaine + commentaires cibles sur les comptes prospects.</p>

<h2>5) Renforcer la preuve sociale</h2>
<p>Les recommandations client font gagner du temps en qualification. Apres chaque mission reussie, demande un retour court axe sur probleme, intervention, resultat.</p>
<p>Objectif: obtenir au moins 5 recommandations recentes et coherentes avec ton positionnement actuel.</p>

<h2>Routine hebdo (30 minutes)</h2>
<p><strong>10 min:</strong> mettre a jour une experience ou un resultat.</p>
<p><strong>10 min:</strong> preparer un post utile.</p>
<p><strong>10 min:</strong> commenter 5 publications de prospects cibles.</p>
<p>Cette discipline cree un flux d'opportunites entrant, sans dependre uniquement du cold outreach.</p>

<h2>Prochaine etape</h2>
<p>Pour connecter ton profil LinkedIn a un systeme commercial complet, aligne ta prospection sur <a href="/features">/features</a>, applique des routines dans <a href="/docs">/docs</a> et ajuste ton volume d'actions selon ton plan via <a href="/#pricing">/#pricing</a>.</p>
`,
  },
  {
    slug: "comment-fixer-son-tjm",
    title: "Fixer son TJM et negocier sans se brader",
    description:
      "Cadre concret pour definir un TJM rentable, le defendre en negociation et augmenter son prix sans casser sa conversion.",
    date: "2026-02-22",
    tags: ["TJM", "Negociation", "Freelance", "Pricing"],
    readingTime: 9,
    content: `
<h2>Le TJM n'est pas juste un prix: c'est ton systeme de positionnement</h2>
<p>Beaucoup de freelances fixent leur TJM en copiant le marche ou en convertissant leur ancien salaire. Ca produit des tarifs fragiles en negociation. Un TJM robuste repose sur trois couches: rentabilite, valeur creee, et coherence avec ton positionnement.</p>
<p>Le but n'est pas "facturer le plus possible". Le but est de facturer juste, avec une marge saine et une conversion stable.</p>

<h2>Definir 3 niveaux de TJM au lieu d'un seul chiffre</h2>
<ul>
<li><strong>TJM plancher:</strong> en dessous, la mission detruit ta rentabilite.</li>
<li><strong>TJM cible:</strong> ton niveau standard pour les missions qualifiees.</li>
<li><strong>TJM ambition:</strong> tarif pour contexte exigeant (urgence, expertise rare, impact eleve).</li>
</ul>
<p>Cette grille te donne de la flexibilite en negociation sans tomber dans la braderie.</p>

<h2>Calcul rapide du TJM plancher</h2>
<p>Formule simple: <strong>TJM plancher = (revenu net cible + charges + reserve risque) / jours facturables</strong>.</p>
<p>Exemple: revenu net 70k, charges 52k, reserve risque 8k, 195 jours facturables. TJM plancher = 130k / 195 = 666 euros.</p>
<p>Ce chiffre n'est pas ton argument commercial. C'est ta limite interne.</p>

<h2>Passer du TJM plancher au TJM cible</h2>
<p>Ton TJM cible depend de la valeur business livree, pas seulement de ton temps. Ajuste selon:</p>
<ul>
<li>impact attendu (revenu, cout, delai, risque)</li>
<li>niveau d'incertitude technique</li>
<li>niveau de seniorite demande sur la mission</li>
<li>rareté de l'expertise sur le marche</li>
</ul>
<p>Plus l'impact est critique et le risque eleve, plus ton TJM cible doit monter.</p>

<h2>Negocier sans se brader: script pratique</h2>
<p><strong>1) Qualifier avant de chiffrer.</strong> Budget, urgence, sponsor, criteres de succes.</p>
<p><strong>2) Ancrer sur la valeur.</strong> "Sur des contextes similaires, j'ai reduit X de Y% en Z semaines."</p>
<p><strong>3) Donner une fourchette.</strong> Positionne ton TJM cible en milieu-haut.</p>
<p><strong>4) Echanger concession contre concession.</strong> Si tu descends sur le prix, obtiens scope, engagement ou delai plus favorable.</p>
<p><strong>5) Clore proprement.</strong> Si le budget est hors zone viable, refuse sans detruire la relation.</p>

<h2>Les remises intelligentes (et les remises toxiques)</h2>
<p>Une remise peut etre saine si elle est conditionnee:</p>
<ul>
<li>engagement minimum de duree</li>
<li>scope stabilise</li>
<li>paiement rapide</li>
<li>volume garanti</li>
</ul>
<p>Une remise toxique est une remise "pour faire plaisir" sans contrepartie concrete.</p>

<h2>Quand augmenter ton TJM</h2>
<ul>
<li>ton taux d'occupation depasse 85-90% pendant plusieurs mois</li>
<li>ta conversion reste stable malgre une hausse test</li>
<li>tu as renforce ton expertise ou ton niveau de responsabilite</li>
<li>la mission demande un niveau de criticite superieur</li>
</ul>
<p>Augmente par paliers (5 a 10%) et mesure l'effet sur conversion et marge.</p>

<h2>Mettre le pricing sous pilotage</h2>
<p>Ton TJM doit etre suivi dans ton dashboard hebdo: taux de remise, TJM demande, TJM signe, marge estimee, cycle de vente. Sans mesures, tu negocies a l'instinct.</p>
<p>Pour outiller ce pilotage, relie ton pricing a ton pipeline sur <a href="/features">/features</a>, execute les routines dans <a href="/docs">/docs</a> et verifie les capacites par plan sur <a href="/#pricing">/#pricing</a>.</p>

<h2>Checklist avant d'envoyer une proposition</h2>
<ul>
<li>Mon TJM est dans ma zone cible ou ambition</li>
<li>La proposition explicite clairement la valeur business</li>
<li>Les concessions eventuelles ont une contrepartie</li>
<li>Le scope est defini pour limiter les glissements</li>
<li>Le plan de revalorisation est anticipe si mission longue</li>
</ul>
<p>Le bon TJM est celui que tu peux defender avec coherence, pas celui que tu affiches avec anxiete.</p>
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
