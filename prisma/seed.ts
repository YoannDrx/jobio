import { logger } from "@/lib/logger";
import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";
import { prisma } from "../src/lib/prisma";
import { LINKEDIN_PROGRAMS_DATA } from "./data/linkedin-programs-data";

// Set seed for reproducibility
faker.seed(123);

const PLATFORMS_DATA = [
  {
    name: "Malt",
    slug: "malt",
    website: "https://www.malt.fr",
    category: "GENERALIST" as const,
  },
  {
    name: "Comet",
    slug: "comet",
    website: "https://www.comet.co",
    category: "SPECIALIZED" as const,
  },
  {
    name: "Free-Work",
    slug: "free-work",
    website: "https://www.free-work.com",
    category: "GENERALIST" as const,
  },
  {
    name: "Creme de la Creme",
    slug: "creme-de-la-creme",
    website: "https://www.cremedelacreme.io",
    category: "SPECIALIZED" as const,
  },
  {
    name: "Upwork",
    slug: "upwork",
    website: "https://www.upwork.com",
    category: "GENERALIST" as const,
  },
  {
    name: "Toptal",
    slug: "toptal",
    website: "https://www.toptal.com",
    category: "ENTERPRISE" as const,
  },
  {
    name: "LinkedIn",
    slug: "linkedin",
    website: "https://www.linkedin.com",
    category: "GENERALIST" as const,
  },
  {
    name: "Kicklox",
    slug: "kicklox",
    website: "https://www.kicklox.com",
    category: "SPECIALIZED" as const,
  },
  {
    name: "LittleBig Connection",
    slug: "littlebig-connection",
    website: "https://www.littlebigconnection.com",
    category: "ENTERPRISE" as const,
  },
  {
    name: "Freelance.com",
    slug: "freelance-com",
    website: "https://www.freelance.com",
    category: "GENERALIST" as const,
  },
  {
    name: "Talent.io",
    slug: "talent-io",
    website: "https://www.talent.io",
    category: "SPECIALIZED" as const,
  },
  {
    name: "Le Hibou",
    slug: "le-hibou",
    website: "https://www.lehibou.com",
    category: "ENTERPRISE" as const,
  },
  {
    name: "Shine",
    slug: "shine",
    website: "https://www.shine.fr",
    category: "GENERALIST" as const,
  },
  {
    name: "Club Freelance",
    slug: "club-freelance",
    website: "https://www.club-freelance.com",
    category: "SPECIALIZED" as const,
  },
  {
    name: "Fiverr",
    slug: "fiverr",
    website: "https://www.fiverr.com",
    category: "GENERALIST" as const,
  },
] as const;

