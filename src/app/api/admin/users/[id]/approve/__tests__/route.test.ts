import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "@/test/api";
import { testPrisma as prisma, clearTestDatabase as clearDatabase } from "@/test/shared/db-instance";
import { createTestUser } from "@/test/factories";
import { PATCH } from "../route";

/**
 * Admin user approval API tests.
 */

let adminId: string;
let customerId: string;

beforeAll(async () => {
  await clearDatabase();

  const admin = await createTestUser(prisma, {
    email: "admin-approve@example.com",
    role: "ADMIN" as any,
    isApproved: true,
  });
  adminId = admin.id;

  const customer = await createTestUser(prisma, {
    email: "pending-customer@example.com",
    role: "CUSTOMER" as any,
    isApproved: false,
  });
  customerId = customer.id;
});

afterAll(async () => {
  await clearDatabase();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Mock next-auth session
const mockSession: any = {};
vi.mock("next-auth", () => ({
  default: () => mockSession,
}));

describe("PATCH /api/admin/users/[id]/approve", () => {
  it("should return 200 and set isApproved=true when admin approves", async () => {
    mockSession.user = { email: "admin-approve@example.com", id: adminId };

    const req = createMockRequest(
      `http://localhost:3000/api/admin/users/${customerId}/approve`,
      { method: "PATCH" }
    );
    const res = await PATCH(req, { params: { id: customerId } });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ id: string; isApproved: boolean }>(res);
    expect(body.isApproved).toBe(true);

    // Verify in DB
    const updated = await (prisma as any).user.findUnique({
      where: { id: customerId },
    });
    expect(updated.isApproved).toBe(true);
  });

  it("should return 403 when non-admin tries to approve", async () => {
    mockSession.user = { email: "pending-customer@example.com", id: customerId };

    const req = createMockRequest(
      `http://localhost:3000/api/admin/users/${customerId}/approve`,
      { method: "PATCH" }
    );
    const res = await PATCH(req, { params: { id: customerId } });
    expect(res.status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    mockSession.user = undefined;

    const req = createMockRequest(
      `http://localhost:3000/api/admin/users/${customerId}/approve`,
      { method: "PATCH" }
    );
    const res = await PATCH(req, { params: { id: customerId } });
    expect(res.status).toBe(401);
  });

  it("should return 404 when user does not exist", async () => {
    mockSession.user = { email: "admin-approve@example.com", id: adminId };

    const req = createMockRequest(
      "http://localhost:3000/api/admin/users/nonexistent-id/approve",
      { method: "PATCH" }
    );
    const res = await PATCH(req, { params: { id: "nonexistent-id" } });
    expect(res.status).toBe(404);
  });
});
