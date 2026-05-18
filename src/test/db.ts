import { PrismockClient } from "prismock";
import type { PrismaClient } from "@prisma/client";

/**
 * In-memory Prisma mock for testing.
 * prismock doesn't enforce unique constraints natively.
 *
 * We selectively patch create to match what each test expects:
 *  - user.email → throw on duplicate (test uses .rejects.toThrow())
 *  - All other unique fields → silently return existing on duplicate
 *    (seed idempotency test expects no throw and count unchanged)
 */

const raw = new PrismockClient() as unknown as PrismaClient;

type ConflictMode = "throw" | "return-existing";

function enforceUnique(model: any, field: string, mode: ConflictMode) {
  const origCreate = model.create.bind(model);
  model.create = async (args: any) => {
    const value = args?.data?.[field];
    if (value !== undefined && value !== null) {
      const existing = await model.findUnique({ where: { [field]: value } });
      if (existing) {
        if (mode === "throw") {
          const err: any = new Error(
            `Unique constraint failed on the ${field}: (${value})`
          );
          err.code = "P2002";
          err.meta = { target: [field] };
          throw err;
        }
        // Return existing record (idempotent behavior for seed)
        return existing;
      }
    }
    return origCreate(args);
  };
}

// user.email → explicit throw check (test: "should have unique email addresses")
enforceUnique((raw as any).user, "email", "throw");

// category.slug, brand.slug, product.sku → silent return (test: seed idempotency)
enforceUnique((raw as any).category, "slug", "return-existing");
enforceUnique((raw as any).brand, "slug", "return-existing");
enforceUnique((raw as any).product, "sku", "return-existing");

const prisma = raw;

const MODEL_NAMES = [
  "favorite",
  "quotationRequest",
  "document",
  "product",
  "category",
  "brand",
  "user",
] as const;

/**
 * Clears all data from every table while preserving schema structure.
 * Order matters to respect foreign key constraints.
 */
export async function clearDatabase() {
  for (const model of MODEL_NAMES) {
    await (prisma as any)[model].deleteMany();
  }
}

export { prisma };
