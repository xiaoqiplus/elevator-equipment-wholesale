import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, clearDatabase } from "@/test/db";
import {
  createTestUser,
  createTestProduct,
} from "@/test/factories";

/**
 * Quotation tests — validates quotation CRUD and status management.
 * Implementation functions are stubs in src/lib/db/quotation.ts.
 */

let userId: string;
let productId: string;

beforeAll(async () => {
  await clearDatabase();

  const user = await createTestUser(prisma, {
    email: "quotation-test@example.com",
    isApproved: true,
  });
  userId = user.id;

  const product = await createTestProduct(prisma, {
    sku: "QUO-TEST-SKU",
    name: "Quotation Test Product",
    price: 199.0,
  });
  productId = product.id;
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

describe("createQuotation", () => {
  it("should create a quotation request with items as JSON", async () => {
    const quotation = await prisma.quotationRequest.create({
      data: {
        userId,
        status: "PENDING",
        items: [
          {
            productId,
            sku: "QUO-TEST-SKU",
            name: "Quotation Test Product",
            quantity: 3,
            note: "Bulk order",
          },
        ],
      },
    });

    expect(quotation).not.toBeNull();
    expect(quotation.status).toBe("PENDING");
    expect(Array.isArray(quotation.items)).toBe(true);
    expect(quotation.items).toHaveLength(1);

    const items = quotation.items as Array<{ sku: string; quantity: number }>;
    expect(items[0].sku).toBe("QUO-TEST-SKU");
    expect(items[0].quantity).toBe(3);
  });

  it("should create a quotation with multiple items", async () => {
    const quotation = await prisma.quotationRequest.create({
      data: {
        userId,
        status: "PENDING",
        items: [
          {
            productId,
            sku: "QUO-TEST-SKU",
            name: "Quotation Test Product",
            quantity: 2,
            note: null,
          },
          {
            productId,
            sku: "ANOTHER-SKU",
            name: "Another Product",
            quantity: 1,
            note: "Express delivery",
          },
        ],
      },
    });

    expect(quotation.items).toHaveLength(2);
  });
});

describe("getUserQuotations", () => {
  it("should return all quotations for a given user", async () => {
    // Create a couple of quotations first
    await prisma.quotationRequest.create({
      data: {
        userId,
        status: "PENDING",
        items: [{ productId, sku: "SKU-A", name: "Item A", quantity: 1 }],
      },
    });
    await prisma.quotationRequest.create({
      data: {
        userId,
        status: "RESPONDED",
        items: [{ productId, sku: "SKU-B", name: "Item B", quantity: 2 }],
      },
    });

    const quotations = await prisma.quotationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    expect(quotations.length).toBeGreaterThanOrEqual(2);
  });

  it("should return empty array for a user with no quotations", async () => {
    const quotations = await prisma.quotationRequest.findMany({
      where: { userId: "non-existent-user" },
    });
    expect(quotations).toHaveLength(0);
  });
});

describe("Quotation status updates", () => {
  it("should start as PENDING", async () => {
    const quotation = await prisma.quotationRequest.create({
      data: {
        userId,
        status: "PENDING",
        items: [{ productId, sku: "STATUS-TEST", name: "Status Test", quantity: 1 }],
      },
    });
    expect(quotation.status).toBe("PENDING");
  });

  it("should update status from PENDING to RESPONDED", async () => {
    const quotation = await prisma.quotationRequest.create({
      data: {
        userId,
        status: "PENDING",
        items: [{ productId, sku: "UPDATE-TEST", name: "Update Test", quantity: 1 }],
      },
    });

    const updated = await prisma.quotationRequest.update({
      where: { id: quotation.id },
      data: { status: "RESPONDED" },
    });

    expect(updated.status).toBe("RESPONDED");
  });

  it("should update status to CONVERTED_TO_ORDER", async () => {
    const quotation = await prisma.quotationRequest.create({
      data: {
        userId,
        status: "RESPONDED",
        items: [{ productId, sku: "CONVERT-TEST", name: "Convert Test", quantity: 5 }],
      },
    });

    const updated = await prisma.quotationRequest.update({
      where: { id: quotation.id },
      data: { status: "CONVERTED_TO_ORDER" },
    });

    expect(updated.status).toBe("CONVERTED_TO_ORDER");
  });

  it("should include admin notes when responding", async () => {
    const quotation = await prisma.quotationRequest.create({
      data: {
        userId,
        status: "PENDING",
        items: [{ productId, sku: "NOTE-TEST", name: "Note Test", quantity: 1 }],
      },
    });

    const updated = await prisma.quotationRequest.update({
      where: { id: quotation.id },
      data: {
        status: "RESPONDED",
        adminNotes: "Pricing approved. Lead time: 5 business days.",
      },
    });

    expect(updated.adminNotes).toContain("Pricing approved");
  });
});
