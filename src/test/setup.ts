import "@testing-library/jest-dom/vitest";
import { testPrisma } from "./shared/db-instance";

// Make route handlers (which import from @/lib/prisma) use the same
// in-memory prismock instance that tests seed data into.
(globalThis as any).__TEST_PRISMA__ = testPrisma;
