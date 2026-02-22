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
