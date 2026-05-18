import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockRequest, parseResponse } from "@/test/api";
import {
  createTestCategory,
  createTestBrand,
  createTestProduct,
} from "@/test/factories";
import type { PaginatedResponse } from "@/test/api";

// Import the shared prismock instance. The test setup already registers
// this as the global test prisma, so @/lib/prisma returns the same instance.
import { testPrisma as prisma, clearTestDatabase as clearDatabase } from "@/test/shared/db-instance";

import { GET } from "../route";

/**
 * Products list API (GET /api/products) — test suite.
 * Uses in-memory prismock to avoid requiring a real database.
 */

let catElectricalId: string;
let catLiftId: string;
let brandSiemensId: string;
let brandOtisId: string;

const seededSkus: string[] = [];

beforeAll(async () => {
  await clearDatabase();

  // Seed data matching the real seed script structure
  const catElectrical = await createTestCategory(prisma, {
    name: "Electrical Wholesaler",
    slug: "electrical-wholesaler",
  });
  catElectricalId = catElectrical.id;

  const catLift = await createTestCategory(prisma, {
    name: "Lift Equipment",
    slug: "lift-equipment",
  });
  catLiftId = catLift.id;

  const brandSiemens = await createTestBrand(prisma, {
    name: "Siemens",
    slug: "siemens",
  });
  brandSiemensId = brandSiemens.id;

  const brandOtis = await createTestBrand(prisma, {
    name: "Otis",
    slug: "otis",
  });
  brandOtisId = brandOtis.id;

  // Create 8 Siemens + Electrical products
  for (let i = 1; i <= 8; i++) {
    const sku = `SIEMENS-SKU-${String(i).padStart(3, "0")}`;
    seededSkus.push(sku);
    await createTestProduct(prisma, {
      sku,
      name: `Siemens Product ${i}`,
      price: 100 + i * 25,
      categoryId: catElectricalId,
      brandId: brandSiemensId,
    });
  }

  // Create 4 Otis + Lift products
  for (let i = 1; i <= 4; i++) {
    const sku = `OTIS-SKU-${String(i).padStart(3, "0")}`;
    seededSkus.push(sku);
    await createTestProduct(prisma, {
      sku,
      name: `Otis Product ${i}`,
      price: 200 + i * 50,
      categoryId: catLiftId,
      brandId: brandOtisId,
    });
  }
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

describe("GET /api/products — list products", () => {
  it("should return a paginated list of all products (default page 1, pageSize 10)", async () => {
    const req = createMockRequest("http://localhost:3000/api/products");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<PaginatedResponse<any>>(res);
    expect(body.products).toBeDefined();
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.total).toBe(12);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
  });

  it("should filter products by category slug", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products?category=electrical-wholesaler"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<PaginatedResponse<any>>(res);
    expect(body.products).toHaveLength(8);
    expect(body.total).toBe(8);
  });

  it("should filter products by brand slug", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products?brand=siemens"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<PaginatedResponse<any>>(res);
    expect(body.products).toHaveLength(8);
    expect(body.total).toBe(8);
  });

  it("should allow searching by name or SKU", async () => {
    // Search by SKU
    const reqSku = createMockRequest(
      "http://localhost:3000/api/products?search=SIEMENS-SKU-001"
    );
    const resSku = await GET(reqSku);
    expect(resSku.status).toBe(200);
    const bodySku = await parseResponse<PaginatedResponse<any>>(resSku);
    expect(bodySku.products.length).toBeGreaterThanOrEqual(1);
    if (bodySku.products.length > 0) {
      const product = bodySku.products[0];
      const matches =
        (product.sku ?? "").includes("SIEMENS-SKU-001") ||
        (product.name ?? "").includes("SIEMENS-SKU-001");
      expect(matches).toBe(true);
    }

    // Search by name
    const reqName = createMockRequest(
      "http://localhost:3000/api/products?search=Otis+Product"
    );
    const resName = await GET(reqName);
    expect(resName.status).toBe(200);
    const bodyName = await parseResponse<PaginatedResponse<any>>(resName);
    expect(bodyName.products.length).toBeGreaterThanOrEqual(1);
  });

  it("should support pagination (page 2, pageSize 5)", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products?page=2&pageSize=5"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<PaginatedResponse<any>>(res);
    // With 12 total products and pageSize=5, page 2 should have 5-7 products
    expect(body.products.length).toBeGreaterThanOrEqual(1);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(5);
    expect(body.total).toBe(12);
  });

  it("should return correct response structure: { products, total, page, pageSize }", async () => {
    const req = createMockRequest("http://localhost:3000/api/products");
    const res = await GET(req);
    const body = await parseResponse<any>(res);

    expect(body).toHaveProperty("products");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("pageSize");
    expect(typeof body.total).toBe("number");
    expect(typeof body.page).toBe("number");
    expect(typeof body.pageSize).toBe("number");
  });

  it("should return price as null for unauthenticated users", async () => {
    const req = createMockRequest("http://localhost:3000/api/products");
    const res = await GET(req);
    const body = await parseResponse<PaginatedResponse<any>>(res);

    // In this test environment there's no auth session, so all prices should be null
    for (const product of body.products) {
      expect(product.price).toBeNull();
    }
  });

  it("should return product fields: sku, name, description, images, specs", async () => {
    const req = createMockRequest("http://localhost:3000/api/products?pageSize=1");
    const res = await GET(req);
    const body = await parseResponse<PaginatedResponse<any>>(res);

    if (body.products.length > 0) {
      const product = body.products[0];
      expect(product).toHaveProperty("sku");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("description");
      expect(product).toHaveProperty("images");
      expect(product).toHaveProperty("specs");
    }
  });

  it("should return brand and category info inline on each product", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products?category=electrical-wholesaler&pageSize=1"
    );
    const res = await GET(req);
    const body = await parseResponse<PaginatedResponse<any>>(res);

    if (body.products.length > 0) {
      const product = body.products[0];
      // Should include category slug info (may be nested or flat)
      expect(product).toHaveProperty("category");
      // Should include brand info
      expect(product).toHaveProperty("brand");
    }
  });
});

describe("GET /api/products — edge cases", () => {
  it("should return empty products array for a non-existent category", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products?category=nonexistent"
    );
    const res = await GET(req);
    const body = await parseResponse<PaginatedResponse<any>>(res);
    expect(body.products).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it("should ignore invalid page numbers gracefully", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products?page=-1&pageSize=-5"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    // Should fall back to sensible defaults without crashing
    const body = await parseResponse<PaginatedResponse<any>>(res);
    expect(body.page).toBeGreaterThanOrEqual(1);
    expect(body.pageSize).toBeGreaterThanOrEqual(1);
  });
});
