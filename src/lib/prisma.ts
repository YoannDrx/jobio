import { Prisma, PrismaClient } from "@/generated/prisma";
import { logger } from "@/lib/logger";
import { runPrismaReadWithTransientRetry } from "@/lib/prisma-transient-retry";
import { getPrismaDatasourceUrl } from "@/lib/prisma-url";

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    datasourceUrl: getPrismaDatasourceUrl(process.env.DATABASE_URL),
  });

  const extendedClient = client.$extends(
    Prisma.defineExtension({
      name: "transient-read-retry",
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            return runPrismaReadWithTransientRetry({
              operation,
              query: async () => query(args),
              onRetry: (error) => {
                logger.warn("Nouvelle tentative Prisma après déconnexion", {
                  model,
                  operation,
                  code:
                    typeof error === "object" &&
                    error !== null &&
                    "code" in error
                      ? error.code
                      : "UNKNOWN",
                });
              },
            });
          },
        },
      },
    }),
  );

  // Keep the generated PrismaClient surface for transaction helpers throughout
  // the codebase. The extension only wraps existing read operations and does
  // not add or alter public model methods.
  return extendedClient as unknown as PrismaClient;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Next.js may evaluate this module through several server chunks in the same
// process. Reuse one client in production as well as development so each chunk
// does not allocate its own PostgreSQL pool.
globalForPrisma.prisma = prisma;
