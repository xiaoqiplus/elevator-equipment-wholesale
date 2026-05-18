import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "@/test/api";
import {
  createTestUser,
  createTestProduct,
} from "@/test/factories";

// Use the shared prismock instance so route handler (which reads from
// @/lib/prisma via globalThis.__TEST_PRISMA__) sees the same data.
import { testPrisma as prisma, clearTestDatabase as clearDatabase } from "@/test/shared/db-instance";

import { POST, GET } from "../route";

/**
 * Quotations API route tests.
 *
 * Stubs return 501 → all pass tests until implementation.
 */

let customerId: string;
let adminId: string;
let productSku: string;

// Mock NextAuth session (default export — used via import getServerSession from "next-auth")
const mockSession: { user?: { email?: string; id?: string }; expires?: string } = {};
vi.mock("next-auth", () => ({
  default: () => mockSession,
}));

// Mock Resend
vi.mock("@/lib/email/resend", () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-123" }, error: null }),
    },
  },
}));

beforeAll(async () => {
  await clearDatabase();

  const customer = await createTestUser(prisma, {
    email: "customer@example.com",
    isApproved: true,
    role: "CUSTOMER" as any,
  });
  customerId = customer.id;

  const admin = await createTestUser(prisma, {
    email: "admin@example.com",
    isApproved: true,
    role: "ADMIN" as any,
  });
  adminId = admin.id;

  const product = await createTestProduct(prisma, {
    sku: "QUO-API-SKU-001",
    name: "Quotation API Product",
    price: 299.99,
  });
  productSku = product.sku;
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default: authenticated as customer
  mockSession.user = { email: "customer@example.com", id: customerId };
});

describe("POST /api/quotations — authorization", () => {
  it("should return 401 when user is not authenticated", async () => {
    mockSession.user = undefined;
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({ items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 201 when authenticated with valid items", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            sku: productSku,
            name: "Quotation API Product",
            quantity: 2,
          },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ id: string; status: string }>(res);
    expect(body).toHaveProperty("id");
    expect(body.status).toBe("PENDING");
  });
});

describe("POST /api/quotations — validation", () => {
  it("should return 400 when items field is missing", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when items array is empty", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({ items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when an item is missing sku", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [{ name: "No SKU", quantity: 1 }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when an item is missing quantity", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [{ sku: productSku, name: "No Qty" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/quotations — data integrity", () => {
  it("should store userId, items JSON, and status in the database", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            sku: productSku,
            name: "Quotation API Product",
            quantity: 3,
          },
        ],
      }),
    });
    const res = await POST(req);
    const body = await parseResponse<{ id: string }>(res);

    // Verify the record in the database
    const saved = await (prisma as any).quotationRequest.findUnique({
      where: { id: body.id },
    });
    expect(saved).not.toBeNull();
    expect(saved.userId).toBe(customerId);
    expect(saved.status).toBe("PENDING");
    expect(Array.isArray(saved.items)).toBe(true);
  });

  it("should use server-side price from database, not client-provided price", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            sku: productSku,
            name: "Quotation API Product",
            quantity: 2,
            price: 1.0, // client tries to supply a fake price
          },
        ],
      }),
    });
    const res = await POST(req);
    const body = await parseResponse<{ id: string }>(res);

    // The stored snapshot should use the real price from the database (299.99)
    // not the client-supplied price (1.0)
    const saved = await (prisma as any).quotationRequest.findUnique({
      where: { id: body.id },
    });
    const items = saved.items as any[];
    expect(items[0].price).toBe(299.99);
  });
});

describe("POST /api/quotations — email notification", () => {
  it("should call Resend to notify admin of new quotation", async () => {
    const { resend } = await import("@/lib/email/resend");

    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            sku: productSku,
            name: "Quotation API Product",
            quantity: 1,
          },
        ],
      }),
    });
    await POST(req);

    // Resend should have been called
    expect(resend.emails.send).toHaveBeenCalled();
    // Should send to admin email
    const callArgs = (resend.emails.send as any).mock.calls[0][0];
    expect(callArgs.to).toBe(process.env.ADMIN_EMAIL || "admin@example.com");
    // Email should contain product summary
    expect(callArgs.subject).toContain("报价");
  });

  it("should not crash if email sending fails", async () => {
    const { resend } = await import("@/lib/email/resend");
    (resend.emails.send as any).mockRejectedValue(new Error("SMTP error"));

    const req = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [{ sku: productSku, name: "Fail Product", quantity: 1 }],
      }),
    });
    const res = await POST(req);
    // Should still return 201 even if email fails
    expect(res.status).toBe(201);
  });
});

describe("GET /api/quotations — authorization", () => {
  it("should return 401 when user is not authenticated", async () => {
    mockSession.user = undefined;
    const req = createMockRequest("http://localhost:3000/api/quotations");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 200 when authenticated", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/quotations — data", () => {
  it("should return quotations for the authenticated user", async () => {
    // Create a quotation first
    const createReq = createMockRequest("http://localhost:3000/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        items: [{ sku: productSku, name: "Get Test", quantity: 1 }],
      }),
    });
    await POST(createReq);

    const req = createMockRequest("http://localhost:3000/api/quotations");
    const res = await GET(req);
    const body = await parseResponse<any[]>(res);

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);

    // Each record should have required fields
    const record = body[0];
    expect(record).toHaveProperty("id");
    expect(record).toHaveProperty("status");
    expect(record).toHaveProperty("items");
    expect(record).toHaveProperty("createdAt");
  });

  it("should return quotations ordered by created time descending", async () => {
    const req = createMockRequest("http://localhost:3000/api/quotations");
    const res = await GET(req);
    const body = await parseResponse<any[]>(res);

    if (body.length >= 2) {
      const date1 = new Date(body[0].createdAt).getTime();
      const date2 = new Date(body[1].createdAt).getTime();
      expect(date1).toBeGreaterThanOrEqual(date2);
    }
  });

  it("should not include other users quotations (data isolation)", async () => {
    // Switch to admin user — should see different quotations
    mockSession.user = { email: "admin@example.com", id: adminId };

    const req = createMockRequest("http://localhost:3000/api/quotations");
    const res = await GET(req);
    const body = await parseResponse<any[]>(res);

    // Admin's quotations should be separate from customer's
    for (const q of body) {
      expect(q.userId).toBe(adminId);
    }
  });
});