const SYSTEM_TEMPLATES = [
  {
    name: "Premier contact",
    type: "FIRST_CONTACT" as const,
    subject: "Candidature - {{mission}}",
    body: `Bonjour {{prenom}},

Je me permets de vous contacter concernant la mission "{{mission}}" chez {{entreprise}}.

Mon profil correspond aux besoins exprimes : je suis disponible et mon TJM se situe autour de {{tjm}} EUR.

Je serais ravi d'echanger avec vous pour en discuter.

Cordialement`,
    variables: ["prenom", "mission", "entreprise", "tjm"],
  },
  {
    name: "Relance J+3",
    type: "FOLLOW_UP_J3" as const,
    subject: "Re: Candidature - {{mission}}",
    body: `Bonjour {{prenom}},

Je me permets de revenir vers vous concernant ma candidature pour la mission "{{mission}}" chez {{entreprise}}.

Avez-vous eu l'occasion d'examiner mon profil ? Je reste disponible pour un echange.

Cordialement`,
    variables: ["prenom", "mission", "entreprise"],
  },
  {
    name: "Relance J+7",
    type: "FOLLOW_UP_J7" as const,
    subject: "Re: Candidature - {{mission}}",
    body: `Bonjour {{prenom}},

Je reviens vers vous une nouvelle fois au sujet de la mission "{{mission}}".

Si le poste est toujours ouvert, je serais ravi d'en discuter. Dans le cas contraire, n'hesitez pas a me le signaler.

Bien cordialement`,
    variables: ["prenom", "mission"],
  },
  {
    name: "Relance J+14",
    type: "FOLLOW_UP_J14" as const,
    subject: "Suivi - {{mission}}",
    body: `Bonjour {{prenom}},

Je souhaitais prendre des nouvelles concernant la mission "{{mission}}" chez {{entreprise}}.

Est-ce que le besoin est toujours d'actualite ? Je reste motive et disponible.

Cordialement`,
    variables: ["prenom", "mission", "entreprise"],
  },
  {
    name: "Post-entretien",
    type: "POST_INTERVIEW" as const,
    subject: "Suite a notre echange - {{mission}}",
    body: `Bonjour {{prenom}},

Je tenais a vous remercier pour notre echange d'aujourd'hui concernant la mission "{{mission}}".

Les sujets abordes confirment mon interet pour cette mission. Je suis convaincu de pouvoir apporter une reelle valeur ajoutee a {{entreprise}}.

Je reste a votre disposition pour toute question complementaire.

Cordialement`,
    variables: ["prenom", "mission", "entreprise"],
  },
  {
    name: "Negociation TJM",
    type: "NEGOTIATION" as const,
    subject: "Re: Proposition - {{mission}}",
    body: `Bonjour {{prenom}},

Merci pour votre proposition concernant la mission "{{mission}}".

Compte tenu de mon experience et de la complexite du projet, je souhaiterais discuter du TJM propose. Mon tarif habituel pour ce type de mission se situe autour de {{tjm}} EUR/jour.

Seriez-vous ouvert a en discuter ?

Cordialement`,
    variables: ["prenom", "mission", "tjm"],
  },
  {
    name: "Remerciement refus",
    type: "THANK_YOU" as const,
    subject: "Re: {{mission}}",
    body: `Bonjour {{prenom}},

Je vous remercie pour votre retour concernant la mission "{{mission}}".

Meme si le resultat n'est pas celui espere, j'ai apprecie nos echanges. N'hesitez pas a me recontacter si un besoin similaire se presente a l'avenir.

Cordialement`,
    variables: ["prenom", "mission"],
  },
  {
    name: "Demande de feedback",
    type: "CUSTOM" as const,
    subject: "Retour sur la mission {{mission}}",
    body: `Bonjour {{prenom}},

La mission "{{mission}}" chez {{entreprise}} touche a sa fin et je souhaitais recueillir votre retour.

Comment evaluez-vous notre collaboration ? Vos remarques me sont precieuses pour continuer a m'ameliorer.

Merci d'avance pour votre temps.

Cordialement`,
    variables: ["prenom", "mission", "entreprise"],
  },
];

