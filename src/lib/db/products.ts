import type { PrismaClient } from "@prisma/client";

export interface ProductQueryOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Find a single product by its unique SKU, including related
 * category, brand, and documents.
 */
export function getProductBySku(prisma: PrismaClient, sku: string) {
  return prisma.product.findUnique({
    where: { sku },
    include: {
      category: true,
      brand: true,
      documents: true,
    },
  });
}

/**
 * Retrieve products belonging to a category identified by its slug,
 * with pagination support. Returns the product list and total count.
 */
export async function getProductsByCategory(
  prisma: PrismaClient,
  categorySlug: string,
  options: ProductQueryOptions = {}
) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    category: { slug: categorySlug },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        category: true,
        brand: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, pageSize };
}

/**
 * Retrieve products belonging to a brand identified by its slug,
 * with pagination support.
 */
export async function getProductsByBrand(
  prisma: PrismaClient,
  brandSlug: string,
  options: ProductQueryOptions = {}
) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    brand: { slug: brandSlug },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        category: true,
        brand: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, pageSize };
}
