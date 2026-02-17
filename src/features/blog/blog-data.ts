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
