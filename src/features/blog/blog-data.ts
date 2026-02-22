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
    slug: "structurer-prospection-freelance-2026",
    title: "Comment structurer sa prospection freelance en 2026",
    description:
      "Un plan concret pour construire un systeme de prospection freelance repetable, mesurable et compatible avec un rythme de mission reel.",
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
<p>Si tu veux une vue d'ensemble des modules disponibles, consulte la page <a href="/features">features Jobio</a> puis compare les plans via <a href="/#pricing">pricing</a>.</p>

<h2>Plan d'execution sur 14 jours</h2>
<p><strong>Jour 1-2:</strong> definir ICP + proposition de valeur.</p>
<p><strong>Jour 3-4:</strong> nettoyer profil et assets commerciaux.</p>
<p><strong>Jour 5-7:</strong> lancer 30 premiers contacts qualifies.</p>
<p><strong>Jour 8-10:</strong> appliquer la cadence de relances.</p>
<p><strong>Jour 11-14:</strong> revue KPI et ajustements.</p>
<p>Objectif: transformer la prospection en systeme reproductible, pas en sprint de survie.</p>
`,
  },
  {
    slug: "crm-freelance-criteres-stack-minimale",
    title: "CRM freelance: criteres de choix et stack minimale",
    description:
      "Comment choisir un CRM freelance utile (et pas gadget), avec une stack operationnelle minimale pour signer plus de missions.",
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
<p>Tu peux visualiser cette logique produit sur <a href="/features">/features</a> puis verifier les limites par plan sur <a href="/#pricing">/#pricing</a>.</p>

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
`,
  },
  {
    slug: "5-conseils-prospection-freelance",
    title: "5 conseils pour optimiser sa prospection freelance tech",
    description:
      "Les bonnes pratiques pour structurer sa prospection commerciale en tant que freelance dans la tech et maximiser son taux de conversion.",
    date: "2026-02-10",
    tags: ["Prospection", "Freelance", "Strategie"],
    readingTime: 5,
    content: `
<h2>1. Definir son positionnement avant de prospecter</h2>
<p>La premiere erreur que font la plupart des freelances tech est de prospecter sans avoir clarifie leur positionnement. Avant d'envoyer le moindre message, vous devez pouvoir repondre clairement a trois questions : quel probleme je resous, pour qui, et pourquoi moi plutot qu'un autre ?</p>
<p>Un positionnement clair vous permet de cibler les bonnes entreprises, de rediger des messages percutants et de justifier votre TJM. Sans cela, vous dispersez votre energie et vos messages restent generiques.</p>
<p><strong>Action concrete :</strong> redigez une phrase de positionnement en moins de 20 mots. Par exemple : "J'aide les startups SaaS B2B a scaler leur frontend React sans dette technique."</p>

<h2>2. Construire un pipeline structure</h2>
<p>La prospection ne doit pas etre un effort ponctuel. Les freelances qui signent regulierement des missions traitent leur prospection comme un processus commercial avec des etapes claires.</p>
<p>Un pipeline efficace comporte generalement ces etapes :</p>
<ul>
<li><strong>Identification :</strong> reperer les entreprises et contacts pertinents</li>
<li><strong>Premier contact :</strong> envoyer un message personnalise</li>
<li><strong>Qualification :</strong> comprendre le besoin et le budget</li>
<li><strong>Proposition :</strong> envoyer une offre claire et chiffree</li>
<li><strong>Negociation :</strong> ajuster les termes si necessaire</li>
<li><strong>Signature :</strong> formaliser l'accord</li>
</ul>
<p>En visualisant vos opportunites dans un pipeline, vous savez exactement ou concentrer vos efforts et combien de missions sont en cours de discussion.</p>

<h2>3. Automatiser les relances sans perdre en qualite</h2>
<p>La relance est le levier le plus sous-exploite par les freelances. La majorite des missions se signent apres 2 a 5 points de contact, mais la plupart des freelances abandonnent apres le premier message sans reponse.</p>
<p>La cle est de planifier vos relances a l'avance et de les espacer intelligemment. Un bon rythme est :</p>
<ul>
<li>J+3 apres le premier contact</li>
<li>J+7 si toujours pas de reponse</li>
<li>J+14 avec un angle different (partage d'article, cas client, actualite)</li>
</ul>
<p><strong>Important :</strong> chaque relance doit apporter de la valeur. Ne renvoyez jamais un simple "Avez-vous eu le temps de regarder mon message ?". Partagez plutot un insight, une etude de cas ou une actualite pertinente pour votre interlocuteur.</p>

<h2>4. Exploiter LinkedIn comme canal principal</h2>
<p>Pour les freelances tech, LinkedIn reste le canal de prospection le plus efficace. C'est la que se trouvent vos futurs clients : CTO, VP Engineering, Product Managers et Heads of Engineering.</p>
<p>Pour maximiser votre impact sur LinkedIn :</p>
<ul>
<li><strong>Optimisez votre profil :</strong> titre clair, resume oriente resultats, experiences detaillees</li>
<li><strong>Publiez regulierement :</strong> 2 a 3 posts par semaine sur votre expertise</li>
<li><strong>Commentez strategiquement :</strong> engagez sur les posts de vos prospects</li>
<li><strong>Envoyez des messages personnalises :</strong> mentionnez un element specifique du profil ou de l'entreprise</li>
</ul>
<p>Un profil LinkedIn bien optimise genere des demandes entrantes et renforce votre credibilite lors des approches sortantes.</p>

<h2>5. Mesurer et iterer sur ses performances</h2>
<p>Ce qui ne se mesure pas ne s'ameliore pas. Suivez vos metriques de prospection pour identifier ce qui fonctionne et ce qui doit etre ajuste.</p>
<p>Les indicateurs essentiels a suivre :</p>
<ul>
<li><strong>Taux de reponse :</strong> pourcentage de prospects qui repondent a vos messages</li>
<li><strong>Taux de conversion :</strong> pourcentage d'opportunites qui deviennent des missions</li>
<li><strong>Delai moyen de signature :</strong> temps entre le premier contact et la signature</li>
<li><strong>Source des missions :</strong> quel canal genere le plus de missions signees</li>
</ul>
<p>En analysant ces donnees chaque mois, vous pouvez doubler la mise sur les strategies qui fonctionnent et abandonner celles qui ne donnent pas de resultats. La prospection est un jeu d'optimisation continue.</p>
`,
  },
  {
    slug: "optimiser-profil-linkedin-freelance",
    title: "Comment optimiser son profil LinkedIn en tant que freelance",
    description:
      "Guide complet pour transformer votre profil LinkedIn en aimant a missions : titre, resume, experiences et strategie de contenu.",
    date: "2026-02-05",
    tags: ["LinkedIn", "Personal Branding", "Freelance"],
    readingTime: 6,
    content: `
<h2>Pourquoi votre profil LinkedIn est votre meilleur commercial</h2>
<p>En tant que freelance tech, votre profil LinkedIn est souvent le premier point de contact avec vos futurs clients. Avant meme de lire votre message de prospection, un prospect va consulter votre profil pour evaluer votre credibilite. Un profil bien optimise peut faire la difference entre un message ignore et un rendez-vous decroche.</p>
<p>LinkedIn compte plus de 28 millions d'utilisateurs en France. Parmi eux, des milliers de decideurs tech qui recherchent activement des freelances pour leurs projets. Votre profil doit les convaincre en moins de 30 secondes que vous etes la bonne personne.</p>

<h2>Le titre : votre accroche en 120 caracteres</h2>
<p>Le titre est l'element le plus visible de votre profil. Il apparait dans les resultats de recherche, les suggestions de connexion et a cote de chacun de vos commentaires et publications.</p>
<p><strong>Les erreurs classiques a eviter :</strong></p>
<ul>
<li>"Developpeur Fullstack" — trop generique, ne dit rien sur votre valeur</li>
<li>"En recherche de missions" — posture de demandeur, pas d'expert</li>
<li>"Freelance | React | Node | AWS | Docker | ..." — liste de technologies sans contexte</li>
</ul>
<p><strong>La formule qui fonctionne :</strong> [Ce que vous faites] pour [qui] | [Resultat ou preuve sociale]</p>
<p>Exemples efficaces :</p>
<ul>
<li>"Je construis des apps React performantes pour les startups SaaS | Ex-Lead Dev chez Doctolib"</li>
<li>"CTO freelance — j'aide les scale-ups a structurer leur equipe tech | 12 ans XP"</li>
<li>"Expert Data Engineering | Pipelines temps reel pour la fintech | AWS Certified"</li>
</ul>

<h2>Le resume : racontez votre histoire en 3 paragraphes</h2>
<p>Le resume (section "Info") est votre espace pour developper votre proposition de valeur. Structurez-le en trois parties :</p>
<p><strong>Paragraphe 1 — Le probleme :</strong> Decrivez le contexte de vos clients cibles et les defis auxquels ils font face. Montrez que vous comprenez leur realite.</p>
<p><strong>Paragraphe 2 — Votre solution :</strong> Expliquez comment vous aidez vos clients a resoudre ces problemes. Soyez concret : technologies, methodologies, type de livrables.</p>
<p><strong>Paragraphe 3 — La preuve :</strong> Partagez 2-3 resultats mesurables de vos missions precedentes. Les chiffres sont vos meilleurs allies : "reduction du temps de chargement de 60%", "migration de 200k utilisateurs sans downtime", "mise en production en 6 semaines".</p>

<h2>Les experiences : des etudes de cas, pas un CV</h2>
<p>Chaque experience sur votre profil LinkedIn devrait se lire comme une mini etude de cas, pas comme une ligne de CV. Pour chaque mission freelance ou poste passe, suivez cette structure :</p>
<ul>
<li><strong>Le contexte :</strong> quelle entreprise, quel secteur, quelle taille d'equipe</li>
<li><strong>Le defi :</strong> quel probleme technique ou business deviez-vous resoudre</li>
<li><strong>Votre contribution :</strong> ce que vous avez concretement fait et les technologies utilisees</li>
<li><strong>Le resultat :</strong> impact mesurable sur le business ou le produit</li>
</ul>
<p>Cette approche transforme votre profil en portfolio vivant et donne envie aux prospects d'en savoir plus.</p>

<h2>La strategie de contenu : devenir visible</h2>
<p>Un profil optimise ne suffit pas si personne ne le voit. La publication reguliere de contenu est le meilleur moyen d'augmenter votre visibilite et d'attirer des missions entrantes.</p>
<p>Types de contenus qui fonctionnent pour les freelances tech :</p>
<ul>
<li><strong>Retours d'experience :</strong> partagez les lecons apprises sur vos missions (sans rompre la confidentialite)</li>
<li><strong>Tutoriels et tips :</strong> montrez votre expertise a travers des conseils pratiques</li>
<li><strong>Opinions sur les tendances :</strong> positionnez-vous sur les sujets qui animent votre secteur</li>
<li><strong>Coulisses du freelancing :</strong> partagez votre quotidien, vos outils, votre organisation</li>
</ul>
<p>Publiez 2 a 3 fois par semaine, commentez les posts de vos prospects et engagez dans les groupes pertinents. La regularite prime sur la perfection : un post imparfait publie vaut mieux qu'un post parfait jamais ecrit.</p>

<h2>Les recommandations : votre preuve sociale</h2>
<p>Les recommandations LinkedIn sont l'equivalent des avis Google pour un freelance. Apres chaque mission reussie, demandez une recommandation a votre client en lui facilitant la tache : suggerez les points cles a mentionner et proposez-lui un brouillon qu'il pourra adapter.</p>
<p>Visez au minimum 5 recommandations de clients recents. Elles rassurent les prospects et renforcent votre credibilite de maniere significative.</p>
`,
  },
  {
    slug: "comment-fixer-son-tjm",
    title: "Comment fixer et negocier son TJM en freelance tech",
    description:
      "Methode complete pour calculer son Taux Journalier Moyen, le justifier face aux clients et negocier avec confiance.",
    date: "2026-01-28",
    tags: ["TJM", "Negociation", "Freelance"],
    readingTime: 7,
    content: `
<h2>Comprendre ce qu'est vraiment le TJM</h2>
<p>Le Taux Journalier Moyen (TJM) est le prix que vous facturez pour une journee de travail en tant que freelance. C'est l'indicateur central de votre activite : il determine votre chiffre d'affaires, votre rentabilite et votre positionnement sur le marche.</p>
<p>Beaucoup de freelances fixent leur TJM en se basant uniquement sur ce qu'ils voient autour d'eux ou sur leur ancien salaire converti. C'est une erreur. Votre TJM doit refleter la valeur que vous apportez a vos clients, pas simplement couvrir vos charges.</p>

<h2>La methode de calcul en 4 etapes</h2>
<p><strong>Etape 1 : Definir votre revenu net cible</strong></p>
<p>Commencez par determiner le revenu net annuel que vous souhaitez vous verser. Prenez en compte votre niveau de vie, vos projets personnels et votre epargne. Soyez realiste mais ambitieux.</p>

<p><strong>Etape 2 : Ajouter vos charges</strong></p>
<p>En freelance, vos charges representent generalement entre 40% et 55% de votre chiffre d'affaires selon votre statut juridique. Incluez :</p>
<ul>
<li>Cotisations sociales (URSSAF, retraite, prevoyance)</li>
<li>Mutuelle et assurance RC Pro</li>
<li>Comptabilite et frais bancaires</li>
<li>Materiel, logiciels et abonnements</li>
<li>Espace de coworking ou bureau</li>
<li>Formation continue</li>
</ul>

<p><strong>Etape 3 : Estimer vos jours facturables</strong></p>
<p>Un freelance ne facture pas 365 jours par an. Deduisez les week-ends, vacances, jours feries, jours de prospection, formation et intercontrat. En moyenne, un freelance tech facture entre 180 et 220 jours par an.</p>

<p><strong>Etape 4 : Calculer votre TJM plancher</strong></p>
<p>La formule : TJM = (Revenu net cible + Charges) / Nombre de jours facturables</p>
<p>Exemple concret : pour un revenu net de 60 000 euros avec 45% de charges et 200 jours facturables, le TJM plancher est de (60 000 + 49 000) / 200 = 545 euros/jour. C'est votre minimum, pas votre objectif.</p>

<h2>Positionner son TJM sur le marche</h2>
<p>Le TJM plancher est un point de depart. Votre tarif reel doit aussi prendre en compte votre positionnement marche. Plusieurs facteurs influencent la fourchette :</p>
<ul>
<li><strong>Seniorite :</strong> un freelance avec 8+ ans d'experience peut facturer 30 a 50% de plus qu'un profil de 3 ans</li>
<li><strong>Specialisation :</strong> les expertises rares (securite, data engineering, DevOps avance) commandent des TJM plus eleves</li>
<li><strong>Secteur client :</strong> la finance et la sante paient generalement plus que le e-commerce ou les startups early-stage</li>
<li><strong>Localisation :</strong> les missions parisiennes sont en moyenne 15 a 25% plus elevees que les missions en region</li>
<li><strong>Type de mission :</strong> une mission de conseil ou d'architecture se facture plus qu'une mission de production pure</li>
</ul>
<p>Consultez les barometres de TJM (Malt, Comet, Free-Work) pour vous situer. Visez le quartile superieur de votre categorie si votre profil le justifie.</p>

<h2>Les strategies de negociation</h2>
<p>La negociation du TJM est un moment cle qui determine la rentabilite de votre mission. Voici les principes a retenir :</p>
<p><strong>Ne jamais donner son prix en premier.</strong> Demandez d'abord le budget prevu par le client. Si le client insiste, donnez une fourchette haute. Il est toujours plus facile de descendre que de remonter.</p>
<p><strong>Justifier par la valeur, pas par le cout.</strong> Ne dites pas "je facture 650 euros parce que j'ai des charges". Dites "sur ma derniere mission similaire, j'ai permis a l'equipe de livrer 3 semaines plus tot que prevu, ce qui a genere 80K euros de revenus supplementaires".</p>
<p><strong>Avoir un BATNA solide.</strong> Le BATNA (Best Alternative To a Negotiated Agreement) est votre meilleure alternative si la negociation echoue. Si vous avez d'autres opportunites en cours, vous negociez avec plus de serenite et de fermete.</p>

<h2>Quand et comment augmenter son TJM</h2>
<p>Votre TJM n'est pas fixe dans le marbre. Prevoyez de le revaluer regulierement :</p>
<ul>
<li><strong>A chaque nouvelle mission :</strong> c'est le moment le plus naturel pour ajuster votre tarif a la hausse</li>
<li><strong>Apres une certification ou formation significative :</strong> une nouvelle competence justifie une revalorisation</li>
<li><strong>Tous les 12 mois sur une mission longue :</strong> negociez une clause de revalorisation annuelle dans vos contrats</li>
<li><strong>Quand votre taux d'occupation depasse 90% :</strong> si vous refusez des missions, c'est que votre prix est trop bas</li>
</ul>
<p>Augmentez par paliers de 5 a 10%. Une hausse trop brutale peut effrayer les clients, meme si elle est justifiee. La progression reguliere est plus efficace qu'un rattrapage soudain.</p>

<h2>Les erreurs a eviter absolument</h2>
<p>Pour conclure, voici les pieges les plus courants dans la gestion du TJM :</p>
<ul>
<li><strong>Casser ses prix pour decrocher une mission :</strong> vous creez un precedent difficile a corriger et signalez un manque de confiance</li>
<li><strong>Ne pas differencier ses tarifs :</strong> une mission de 2 jours et une mission de 6 mois n'ont pas le meme TJM. Facturez plus cher les missions courtes</li>
<li><strong>Oublier les frais annexes :</strong> deplacements, materiel specifique, astreintes doivent etre factures en plus du TJM</li>
<li><strong>Comparer son TJM au salaire :</strong> un TJM de 500 euros ne correspond pas a un salaire de 500 euros par jour. Les charges, l'intercontrat et les risques changent completement l'equation</li>
</ul>
<p>Votre TJM est le reflet de votre valeur percue. Investissez dans votre expertise, votre visibilite et votre capacite a demontrer des resultats concrets : votre tarif suivra naturellement.</p>
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
