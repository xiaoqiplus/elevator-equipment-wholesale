import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "@/test/api";
import { testPrisma as prisma, clearTestDatabase as clearDatabase } from "@/test/shared/db-instance";
import { POST } from "../register/route";

/**
 * Registration API tests.
 */

beforeAll(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("should return 201 with user object on valid registration", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "newuser@example.com",
        password: "SecurePass123!",
        name: "New User",
        companyName: "Test Corp",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ id: string; email: string; isApproved: boolean }>(res);
    expect(body).toHaveProperty("id");
    expect(body.email).toBe("newuser@example.com");
    expect(body.isApproved).toBe(false);
  });

  it("should return 400 when email is missing", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ password: "Pass123!", name: "No Email" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when password is missing", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "nopass@example.com", name: "No Pass" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 409 when email already exists", async () => {
    // First registration
    const req1 = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "duplicate@example.com",
        password: "Pass123!",
        name: "First",
      }),
    });
    await POST(req1);

    // Duplicate
    const req2 = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "duplicate@example.com",
        password: "Pass456!",
        name: "Second",
      }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(409);
  });

  it("should store password as hash (not plaintext)", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "passwordcheck@example.com",
        password: "MySecret123!",
        name: "Pass Check",
      }),
    });
    const res = await POST(req);
    const body = await parseResponse<any>(res);

    // Response should not contain password
    expect(body).not.toHaveProperty("password");

    // DB should have hashed password
    const user = await (prisma as any).user.findUnique({
      where: { email: "passwordcheck@example.com" },
    });
    // The hash should not be the plaintext
    expect(user.passwordHash).not.toBe("MySecret123!");
    // Hash should be a non-empty string
    expect(user.passwordHash).toBeTruthy();
    expect(user.passwordHash.length).toBeGreaterThan(10);
  });
});
