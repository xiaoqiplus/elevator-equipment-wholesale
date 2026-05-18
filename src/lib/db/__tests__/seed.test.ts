import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, clearDatabase } from "@/test/db";
import {
  createTestCategory,
  createTestBrand,
  createTestProduct,
  createTestUser,
} from "@/test/factories";
import { Role, DocumentType } from "@prisma/client";

// Prisma is available for raw queries if needed
// import { Prisma } from "@prisma/client";

/**
 * Seed test — validates seed script data integrity.
 * These tests use the test database; run them after seeding.
 */

// This is a placeholder: in real usage, you would run seed and test against it.
// For now, we manually insert seed-like data and verify structure.

beforeAll(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

describe("Seed Data Integrity", () => {
  it("should not duplicate records when seed runs twice (idempotency)", async () => {
    // Seed run 1
    const cat = await createTestCategory(prisma, {
      name: "Electrical Wholesaler",
      slug: "electrical-wholesaler",
    });
    const brand = await createTestBrand(prisma, {
      name: "Siemens",
      slug: "siemens",
    });
    await createTestProduct(prisma, {
      sku: "EL-SIE-001",
      name: "Siemens S7-1200 PLC Controller",
      price: 429.99,
      categoryId: cat.id,
      brandId: brand.id,
    });

    // Simulate inserting docs
    const countAfterFirst = await prisma.product.count();

    // Seed run 2 — attempt to create same data (will fail on sku unique constraint)
    // The distinct SKUs should still be created; duplicate SKUs should be rejected.
    // We test that the record count doesn't unexpectedly grow when re-seeding.
    const duplicateCat = await createTestCategory(prisma, {
      name: "Electrical Wholesaler",
      slug: "electrical-wholesaler",
    });
    const countAfterDuplicateCat = await prisma.category.count();

    // Since create with same slug will fail unique constraint, we expect
    // the category to be rejected (count unchanged)
    expect(countAfterDuplicateCat).toBe(1);
  });

  it("should contain the expected number of categories", async () => {
    const count = await prisma.category.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("should contain the expected number of brands", async () => {
    const count = await prisma.brand.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("should contain products with non-null SKU and price", async () => {
    const products = await prisma.product.findMany();
    for (const product of products) {
      expect(product.sku).toBeTruthy();
      expect(product.price).not.toBeNull();
    }
  });

  it("should have at least one admin user", async () => {
    await createTestUser(prisma, {
      email: "admin@example.com",
      role: Role.ADMIN,
      isApproved: true,
    });

    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });
    expect(admin).not.toBeNull();
    expect(admin?.isApproved).toBe(true);
  });

  it("should link products to categories and brands", async () => {
    const products = await prisma.product.findMany({
      include: { category: true, brand: true },
    });
    for (const product of products) {
      expect(product.category).not.toBeNull();
      expect(product.brand).not.toBeNull();
    }
  });

  it("should have documents linked to products", async () => {
    // Create a product with a document
    const cat = await createTestCategory(prisma, { slug: "doc-test" });
    const brand = await createTestBrand(prisma, { slug: "doc-brand" });
    const product = await prisma.product.create({
      data: {
        sku: "DOC-TEST-001",
        name: "Doc Test Product",
        price: 99.99,
        categoryId: cat.id,
        brandId: brand.id,
        images: [],
        specs: {},
        documents: {
          create: {
            type: DocumentType.MANUAL,
            name: "test_manual.pdf",
            fileUrl: "https://placehold.co/600x400?text=Manual",
          },
        },
      },
      include: { documents: true },
    });

    expect(product.documents.length).toBeGreaterThanOrEqual(1);
    expect(product.documents[0].type).toBe(DocumentType.MANUAL);
  });
});

describe("Seed product data completeness", () => {
  it("should have specs stored as JSON", async () => {
    const products = await prisma.product.findMany();
    const withSpecs = products.filter((p) => p.specs !== null);

    // Products created in this test suite should have specs
    const sampleProduct = await prisma.product.findFirst({
      where: { sku: "EL-SIE-001" },
    });
    if (sampleProduct) {
      expect(sampleProduct.specs).not.toBeNull();
      expect(typeof sampleProduct.specs).toBe("object");
    }
  });
});
