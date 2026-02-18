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
  };
}
