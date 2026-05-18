/**
 * Shared test PrismaClient (prismock) instance.
 * Created once and reused across all test files so that the
 * vi.mock() factory for @/lib/prisma returns the same instance
 * the tests seed data into.
 */
import { PrismockClient } from "prismock";
import type { PrismaClient } from "@prisma/client";

const raw = new PrismockClient() as unknown as PrismaClient;

// ─── Unique constraint enforcement ───────────────────────────────────────────
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
        return existing;
      }
    }
    return origCreate(args);
  };
}

enforceUnique((raw as any).user, "email", "throw");
enforceUnique((raw as any).category, "slug", "return-existing");
enforceUnique((raw as any).brand, "slug", "return-existing");
enforceUnique((raw as any).product, "sku", "return-existing");

export const testPrisma = raw;

const MODEL_NAMES = [
  "favorite",
  "quotationRequest",
  "document",
  "product",
  "category",
  "brand",
  "user",
] as const;

export async function clearTestDatabase() {
  for (const model of MODEL_NAMES) {
    await (testPrisma as any)[model].deleteMany();
  }
}
