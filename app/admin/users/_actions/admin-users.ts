import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type AdminUserRoleFilter = "all" | "admin" | "user";
export type AdminUserStatusFilter =
  | "all"
  | "active"
  | "banned"
  | "unverified";
export type AdminUserPlanFilter = "all" | "free" | "pro" | "ultra";
export type AdminUserSortBy =
  | "createdAt"
  | "name"
  | "email"
  | "missions"
  | "sessions"
  | "lastActivity";

export type UserWithStats = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  emailVerified: boolean;
  createdAt: Date;
  plan: string;
  subscriptionStatus: string | null;
  missionsCount: number;
  activeSessions: number;
  lastActivityAt: Date;
};

type GetUsersOptions = {
  page: number;
  pageSize?: number;
  search?: string;
  role?: AdminUserRoleFilter;
  status?: AdminUserStatusFilter;
  plan?: AdminUserPlanFilter;
  sortBy?: AdminUserSortBy;
  order?: "asc" | "desc";
};

export const getUsersWithStats = async ({
  page,
  pageSize = 10,
  search,
  role = "all",
  status = "all",
  plan = "all",
  sortBy = "createdAt",
  order = "desc",
}: GetUsersOptions): Promise<{
  users: UserWithStats[];
  total: number;
  totalPages: number;
}> => {
  const whereClause: Prisma.UserWhereInput = {};

  if (search) {
    whereClause.OR = [
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (role !== "all") {
    whereClause.role = role;
  }

  if (status === "active") {
    whereClause.banned = {
      not: true,
    };
  }

  if (status === "banned") {
    whereClause.banned = true;
  }

  if (status === "unverified") {
    whereClause.emailVerified = false;
  }

  const baseUsers = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (baseUsers.length === 0) {
    return {
      users: [],
      total: 0,
      totalPages: 0,
    };
  }

  const userIds = baseUsers.map((user) => user.id);
  const now = new Date();

  const [
    subscriptions,
    missionsByUser,
    activeSessionsByUser,
    lastSessionActivityByUser,
    lastMissionActivityByUser,
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: { referenceId: { in: userIds } },
      select: {
        referenceId: true,
        plan: true,
        status: true,
      },
    }),
    prisma.mission.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        deletedAt: null,
      },
      _count: true,
    }),
    prisma.session.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        expiresAt: { gt: now },
      },
      _count: true,
    }),
    prisma.session.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
      },
      _max: {
        updatedAt: true,
      },
    }),
    prisma.activityEvent.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
      },
      _max: {
        createdAt: true,
      },
    }),
  ]);

  const subscriptionByUser = new Map(
    subscriptions.map((subscription) => [subscription.referenceId, subscription]),
  );
  const missionsCountByUser = new Map(
    missionsByUser.map((item) => [item.userId, item._count]),
  );
  const activeSessionsCountByUser = new Map(
    activeSessionsByUser.map((item) => [item.userId, item._count]),
  );
  const lastSessionActivity = new Map(
    lastSessionActivityByUser.map((item) => [item.userId, item._max.updatedAt]),
  );
  const lastMissionActivity = new Map(
    lastMissionActivityByUser.map((item) => [item.userId, item._max.createdAt]),
  );

  const enrichedUsers = baseUsers.map((user) => {
    const subscription = subscriptionByUser.get(user.id);
    const sessionDate = lastSessionActivity.get(user.id);
    const missionDate = lastMissionActivity.get(user.id);
    const lastActivityCandidates = [
      sessionDate ?? null,
      missionDate ?? null,
      user.createdAt,
    ].filter((date): date is Date => date instanceof Date);
    const lastActivityAt = new Date(
      Math.max(...lastActivityCandidates.map((date) => date.getTime())),
    );

    return {
      ...user,
      plan: subscription?.plan ?? "free",
      subscriptionStatus: subscription?.status ?? null,
      missionsCount: missionsCountByUser.get(user.id) ?? 0,
      activeSessions: activeSessionsCountByUser.get(user.id) ?? 0,
      lastActivityAt,
    } satisfies UserWithStats;
  });

  const filteredByPlan =
    plan === "all"
      ? enrichedUsers
      : enrichedUsers.filter((user) => user.plan === plan);

  const direction = order === "asc" ? 1 : -1;
  const sortedUsers = [...filteredByPlan].sort((a, b) => {
    if (sortBy === "name") {
      return direction * a.name.localeCompare(b.name);
    }
    if (sortBy === "email") {
      return direction * a.email.localeCompare(b.email);
    }
    if (sortBy === "missions") {
      return direction * (a.missionsCount - b.missionsCount);
    }
    if (sortBy === "sessions") {
      return direction * (a.activeSessions - b.activeSessions);
    }
    if (sortBy === "lastActivity") {
      return (
        direction * (a.lastActivityAt.getTime() - b.lastActivityAt.getTime())
      );
    }
    return direction * (a.createdAt.getTime() - b.createdAt.getTime());
  });

  const total = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const users = sortedUsers.slice(start, start + pageSize);

  return {
    users,
    total,
    totalPages,
  };
};

export const getUsersForExport = async (
  options: Omit<GetUsersOptions, "page" | "pageSize">,
) => {
  const result = await getUsersWithStats({
    ...options,
    page: 1,
    pageSize: 10_000,
  });

  return result.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? "user",
    plan: user.plan,
    status: user.banned ? "banned" : user.emailVerified ? "active" : "unverified",
    missions: user.missionsCount,
    activeSessions: user.activeSessions,
    subscriptionStatus: user.subscriptionStatus ?? "",
    lastActivity: user.lastActivityAt.toISOString(),
    createdAt: user.createdAt.toISOString(),
  }));
};

export type ExportableAdminUser = Awaited<
  ReturnType<typeof getUsersForExport>
>[number];
