import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSessionFromRequest,
  requireAuth,
  requireApproved,
  isAdmin,
} from "../utils";
import { createMockRequest } from "@/test/api";

/**
 * Auth utility tests.
 *
 * Stubs throw/return null → all tests fail until implementation.
 */

const mockSession = { user: { id: "user-1", email: "user@test.com", role: "CUSTOMER" } as any };
let mockGetServerSession = vi.fn(() => mockSession);

vi.mock("next-auth", () => ({
  default: () => mockGetServerSession(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to default so tests that reassign mockGetServerSession
  // (e.g. setting it to return null) don't leak state to later tests.
  mockGetServerSession = vi.fn(() => mockSession);
});

describe("getSessionFromRequest", () => {
  it("should return user data from a valid session", async () => {
    const req = createMockRequest("http://localhost:3000");
    const result = await getSessionFromRequest(req);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("email");
  });

  it("should return null when no session exists", async () => {
    mockGetServerSession = vi.fn(() => null);
    const req = createMockRequest("http://localhost:3000");
    const result = await getSessionFromRequest(req);
    expect(result).toBeNull();
  });
});

describe("requireAuth", () => {
  it("should return user when authenticated", async () => {
    const req = createMockRequest("http://localhost:3000");
    const result = await requireAuth(req);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("id");
  });

  it("should throw 401 when not authenticated", async () => {
    mockGetServerSession = vi.fn(() => null);
    const req = createMockRequest("http://localhost:3000");
    await expect(requireAuth(req)).rejects.toThrow("Unauthorized");
  });
});

describe("requireApproved", () => {
  it("should return user when authenticated and approved", async () => {
    mockSession.user = { id: "user-2", email: "approved@test.com", isApproved: true, role: "CUSTOMER" };
    const req = createMockRequest("http://localhost:3000");
    const result = await requireApproved(req);
    expect(result).not.toBeNull();
    expect(result.isApproved).toBe(true);
  });

  it("should throw 403 when user is not approved", async () => {
    mockSession.user = { id: "user-3", email: "pending@test.com", isApproved: false, role: "CUSTOMER" };
    const req = createMockRequest("http://localhost:3000");
    await expect(requireApproved(req)).rejects.toThrow("Forbidden");
  });

  it("should throw 401 when not authenticated", async () => {
    mockGetServerSession = vi.fn(() => null);
    const req = createMockRequest("http://localhost:3000");
    await expect(requireApproved(req)).rejects.toThrow("Unauthorized");
  });
});

describe("isAdmin", () => {
  it("should return true for admin users", () => {
    const admin = { id: "admin-1", role: "ADMIN" };
    expect(isAdmin(admin)).toBe(true);
  });

  it("should return false for customer users", () => {
    const customer = { id: "cust-1", role: "CUSTOMER" };
    expect(isAdmin(customer)).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
