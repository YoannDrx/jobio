import { tool } from "ai";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export function createChatTools(userId: string) {
  return {
    getWorkspaceOverview: tool({
      description:
        "Obtenir une vue d'ensemble du pipeline de missions : nombre de missions par statut, follow-ups en attente, et resume du profil utilisateur",
      inputSchema: z.object({}),
      execute: async () => {
        const [missionsByStatus, pendingFollowUps, profile] = await Promise.all(
          [
            prisma.mission.groupBy({
              by: ["status"],
              where: { userId, deletedAt: null },
              _count: { id: true },
            }),
            prisma.followUp.count({
              where: { userId, completedAt: null },
            }),
            prisma.userProfile.findFirst({
              where: { userId, isDefault: true },
              select: {
                name: true,
                headline: true,
                skills: true,
                tjmTarget: true,
                zone: true,
              },
            }),
          ],
        );

        const pipeline = missionsByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        );

        const totalMissions = missionsByStatus.reduce(
          (sum, item) => sum + item._count.id,
          0,
        );

        return {
          pipeline,
          totalMissions,
          pendingFollowUps,
          profile: profile
            ? {
                name: profile.name,
                headline: profile.headline,
                tjmTarget: profile.tjmTarget,
                zone: profile.zone,
                skills: Array.isArray(profile.skills)
                  ? (profile.skills as { name: string }[])
                      .map((s) => s.name)
                      .join(", ")
                  : null,
              }
            : null,
        };
      },
    }),

    searchMissions: tool({
      description:
        "Rechercher des missions par mot-cle, statut ou entreprise. Utile pour trouver des missions specifiques dans le pipeline.",
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe("Mot-cle de recherche (titre, entreprise, stack)"),
        status: z
          .string()
          .optional()
          .describe(
            "Filtrer par statut : A_POSTULER, POSTULE, ENTRETIEN, PROPOSITION, ACCEPTE, REFUSE, EN_PAUSE, ABANDONNE, ARCHIVE",
          ),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Nombre maximum de resultats"),
      }),
      execute: async ({ query, status, limit }) => {
        const where: Record<string, unknown> = {
          userId,
          deletedAt: null,
        };

        if (status) {
          where.status = status;
        }

        if (query) {
          where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { stack: { has: query } },
          ];
        }

        const missions = await prisma.mission.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: {
            id: true,
            title: true,
            company: true,
            status: true,
            priority: true,
            tjm: true,
            duration: true,
            workType: true,
            location: true,
            stack: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { missions, count: missions.length };
      },
    }),

    getMissionDetails: tool({
      description:
        "Obtenir les details complets d'une mission specifique par son ID, incluant le contact, la plateforme et les follow-ups.",
      inputSchema: z.object({
        missionId: z.string().describe("L'ID de la mission"),
      }),
      execute: async ({ missionId }) => {
        const mission = await prisma.mission.findFirst({
          where: { id: missionId, userId, deletedAt: null },
          include: {
            contact: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                company: true,
              },
            },
            platform: { select: { name: true } },
            followUps: {
              where: { completedAt: null },
              orderBy: { scheduledAt: "asc" },
              take: 5,
              select: {
                id: true,
                title: true,
                type: true,
                scheduledAt: true,
                isOverdue: true,
              },
            },
          },
        });

        if (!mission) {
          return { error: "Mission introuvable" };
        }

        return {
          id: mission.id,
          title: mission.title,
          company: mission.company,
          description: mission.description,
          status: mission.status,
          priority: mission.priority,
          tjm: mission.tjm,
          duration: mission.duration,
          workType: mission.workType,
          location: mission.location,
          stack: mission.stack,
          sourceUrl: mission.sourceUrl,
          notes: mission.notes,
          contact: mission.contact,
          platform: mission.platform?.name ?? null,
          followUps: mission.followUps,
          createdAt: mission.createdAt,
          updatedAt: mission.updatedAt,
        };
      },
    }),

    getFollowUps: tool({
      description:
        "Obtenir les follow-ups (relances) en attente, tries par date. Utile pour savoir quelles actions sont a faire prochainement.",
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Nombre maximum de resultats"),
      }),
      execute: async ({ limit }) => {
        const followUps = await prisma.followUp.findMany({
          where: { userId, completedAt: null },
          orderBy: { scheduledAt: "asc" },
          take: limit,
          include: {
            mission: {
              select: {
                id: true,
                title: true,
                company: true,
                status: true,
              },
            },
          },
        });

        return {
          followUps: followUps.map((f) => ({
            id: f.id,
            title: f.title,
            type: f.type,
            scheduledAt: f.scheduledAt,
            isOverdue: f.isOverdue,
            mission: f.mission,
          })),
          count: followUps.length,
        };
      },
    }),

    getProfile: tool({
      description:
        "Obtenir le profil par defaut de l'utilisateur avec ses competences, experiences et preferences.",
      inputSchema: z.object({}),
      execute: async () => {
        const profile = await prisma.userProfile.findFirst({
          where: { userId, isDefault: true },
        });

        if (!profile) {
          return { error: "Aucun profil par defaut trouve" };
        }

        return {
          name: profile.name,
          headline: profile.headline,
          bio: profile.bio,
          skills: profile.skills,
          experiences: profile.experiences,
          education: profile.education,
          certifications: profile.certifications,
          languages: profile.languages,
          projects: profile.projects,
          tjmTarget: profile.tjmTarget,
          workTypePreference: profile.workTypePreference,
          zone: profile.zone,
          minDuration: profile.minDuration,
          maxDuration: profile.maxDuration,
        };
      },
    }),

    getFreelanceOverview: tool({
      description:
        "Obtenir une vue d'ensemble de l'activite freelance : clients actifs, factures en attente, CA du mois en cours",
      inputSchema: z.object({}),
      execute: async () => {
        const [clients, pendingInvoices, monthRevenue] = await Promise.all([
          prisma.billingClient.count({
            where: { userId, deletedAt: null },
          }),
          prisma.billingInvoice.count({
            where: { userId, status: "ISSUED", deletedAt: null },
          }),
          prisma.billingInvoice.aggregate({
            where: {
              userId,
              status: { in: ["ISSUED", "PAID"] },
              deletedAt: null,
              issuedAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                ),
              },
            },
            _sum: { totalCents: true },
          }),
        ]);
        return {
          totalClients: clients,
          pendingInvoices,
          monthRevenueCents: monthRevenue._sum.totalCents ?? 0,
        };
      },
    }),

    getProfilesOverview: tool({
      description:
        "Obtenir un resume de tous les profils de l'utilisateur avec leurs competences principales",
      inputSchema: z.object({}),
      execute: async () => {
        const profiles = await prisma.userProfile.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            headline: true,
            skills: true,
            tjmTarget: true,
            isDefault: true,
          },
        });
        return {
          profiles: profiles.map((p) => ({
            name: p.name,
            headline: p.headline,
            tjmTarget: p.tjmTarget,
            isDefault: p.isDefault,
            skills: Array.isArray(p.skills)
              ? (p.skills as { name: string }[]).map((s) => s.name).slice(0, 5)
              : [],
          })),
          count: profiles.length,
        };
      },
    }),

    getCalendarOverview: tool({
      description:
        "Obtenir les relances et evenements a venir dans les 7 prochains jours",
      inputSchema: z.object({}),
      execute: async () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const followUps = await prisma.followUp.findMany({
          where: {
            userId,
            completedAt: null,
            scheduledAt: { lte: nextWeek },
          },
          orderBy: { scheduledAt: "asc" },
          take: 15,
          include: {
            mission: { select: { title: true, company: true } },
          },
        });
        const overdue = followUps.filter((f) => f.isOverdue);
        return {
          upcoming: followUps.map((f) => ({
            title: f.title,
            type: f.type,
            scheduledAt: f.scheduledAt,
            isOverdue: f.isOverdue,
            mission: f.mission.title,
            company: f.mission.company,
          })),
          overdueCount: overdue.length,
          totalCount: followUps.length,
        };
      },
    }),

    getContacts: tool({
      description:
        "Rechercher des contacts par nom, entreprise ou tag. Retourne les contacts avec le nombre de missions et interactions associees.",
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe("Recherche par nom, entreprise ou tag"),
        limit: z.number().optional().default(10),
      }),
      execute: async ({ query, limit }) => {
        const where: Record<string, unknown> = {
          userId,
          deletedAt: null,
        };

        if (query) {
          where.OR = [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { tags: { has: query } },
          ];
        }

        const contacts = await prisma.contact.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: limit,
          include: {
            _count: {
              select: {
                missions: true,
                interactions: true,
              },
            },
          },
        });

        return {
          contacts: contacts.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            company: c.company,
            email: c.email,
            role: c.role,
            tags: c.tags,
            missionsCount: c._count.missions,
            interactionsCount: c._count.interactions,
          })),
          count: contacts.length,
        };
      },
    }),

    getContactDetails: tool({
      description:
        "Obtenir les details d'un contact specifique avec son historique d'interactions et ses missions liees.",
      inputSchema: z.object({
        contactId: z.string().describe("L'ID du contact"),
      }),
      execute: async ({ contactId }) => {
        const contact = await prisma.contact.findFirst({
          where: { id: contactId, userId, deletedAt: null },
          include: {
            interactions: {
              orderBy: { date: "desc" },
              take: 10,
            },
            missions: {
              where: { deletedAt: null },
              select: {
                id: true,
                title: true,
                company: true,
                status: true,
              },
              take: 10,
            },
          },
        });

        if (!contact) {
          return { error: "Contact introuvable" };
        }

        return {
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          company: contact.company,
          email: contact.email,
          phone: contact.phone,
          linkedinUrl: contact.linkedinUrl,
          role: contact.role,
          notes: contact.notes,
          tags: contact.tags,
          interactions: contact.interactions.map((i) => ({
            type: i.type,
            description: i.description,
            date: i.date,
          })),
          missions: contact.missions,
        };
      },
    }),

    getCompanies: tool({
      description:
        "Lister les entreprises cibles avec leur statut de prospection et le contact associe.",
      inputSchema: z.object({
        status: z
          .string()
          .optional()
          .describe(
            "Filtrer par statut : A_DEMARCHER, CONTACTE, EN_DISCUSSION, REFUSE",
          ),
        limit: z.number().optional().default(15),
      }),
      execute: async ({ status, limit }) => {
        const where: Record<string, unknown> = { userId };
        if (status) where.status = status;

        const companies = await prisma.targetCompany.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: limit,
          include: {
            contact: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        return {
          companies: companies.map((c) => ({
            id: c.id,
            name: c.name,
            sector: c.sector,
            size: c.size,
            status: c.status,
            website: c.website,
            contact: c.contact
              ? `${c.contact.firstName} ${c.contact.lastName}`
              : null,
          })),
          count: companies.length,
        };
      },
    }),

    getCvLabOverview: tool({
      description:
        "Obtenir une vue d'ensemble du CV Lab : master CV et documents CV existants.",
      inputSchema: z.object({}),
      execute: async () => {
        const [masterCv, documents] = await Promise.all([
          prisma.masterCv.findUnique({
            where: { userId },
            select: {
              fullName: true,
              headline: true,
              updatedAt: true,
            },
          }),
          prisma.cvLabDocument.findMany({
            where: { userId, archivedAt: null },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              name: true,
              targetRole: true,
              template: true,
              updatedAt: true,
            },
            take: 10,
          }),
        ]);

        return {
          masterCv: masterCv
            ? {
                fullName: masterCv.fullName,
                headline: masterCv.headline,
                lastUpdated: masterCv.updatedAt,
              }
            : null,
          documents: documents.map((d) => ({
            id: d.id,
            name: d.name,
            targetRole: d.targetRole,
            template: d.template,
            lastUpdated: d.updatedAt,
          })),
          documentsCount: documents.length,
        };
      },
    }),

    getBillingDetails: tool({
      description:
        "Obtenir les factures et devis detailles avec montants, statuts et clients.",
      inputSchema: z.object({
        type: z
          .enum(["invoices", "quotes", "both"])
          .optional()
          .default("both")
          .describe("Type de documents a recuperer"),
        status: z.string().optional().describe("Filtrer par statut"),
        limit: z.number().optional().default(10),
      }),
      execute: async ({ type, status, limit }) => {
        const result: Record<string, unknown> = {};

        if (type === "invoices" || type === "both") {
          const invoiceWhere: Record<string, unknown> = {
            userId,
            deletedAt: null,
          };
          if (status) invoiceWhere.status = status;

          const invoices = await prisma.billingInvoice.findMany({
            where: invoiceWhere,
            orderBy: { issueDate: "desc" },
            take: limit,
            include: {
              client: { select: { displayName: true } },
            },
          });

          result.invoices = invoices.map((inv) => ({
            id: inv.id,
            number: inv.number,
            status: inv.status,
            client: inv.client.displayName,
            totalCents: inv.totalCents,
            paidCents: inv.paidCents,
            balanceCents: inv.balanceCents,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
          }));
        }

        if (type === "quotes" || type === "both") {
          const quoteWhere: Record<string, unknown> = {
            userId,
            deletedAt: null,
          };
          if (status) quoteWhere.status = status;

          const quotes = await prisma.billingQuote.findMany({
            where: quoteWhere,
            orderBy: { issueDate: "desc" },
            take: limit,
            include: {
              client: { select: { displayName: true } },
            },
          });

          result.quotes = quotes.map((q) => ({
            id: q.id,
            number: q.number,
            status: q.status,
            client: q.client.displayName,
            totalCents: q.totalCents,
            issueDate: q.issueDate,
            validUntil: q.validUntil,
          }));
        }

        return result;
      },
    }),

    getTemplatesOverview: tool({
      description:
        "Obtenir les templates de messages disponibles (premier contact, relance, etc.).",
      inputSchema: z.object({}),
      execute: async () => {
        const templates = await prisma.messageTemplate.findMany({
          where: { OR: [{ userId }, { isSystem: true }] },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            type: true,
            subject: true,
            isSystem: true,
          },
        });

        return {
          templates: templates.map((t) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            subject: t.subject,
            isSystem: t.isSystem,
          })),
          count: templates.length,
        };
      },
    }),

    getSequencesOverview: tool({
      description:
        "Obtenir les sequences de relance automatiques configurees par l'utilisateur.",
      inputSchema: z.object({}),
      execute: async () => {
        const sequences = await prisma.sequence.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            steps: true,
            isDefault: true,
          },
        });

        return {
          sequences: sequences.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            stepsCount: Array.isArray(s.steps) ? s.steps.length : 0,
            isDefault: s.isDefault,
          })),
          count: sequences.length,
        };
      },
    }),

    getPipelineAnalytics: tool({
      description:
        "Obtenir des analytics sur la sante du pipeline : score de sante, previsions de revenus, taux de conversion.",
      inputSchema: z.object({}),
      execute: async () => {
        const [missionsByStatus, acceptedMissions, totalApplied] =
          await Promise.all([
            prisma.mission.groupBy({
              by: ["status"],
              where: { userId, deletedAt: null },
              _count: { id: true },
            }),
            prisma.mission.findMany({
              where: { userId, status: "ACCEPTE", deletedAt: null },
              select: { tjm: true, duration: true },
            }),
            prisma.mission.count({
              where: { userId, deletedAt: null },
            }),
          ]);

        const statusCounts = missionsByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        );

        const activeStatuses = [
          "POSTULE",
          "ENTRETIEN",
          "PROPOSITION",
          "ACCEPTE",
        ];
        const activeMissions = activeStatuses.reduce(
          (sum, s) => sum + (statusCounts[s] ?? 0),
          0,
        );

        const forecastRevenueCents = acceptedMissions.reduce((sum, m) => {
          const tjm = m.tjm ?? 0;
          const days = parseInt(m.duration ?? "0", 10) || 0;
          return sum + tjm * days * 100;
        }, 0);

        const interviewStatuses = ["ENTRETIEN", "PROPOSITION", "ACCEPTE"];
        const interviewCount = interviewStatuses.reduce(
          (sum, s) => sum + (statusCounts[s] ?? 0),
          0,
        );
        const interviewRate =
          totalApplied > 0 ? (interviewCount / totalApplied) * 100 : 0;

        const healthScore = Math.min(
          100,
          activeMissions * 10 + (interviewRate > 20 ? 20 : interviewRate),
        );

        return {
          statusCounts,
          activeMissions,
          totalMissions: totalApplied,
          healthScore: Math.round(healthScore),
          interviewRatePercent: Math.round(interviewRate * 10) / 10,
          forecastRevenueCents,
        };
      },
    }),

    getExpensesSummary: tool({
      description:
        "Obtenir un resume des frais professionnels du mois en cours (factures fournisseurs, notes de frais, deplacements).",
      inputSchema: z.object({}),
      execute: async () => {
        const startOfMonth = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        );

        const [expenseInvoices, expenseNotes, expenseTrips] = await Promise.all(
          [
            prisma.billingExpenseInvoice.aggregate({
              where: {
                userId,
                deletedAt: null,
                issueDate: { gte: startOfMonth },
              },
              _sum: { totalInclTaxCents: true },
              _count: { id: true },
            }),
            prisma.billingExpenseNote.aggregate({
              where: {
                userId,
                deletedAt: null,
                expenseDate: { gte: startOfMonth },
              },
              _sum: { amountInclTaxCents: true },
              _count: { id: true },
            }),
            prisma.billingExpenseTrip.aggregate({
              where: {
                userId,
                deletedAt: null,
                tripDate: { gte: startOfMonth },
              },
              _sum: { totalCents: true },
              _count: { id: true },
            }),
          ],
        );

        const totalCents =
          (expenseInvoices._sum.totalInclTaxCents ?? 0) +
          (expenseNotes._sum.amountInclTaxCents ?? 0) +
          (expenseTrips._sum.totalCents ?? 0);

        return {
          invoices: {
            count: expenseInvoices._count.id,
            totalCents: expenseInvoices._sum.totalInclTaxCents ?? 0,
          },
          notes: {
            count: expenseNotes._count.id,
            totalCents: expenseNotes._sum.amountInclTaxCents ?? 0,
          },
          trips: {
            count: expenseTrips._count.id,
            totalCents: expenseTrips._sum.totalCents ?? 0,
          },
          totalExpensesCents: totalCents,
        };
      },
    }),
  };
}
