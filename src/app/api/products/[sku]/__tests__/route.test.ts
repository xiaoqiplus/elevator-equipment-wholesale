import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockRequest, parseResponse } from "@/test/api";
import {
  createTestCategory,
  createTestBrand,
  createTestProduct,
} from "@/test/factories";
import { DocumentType } from "@prisma/client";

// Shared prismock instance registered by setup.ts.
import { testPrisma as prisma, clearTestDatabase as clearDatabase } from "@/test/shared/db-instance";

import { GET } from "../route";

/**
 * Product detail API (GET /api/products/[sku]) — test suite.
 */

let catId: string;
let brandId: string;
const validSku = "DETAIL-TEST-SKU-001";
const detailsDocName = "detail_manual.pdf";

beforeAll(async () => {
  await clearDatabase();

  const cat = await createTestCategory(prisma, {
    name: "Detail Test Category",
    slug: "detail-test-category",
  });
  catId = cat.id;

  const brand = await createTestBrand(prisma, {
    name: "Detail Test Brand",
    slug: "detail-test-brand",
  });
  brandId = brand.id;

  // Create a product WITH a document
  await prisma.product.create({
    data: {
      sku: validSku,
      name: "Detail Test Product",
      description: "A product for detail testing",
      price: 299.99,
      categoryId: catId,
      brandId: brandId,
      images: ["https://placehold.co/600x400?text=Detail"],
      specs: { weight: "10kg", voltage: "24V" },
      documents: {
        create: [
          {
            type: DocumentType.MANUAL,
            name: detailsDocName,
            fileUrl: "https://placehold.co/600x400?text=Manual",
          },
          {
            type: DocumentType.DRAWING,
            name: "detail_drawing.pdf",
            fileUrl: "https://placehold.co/600x400?text=Drawing",
          },
        ],
      },
    },
  });

  // Create a second product for isolation tests
  await createTestProduct(prisma, {
    sku: "OTHER-PRODUCT-SKU",
    name: "Other Product",
    price: 99.99,
    categoryId: catId,
    brandId: brandId,
  });
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

describe("GET /api/products/[sku] — product detail", () => {
  it("should return a single product by SKU", async () => {
    const req = createMockRequest(
      `http://localhost:3000/api/products/${validSku}`
    );
    const res = await GET(req, { params: { sku: validSku } });
    expect(res.status).toBe(200);

    const body = await parseResponse<any>(res);
    expect(body).not.toBeNull();
    expect(body.sku).toBe(validSku);
    expect(body.name).toBe("Detail Test Product");
    expect(body.description).toBe("A product for detail testing");
  });

  it("should return 404 for a non-existent SKU", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products/NONEXISTENT-SKU"
    );
    const res = await GET(req, { params: { sku: "NONEXISTENT-SKU" } });
    expect(res.status).toBe(404);
  });

  it("should include category information", async () => {
    const req = createMockRequest(
      `http://localhost:3000/api/products/${validSku}`
    );
    const res = await GET(req, { params: { sku: validSku } });
    const body = await parseResponse<any>(res);

    expect(body).toHaveProperty("category");
    expect(body.category).not.toBeNull();
    if (body.category) {
      expect(body.category.slug).toBe("detail-test-category");
    }
  });

  it("should include brand information", async () => {
    const req = createMockRequest(
      `http://localhost:3000/api/products/${validSku}`
    );
    const res = await GET(req, { params: { sku: validSku } });
    const body = await parseResponse<any>(res);

    expect(body).toHaveProperty("brand");
    expect(body.brand).not.toBeNull();
    if (body.brand) {
      expect(body.brand.slug).toBe("detail-test-brand");
    }
  });

  it("should include documents array with type, name, fileUrl", async () => {
    const req = createMockRequest(
      `http://localhost:3000/api/products/${validSku}`
    );
    const res = await GET(req, { params: { sku: validSku } });
    const body = await parseResponse<any>(res);

    expect(body).toHaveProperty("documents");
    expect(Array.isArray(body.documents)).toBe(true);
    expect(body.documents.length).toBeGreaterThanOrEqual(1);

    for (const doc of body.documents) {
      expect(doc).toHaveProperty("type");
      expect(doc).toHaveProperty("name");
      expect(doc).toHaveProperty("fileUrl");
    }

    // Verify a specific document
    const manual = body.documents.find(
      (d: any) => d.name === detailsDocName
    );
    expect(manual).toBeDefined();
    expect(manual.type).toBe("MANUAL");
  });

  it("should return price as null for unauthenticated users", async () => {
    const req = createMockRequest(
      `http://localhost:3000/api/products/${validSku}`
    );
    const res = await GET(req, { params: { sku: validSku } });
    const body = await parseResponse<any>(res);

    // No auth session → price should be null
    expect(body.price).toBeNull();
  });

  it("should include product images array", async () => {
    const req = createMockRequest(
      `http://localhost:3000/api/products/${validSku}`
    );
    const res = await GET(req, { params: { sku: validSku } });
    const body = await parseResponse<any>(res);

    expect(body).toHaveProperty("images");
    expect(Array.isArray(body.images)).toBe(true);
    expect(body.images.length).toBeGreaterThanOrEqual(1);
  });

  it("should include product specs", async () => {
    const req = createMockRequest(
      `http://localhost:3000/api/products/${validSku}`
    );
    const res = await GET(req, { params: { sku: validSku } });
    const body = await parseResponse<any>(res);

    expect(body).toHaveProperty("specs");
    expect(body.specs).not.toBeNull();
  });

  it("should return 404 for an empty SKU", async () => {
    const req = createMockRequest("http://localhost:3000/api/products/");
    // An empty string or just whitespace should result in 404
    const res = await GET(req, { params: { sku: "" } });
    expect(res.status).toBe(404);
  });

  it("should not leak a product detail from a different SKU query", async () => {
    const req = createMockRequest(
      "http://localhost:3000/api/products/OTHER-PRODUCT-SKU"
    );
    const res = await GET(req, { params: { sku: "OTHER-PRODUCT-SKU" } });
    expect(res.status).toBe(200);
    const body = await parseResponse<any>(res);
    expect(body.sku).toBe("OTHER-PRODUCT-SKU");
    expect(body.sku).not.toBe(validSku);
  });
});
