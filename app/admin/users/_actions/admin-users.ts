import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type AdminUserRoleFilter = "all" | "admin" | "user";
export type AdminUserStatusFilter = "all" | "active" | "banned" | "unverified";
export type AdminUserPlanFilter = "all" | "free" | "pro";
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

type UserMetricsRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  email_verified: boolean;
  created_at: Date;
  plan: string;
  subscription_status: string | null;
  missions_count: number;
  active_sessions: number;
  last_activity_at: Date;
};

const ORDER_BY_SQL: Record<AdminUserSortBy, Prisma.Sql> = {
  createdAt: Prisma.raw("created_at"),
  name: Prisma.raw("name"),
  email: Prisma.raw("email"),
  missions: Prisma.raw("missions_count"),
  sessions: Prisma.raw("active_sessions"),
  lastActivity: Prisma.raw("last_activity_at"),
};

const buildUserFiltersSql = (options: {
  search?: string;
  role: AdminUserRoleFilter;
  status: AdminUserStatusFilter;
  plan: AdminUserPlanFilter;
}) => {
  const clauses: Prisma.Sql[] = [Prisma.sql`1 = 1`];

  if (options.search) {
    const searchValue = `%${options.search}%`;
    clauses.push(
      Prisma.sql`(u.email ILIKE ${searchValue} OR u.name ILIKE ${searchValue})`,
    );
  }

  if (options.role === "admin") {
    clauses.push(Prisma.sql`u.role = 'admin'`);
  }

  if (options.role === "user") {
    clauses.push(Prisma.sql`(u.role IS NULL OR u.role = 'user')`);
  }

  if (options.status === "active") {
    clauses.push(Prisma.sql`COALESCE(u.banned, false) = false`);
  }

  if (options.status === "banned") {
    clauses.push(Prisma.sql`COALESCE(u.banned, false) = true`);
  }

  if (options.status === "unverified") {
    clauses.push(Prisma.sql`u."emailVerified" = false`);
  }

  if (options.plan === "free") {
    clauses.push(Prisma.sql`(sub.id IS NULL OR sub.plan = 'free')`);
  }

  if (options.plan === "pro") {
    clauses.push(Prisma.sql`sub.plan = ${options.plan}`);
  }

  return Prisma.join(clauses, " AND ");
};

const buildUsersMetricsCteSql = (filtersSql: Prisma.Sql) => Prisma.sql`
  WITH user_metrics AS (
    SELECT
      u.id,
      u.name,
      u.email,
      u.image,
      u.role,
      u.banned,
      u."emailVerified" AS email_verified,
      u."createdAt" AS created_at,
      COALESCE(sub.plan, 'free') AS plan,
      sub.status AS subscription_status,
      COALESCE(ms.missions_count, 0)::int AS missions_count,
      COALESCE(ss.active_sessions, 0)::int AS active_sessions,
      GREATEST(
        COALESCE(ss.last_session_activity, u."createdAt"),
        COALESCE(ae.last_mission_activity, u."createdAt"),
        u."createdAt"
      ) AS last_activity_at
    FROM "user" u
    LEFT JOIN "subscription" sub ON sub."referenceId" = u.id
    LEFT JOIN (
      SELECT
        m."userId" AS user_id,
        COUNT(*)::int AS missions_count
      FROM "mission" m
      WHERE m."deletedAt" IS NULL
      GROUP BY m."userId"
    ) ms ON ms.user_id = u.id
    LEFT JOIN (
      SELECT
        s."userId" AS user_id,
        COUNT(*) FILTER (WHERE s."expiresAt" > NOW())::int AS active_sessions,
        MAX(s."updatedAt") AS last_session_activity
      FROM "session" s
      GROUP BY s."userId"
    ) ss ON ss.user_id = u.id
    LEFT JOIN (
      SELECT
        a."userId" AS user_id,
        MAX(a."createdAt") AS last_mission_activity
      FROM "activity_event" a
      GROUP BY a."userId"
    ) ae ON ae.user_id = u.id
    WHERE ${filtersSql}
  )
`;

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
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const offset = (safePage - 1) * safePageSize;

  const filtersSql = buildUserFiltersSql({
    search,
    role,
    status,
    plan,
  });
  const cteSql = buildUsersMetricsCteSql(filtersSql);

  const totalRows = await prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
    ${cteSql}
    SELECT COUNT(*)::int AS total
    FROM user_metrics
  `);

  const total = Number(totalRows[0]?.total ?? 0);
  if (total === 0) {
    return {
      users: [],
      total: 0,
      totalPages: 0,
    };
  }

  const orderBySql = ORDER_BY_SQL[sortBy];
  const orderDirectionSql =
    order === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC");

  const rows = await prisma.$queryRaw<UserMetricsRow[]>(Prisma.sql`
    ${cteSql}
    SELECT
      id,
      name,
      email,
      image,
      role,
      banned,
      email_verified,
      created_at,
      plan,
      subscription_status,
      missions_count,
      active_sessions,
      last_activity_at
    FROM user_metrics
    ORDER BY ${orderBySql} ${orderDirectionSql}, id ${orderDirectionSql}
    LIMIT ${safePageSize}
    OFFSET ${offset}
  `);

  const users: UserWithStats[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    banned: row.banned,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    missionsCount: row.missions_count,
    activeSessions: row.active_sessions,
    lastActivityAt: row.last_activity_at,
  }));

  return {
    users,
    total,
    totalPages: Math.ceil(total / safePageSize),
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
    status: user.banned
      ? "banned"
      : user.emailVerified
        ? "active"
        : "unverified",
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
