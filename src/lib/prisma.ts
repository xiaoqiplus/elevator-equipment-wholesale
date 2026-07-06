import { PrismaClient } from "@prisma/client";

// ── Prisma JSON Type Overrides ──────────────────────────────────────────
// Ensure Json fields return proper TypeScript types instead of JsonValue.
declare global {
  namespace PrismaJson {
    type ProductImages = string[];
    type ProductSpecs = Record<string, string>;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  __TEST_PRISMA__: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient for production/development.
 * During tests, vitest can set globalThis.__TEST_PRISMA__ to a
 * PrismockClient instance so route handlers use the in-memory DB.
 */
function createPrisma(): PrismaClient {
  // Allow replacing with prismock via global for testing
  if (process.env.NODE_ENV === "test" && globalForPrisma.__TEST_PRISMA__) {
    return globalForPrisma.__TEST_PRISMA__;
  }

  return (
    globalForPrisma.prisma ??
    new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
  );
}

export const prisma = createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as PrismaClient;
}
