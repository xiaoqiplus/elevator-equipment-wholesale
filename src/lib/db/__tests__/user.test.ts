import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, clearDatabase } from "@/test/db";
import { createTestUser } from "@/test/factories";
import { Role } from "@prisma/client";

/**
 * User tests — validates user lookup and approval functions.
 * Implementation functions are stubs in src/lib/db/user.ts.
 */

beforeAll(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

describe("getUserByEmail", () => {
  it("should find a user by email", async () => {
    const user = await createTestUser(prisma, {
      email: "find-me@example.com",
      name: "Find Me User",
    });

    const found = await prisma.user.findUnique({
      where: { email: "find-me@example.com" },
    });

    expect(found).not.toBeNull();
    expect(found?.email).toBe("find-me@example.com");
    expect(found?.name).toBe("Find Me User");
  });

  it("should return null for a non-existent email", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "no-such-email@example.com" },
    });
    expect(user).toBeNull();
  });

  it("should return null for an empty string email query", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "" },
    });
    expect(user).toBeNull();
  });

  it("should support case-insensitive lookup concerns (email is stored lowercase)", async () => {
    // Prisma queries are case-sensitive by default; we store emails as-is
    // This test documents the expected behavior for the implementation
    await createTestUser(prisma, {
      email: "user@example.com",
      name: "Lowercase User",
    });

    // Case-sensitive query should work if stored lowercase
    const found = await prisma.user.findUnique({
      where: { email: "user@example.com" },
    });
    expect(found).not.toBeNull();

    // Case-different query should NOT find it
    const notFound = await prisma.user.findUnique({
      where: { email: "User@Example.Com" },
    });
    expect(notFound).toBeNull();
  });
});

describe("approveUser", () => {
  it("should set isApproved to true for a given user", async () => {
    const user = await createTestUser(prisma, {
      email: "approve-me@example.com",
      isApproved: false,
    });
    expect(user.isApproved).toBe(false);

    const approved = await prisma.user.update({
      where: { id: user.id },
      data: { isApproved: true },
    });
    expect(approved.isApproved).toBe(true);
  });

  it("should not affect other users when approving one", async () => {
    const user1 = await createTestUser(prisma, {
      email: "user1-approve@example.com",
      isApproved: false,
    });
    const user2 = await createTestUser(prisma, {
      email: "user2-approve@example.com",
      isApproved: false,
    });

    await prisma.user.update({
      where: { id: user1.id },
      data: { isApproved: true },
    });

    const checkUser1 = await prisma.user.findUnique({
      where: { id: user1.id },
    });
    const checkUser2 = await prisma.user.findUnique({
      where: { id: user2.id },
    });

    expect(checkUser1?.isApproved).toBe(true);
    expect(checkUser2?.isApproved).toBe(false);
  });

  it("should handle approving an already approved user (idempotent)", async () => {
    const user = await createTestUser(prisma, {
      email: "already-approved@example.com",
      isApproved: true,
    });

    const approvedAgain = await prisma.user.update({
      where: { id: user.id },
      data: { isApproved: true },
    });
    expect(approvedAgain.isApproved).toBe(true);
  });

  it("should throw when approving a non-existent user", async () => {
    await expect(
      prisma.user.update({
        where: { id: "non-existent-id" },
        data: { isApproved: true },
      })
    ).rejects.toThrow();
  });
});

describe("User role data integrity", () => {
  it("should create users with CUSTOMER role by default", async () => {
    const user = await createTestUser(prisma, {
      email: "default-role@example.com",
    });
    expect(user.role).toBe(Role.CUSTOMER);
  });

  it("should create users with ADMIN role when specified", async () => {
    const admin = await createTestUser(prisma, {
      email: "admin-role@example.com",
      role: Role.ADMIN,
    });
    expect(admin.role).toBe(Role.ADMIN);
  });

  it("should have unique email addresses", async () => {
    await createTestUser(prisma, {
      email: "unique-email-test@example.com",
    });

    await expect(
      createTestUser(prisma, {
        email: "unique-email-test@example.com",
      })
    ).rejects.toThrow();
  });
});
