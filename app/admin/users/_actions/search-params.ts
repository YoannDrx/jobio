import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

const roleOptions = ["all", "admin", "user"] as const;
const statusOptions = ["all", "active", "banned", "unverified"] as const;
const planOptions = ["all", "free", "pro", "ultra"] as const;
const sortOptions = [
  "createdAt",
  "name",
  "email",
  "missions",
  "sessions",
  "lastActivity",
] as const;
const orderOptions = ["asc", "desc"] as const;

export const adminSearchParams = {
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
  role: parseAsStringLiteral(roleOptions).withDefault("all"),
  status: parseAsStringLiteral(statusOptions).withDefault("all"),
  plan: parseAsStringLiteral(planOptions).withDefault("all"),
  sortBy: parseAsStringLiteral(sortOptions).withDefault("createdAt"),
  order: parseAsStringLiteral(orderOptions).withDefault("desc"),
};

export const searchParamsCache = createSearchParamsCache(adminSearchParams);
