import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "../index";

/**
 * Rate limit tests — uses in-memory fallback.
 */

beforeEach(() => {
  // Clear the memory store between tests by calling limit and resetting
});

describe("checkRateLimit", () => {
  it("should allow requests within the limit", async () => {
    const result = await checkRateLimit("test-user-1");
    expect(result.success).toBe(true);
  });

  it("should allow multiple sequential requests within the window", async () => {
    const ident = "sequential-test";

    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit(ident);
      expect(result.success).toBe(true);
    }
  });

  it("should block requests after exceeding the limit", async () => {
    const ident = "block-test";

    // Use up the allowed requests
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(ident);
    }

    // The 11th should be blocked
    const result = await checkRateLimit(ident);
    expect(result.success).toBe(false);
  });

  it("should treat different identifiers independently", async () => {
    const identA = "user-a";
    const identB = "user-b";

    // Exhaust user A's limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(identA);
    }

    const resultA = await checkRateLimit(identA);
    expect(resultA.success).toBe(false);

    // User B should still be allowed
    const resultB = await checkRateLimit(identB);
    expect(resultB.success).toBe(true);
  });

  it("should handle empty identifier gracefully", async () => {
    const result = await checkRateLimit("");
    expect(result).toHaveProperty("success");
  });
});
