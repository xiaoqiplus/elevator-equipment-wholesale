import type { PrismaClient, Role, DocumentType } from "@prisma/client";

// ─── Helper to generate unique slugs ────────────────────────────────────────

let counter = 0;
function uid(prefix: string): string {
  counter++;
  return `${prefix}-${Date.now()}-${counter}`;
}

// ─── Category ───────────────────────────────────────────────────────────────

export async function createTestCategory(
  prisma: PrismaClient,
  overrides: Partial<{
    name: string;
    slug: string;
    parentId: string | null;
  }> = {}
) {
  const slug = overrides.slug || uid("cat");
  return prisma.category.create({
    data: {
      name: overrides.name ?? "Test Category",
      slug,
      parentId: overrides.parentId ?? null,
    },
  });
}

// ─── Brand ──────────────────────────────────────────────────────────────────

export async function createTestBrand(
  prisma: PrismaClient,
  overrides: Partial<{
    name: string;
    slug: string;
    logoUrl: string | null;
  }> = {}
) {
  const slug = overrides.slug || uid("brand");
  return prisma.brand.create({
    data: {
      name: overrides.name ?? "Test Brand",
      slug,
      logoUrl: overrides.logoUrl ?? null,
    },
  });
}

// ─── Product ────────────────────────────────────────────────────────────────

export async function createTestProduct(
  prisma: PrismaClient,
  overrides: Partial<{
    sku: string;
    name: string;
    description: string | null;
    price: number | null;
    categoryId: string | null;
    brandId: string | null;
    images: string[];
    specs: Record<string, unknown> | null;
  }> = {}
) {
  const sku = overrides.sku || uid("SKU");
  return prisma.product.create({
    data: {
      sku,
      name: overrides.name ?? "Test Product",
      description: overrides.description ?? "A test product",
      price: overrides.price ?? 99.99,
      categoryId: overrides.categoryId ?? null,
      brandId: overrides.brandId ?? null,
      images: overrides.images ?? ["https://placehold.co/600x400?text=Test"],
      specs: (overrides.specs as any) ?? { material: "Steel", weight: "5kg" },
    },
  });
}

// ─── User ───────────────────────────────────────────────────────────────────

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<{
    email: string;
    name: string | null;
    companyName: string | null;
    phone: string | null;
    role: Role;
    isApproved: boolean;
  }> = {}
) {
  const email =
    overrides.email || `test-${uid("user")}@example.com`;
  return prisma.user.create({
    data: {
      email,
      name: overrides.name ?? "Test User",
      companyName: overrides.companyName ?? "Test Company",
      phone: overrides.phone ?? "+86 138 0000 0000",
      role: overrides.role ?? "CUSTOMER",
      isApproved: overrides.isApproved ?? false,
    },
  });
}

// ─── QuotationRequest ───────────────────────────────────────────────────────

export async function createTestQuotation(
  prisma: PrismaClient,
  overrides: Partial<{
    userId: string;
    status: "PENDING" | "RESPONDED" | "CONVERTED_TO_ORDER";
    items: unknown;
    adminNotes: string | null;
  }> = {}
) {
  return prisma.quotationRequest.create({
    data: {
      userId: overrides.userId ?? (await createTestUser(prisma)).id,
      status: overrides.status ?? "PENDING",
      items:
        overrides.items ??
        JSON.parse(
          JSON.stringify([
            {
              productId: "placeholder",
              sku: "SKU-001",
              name: "Test Item",
              quantity: 2,
              note: "Rush order",
            },
          ])
        ),
      adminNotes: overrides.adminNotes ?? null,
    },
  });
}