async function main() {
  logger.info("Seeding database for Jobio...");

  // Create admin user
  const adminEmail = "admin@jobio.app";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: nanoid(11),
      name: "Admin Jobio",
      email: adminEmail,
      emailVerified: true,
      image: faker.image.avatar(),
      stripeCustomerId: `cus_admin_${nanoid(14)}`,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  logger.info(`Created ADMIN user: ${adminUser.name} (${adminUser.email})`);

  // Create test freelance user
  const testEmail = "freelance@jobio.app";
  const testUser = await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      id: nanoid(11),
      name: "Thomas Dupont",
      email: testEmail,
      emailVerified: true,
      image: faker.image.avatar(),
      stripeCustomerId: `cus_test_${nanoid(14)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  logger.info(`Created TEST user: ${testUser.name} (${testUser.email})`);

  // Seed platforms
  const platforms = await Promise.all(
    PLATFORMS_DATA.map(async (p) =>
      prisma.platform.upsert({
        where: { slug: p.slug },
        update: {},
        create: {
          id: nanoid(11),
          name: p.name,
          slug: p.slug,
          website: p.website,
          category: p.category,
          isSystem: true,
        },
      }),
    ),
  );
  logger.info(`Created ${platforms.length} platforms`);

  // Seed system templates
  await Promise.all(
    SYSTEM_TEMPLATES.map(async (t) =>
      prisma.messageTemplate.upsert({
        where: { id: `tpl_${t.type.toLowerCase()}` },
        update: {},
        create: {
          id: `tpl_${t.type.toLowerCase()}`,
          name: t.name,
          type: t.type,
          subject: t.subject,
          body: t.body,
          variables: t.variables,
          isSystem: true,
          userId: null,
        },
      }),
    ),
  );
  logger.info(`Created ${SYSTEM_TEMPLATES.length} system templates`);

  // Register test user on some platforms
  const maltPlatform = platforms.find((p) => p.slug === "malt");
  const cometPlatform = platforms.find((p) => p.slug === "comet");
  const linkedinPlatform = platforms.find((p) => p.slug === "linkedin");

  if (!maltPlatform || !cometPlatform || !linkedinPlatform) {
    throw new Error("Required platforms not found");
  }

  await Promise.all(
    [maltPlatform, cometPlatform, linkedinPlatform].map(async (platform) =>
      prisma.userPlatform.upsert({
        where: {
          userId_platformId: {
            userId: testUser.id,
            platformId: platform.id,
          },
        },
        update: {},
        create: {
          id: nanoid(11),
          userId: testUser.id,
          platformId: platform.id,
          status: "ACTIVE",
          profileUrl: `https://${platform.slug}.example.com/thomas-dupont`,
        },
      }),
    ),
  );
  logger.info("Registered test user on 3 platforms");

  // Create profiles for test user
  await prisma.userProfile.create({
    data: {
      id: nanoid(11),
      userId: testUser.id,
      name: "Fullstack React/Node",
      headline: "Developpeur Fullstack React & Node.js - 8 ans d'experience",
      bio: "Specialiste React, Next.js et Node.js. J'accompagne les startups et scale-ups dans la construction de produits web performants.",
      skills: [
        { name: "React", level: "EXPERT", yearsExp: 7 },
        { name: "Next.js", level: "EXPERT", yearsExp: 5 },
        { name: "Node.js", level: "ADVANCED", yearsExp: 8 },
        { name: "TypeScript", level: "EXPERT", yearsExp: 6 },
        { name: "PostgreSQL", level: "ADVANCED", yearsExp: 5 },
      ],
      tjmTarget: 650,
      workTypePreference: "REMOTE",
      zone: "Paris / Full remote",
      isDefault: true,
    },
  });

  await prisma.userProfile.create({
    data: {
      id: nanoid(11),
      userId: testUser.id,
      name: "React Native Mobile",
      headline: "Developpeur Mobile React Native",
      bio: "Developpement d'applications mobiles cross-platform avec React Native et Expo.",
      skills: [
        { name: "React Native", level: "ADVANCED", yearsExp: 4 },
        { name: "Expo", level: "ADVANCED", yearsExp: 3 },
        { name: "TypeScript", level: "EXPERT", yearsExp: 6 },
      ],
      tjmTarget: 600,
      workTypePreference: "HYBRID",
      zone: "Ile-de-France",
      isDefault: false,
    },
  });
  logger.info("Created 2 profiles for test user");

  // Create contacts for test user
  const contactsData = [
    {
      firstName: "Sophie",
      lastName: "Martin",
      company: "TechCorp",
      email: "sophie.martin@techcorp.fr",
      role: "CTO",
      linkedinUrl: "https://linkedin.com/in/sophie-martin",
    },
    {
      firstName: "Pierre",
      lastName: "Leroy",
      company: "StartupAI",
      email: "pierre@startupai.io",
      role: "Lead Dev",
      linkedinUrl: "https://linkedin.com/in/pierre-leroy",
    },
    {
      firstName: "Julie",
      lastName: "Moreau",
      company: "Malt",
      email: "julie.moreau@malt.fr",
      role: "Account Manager",
    },
  ];

  const contacts = await Promise.all(
    contactsData.map(async (c) =>
      prisma.contact.create({
        data: {
          id: nanoid(11),
          userId: testUser.id,
          ...c,
        },
      }),
    ),
  );
  logger.info(`Created ${contacts.length} contacts`);

  // Create missions for test user
  const missionsData = [
    {
      title: "Developpeur React Senior - Refonte Dashboard",
      company: "TechCorp",
      description:
        "Refonte complete du dashboard client avec React, Next.js et TailwindCSS.",
      status: "ENTRETIEN" as const,
      priority: "HIGH" as const,
      tjm: 650,
      duration: "6 mois",
      workType: "REMOTE" as const,
      location: "Paris",
      stack: ["React", "Next.js", "TypeScript", "TailwindCSS"],
      sourceUrl: "https://www.malt.fr/mission/12345",
      score: 85,
      platformId: maltPlatform.id,
      contactId: contacts[0].id,
    },
    {
      title: "Fullstack Node.js - API Marketplace",
      company: "StartupAI",
      description:
        "Construction d'une API REST pour une marketplace B2B avec Node.js et PostgreSQL.",
      status: "POSTULE" as const,
      priority: "MEDIUM" as const,
      tjm: 600,
      duration: "4 mois",
      workType: "HYBRID" as const,
      location: "Lyon",
      stack: ["Node.js", "Express", "PostgreSQL", "Redis"],
      score: 72,
      platformId: cometPlatform.id,
      contactId: contacts[1].id,
    },
    {
      title: "React Native - App Mobile Sante",
      company: "HealthTech Solutions",
      description:
        "Developpement d'une app mobile de suivi sante avec React Native et Expo.",
      status: "A_POSTULER" as const,
      priority: "MEDIUM" as const,
      tjm: 580,
      duration: "3 mois",
      workType: "REMOTE" as const,
      stack: ["React Native", "Expo", "TypeScript", "Firebase"],
      sourceUrl: "https://www.free-work.com/mission/67890",
      score: 65,
    },
    {
      title: "Lead Dev Frontend - Scale-up Fintech",
      company: "PayFlow",
      description:
        "Lead technique frontend pour une equipe de 5 devs. Migration vers Next.js App Router.",
      status: "PROPOSITION" as const,
      priority: "URGENT" as const,
      tjm: 750,
      duration: "12 mois",
      workType: "HYBRID" as const,
      location: "Paris 9e",
      stack: ["React", "Next.js", "TypeScript", "GraphQL", "Storybook"],
      score: 92,
      platformId: linkedinPlatform.id,
    },
    {
      title: "Developpeur TypeScript - Migration Legacy",
      company: "BigBank",
      description:
        "Migration progressive d'une app Angular vers React/Next.js.",
      status: "ACCEPTE" as const,
      priority: "HIGH" as const,
      tjm: 700,
      duration: "8 mois",
      workType: "ONSITE" as const,
      location: "La Defense",
      stack: ["React", "Angular", "TypeScript", "Node.js"],
      score: 78,
    },
  ];

  // Create missions sequentially since activity events depend on mission ids
  const missions = [];
  for (const m of missionsData) {
    // eslint-disable-next-line no-await-in-loop
    const mission = await prisma.mission.create({
      data: {
        id: nanoid(11),
        userId: testUser.id,
        ...m,
      },
    });
    missions.push(mission);

    // eslint-disable-next-line no-await-in-loop
    await prisma.activityEvent.create({
      data: {
        id: nanoid(11),
        missionId: mission.id,
        userId: testUser.id,
        type: "MISSION_CREATED",
        description: `Mission "${mission.title}" creee`,
      },
    });
  }
  logger.info(`Created ${missions.length} missions with activity events`);

  // Create follow-ups for some missions
  const now = new Date();
  const followUpsData = [
    {
      missionId: missions[0].id,
      type: "MEETING" as const,
      title: "Entretien technique TechCorp",
      description: "Entretien technique avec le CTO - preparer demo portfolio",
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      missionId: missions[1].id,
      type: "EMAIL" as const,
      title: "Relance J+3 StartupAI",
      description: "Envoyer relance apres candidature",
      scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      missionId: missions[1].id,
      type: "EMAIL" as const,
      title: "Relance J+7 StartupAI",
      description: "Deuxieme relance si pas de reponse",
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      missionId: missions[0].id,
      type: "EMAIL" as const,
      title: "Relance post-entretien TechCorp",
      scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      isOverdue: true,
    },
  ];

  await Promise.all(
    followUpsData.map(async (f) =>
      prisma.followUp.create({
        data: {
          id: nanoid(11),
          userId: testUser.id,
          ...f,
        },
      }),
    ),
  );
  logger.info(`Created ${followUpsData.length} follow-ups`);

  // Create contact interactions
  await Promise.all([
    prisma.contactInteraction.create({
      data: {
        id: nanoid(11),
        contactId: contacts[0].id,
        type: "MEETING",
        description: "Premier call de presentation - 30min",
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.contactInteraction.create({
      data: {
        id: nanoid(11),
        contactId: contacts[1].id,
        type: "EMAIL",
        description: "Envoi candidature via Comet",
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  logger.info("Created contact interactions");

  // Create some regular users
  const users = await Promise.all(
    Array.from({ length: 5 }, async (_, index) => {
      const email = faker.internet.email();
      return prisma.user
        .upsert({
          where: { email },
          update: {},
          create: {
            id: nanoid(11),
            name: faker.person.fullName(),
            email,
            emailVerified: faker.datatype.boolean(0.8),
            image: faker.image.avatar(),
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            stripeCustomerId: `cus_${nanoid(14)}`,
          },
        })
        .then(async (user) => {
          if (faker.datatype.boolean(0.4)) {
            const plans = ["free", "pro", "ultra"];
            const selectedPlan = faker.helpers.arrayElement(plans);
            await prisma.subscription.upsert({
              where: { referenceId: user.id },
              update: {},
              create: {
                id: `sub_${Date.now()}_${index}`,
                plan: selectedPlan,
                referenceId: user.id,
                stripeCustomerId: user.stripeCustomerId ?? `cus_${nanoid(14)}`,
                stripeSubscriptionId: `sub_${nanoid(14)}`,
                status: "active",
                periodStart: faker.date.past({ years: 1 }),
                periodEnd: faker.date.future({ years: 1 }),
                cancelAtPeriodEnd: false,
              },
            });
          }
          return user;
        });
    }),
  );
  logger.info(`Created ${users.length} additional users`);

  // Seed LinkedIn programs and templates
  for (const programData of LINKEDIN_PROGRAMS_DATA) {
    const { templates, ...programFields } = programData;

    const authorImage =
      "authorImage" in programFields
        ? (programFields as { authorImage?: string }).authorImage
        : undefined;

    // eslint-disable-next-line no-await-in-loop
    const program = await prisma.linkedInProgram.upsert({
      where: { slug: programFields.slug },
      update: {
        title: programFields.title,
        description: programFields.description,
        longDescription: programFields.longDescription,
        authorName: programFields.authorName,
        authorImage,
        price: programFields.price,
        currency: programFields.currency,
        isFree: programFields.isFree,
        templateCount: programFields.templateCount,
        order: programFields.order,
      },
      create: {
        id: nanoid(11),
        slug: programFields.slug,
        title: programFields.title,
        description: programFields.description,
        longDescription: programFields.longDescription,
        authorName: programFields.authorName,
        authorImage,
        price: programFields.price,
        currency: programFields.currency,
        isFree: programFields.isFree,
        templateCount: programFields.templateCount,
        order: programFields.order,
      },
    });

    // Delete existing templates and recreate them
    // eslint-disable-next-line no-await-in-loop
    await prisma.linkedInTemplate.deleteMany({
      where: { programId: program.id },
    });

    // eslint-disable-next-line no-await-in-loop
    await prisma.linkedInTemplate.createMany({
      data: templates.map((t) => ({
        id: nanoid(11),
        programId: program.id,
        title: t.title,
        hook: t.hook,
        body: t.body,
        tips: t.tips,
        category:
          "category" in t ? (t as { category?: string }).category : undefined,
        order: t.order,
      })),
    });

    logger.info(
      `Seeded program "${program.title}" with ${templates.length} templates`,
    );
  }
  logger.info(`Seeded ${LINKEDIN_PROGRAMS_DATA.length} LinkedIn programs`);

  logger.info("Database seeded successfully!");
  logger.info(`Admin login: ${adminEmail}`);
  logger.info(`Test freelance login: ${testEmail}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error("Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
