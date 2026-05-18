import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth/utils";

/**
 * GET /api/products
 *
 * Query parameters:
 *   page     - Page number (default: 1)
 *   pageSize - Items per page (default: 10)
 *   category - Filter by category slug
 *   brand    - Filter by brand slug
 *   search   - Search by product name or SKU (case-insensitive contains)
 *
 * Price protection:
 *   Returns price only when the user has an approved session.
 *   Unauthenticated/unapproved users see price = null.
 *   See: PROJECT_BOOK.md §7 "价格保护"
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // ── Get session for price protection ───────────────────────────────────
  const session = await getSessionFromRequest(request);
  const showPrice = session?.isApproved === true;

  // ── Parse query parameters ─────────────────────────────────────────────
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.max(
    1,
    parseInt(searchParams.get("pageSize") ?? "10", 10) || 10
  );
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const search = searchParams.get("search");

  const skip = (page - 1) * pageSize;

  // ── Build where clause ─────────────────────────────────────────────────
  const where: Prisma.ProductWhereInput = {};

  if (category) {
    where.category = { slug: category };
  }

  if (brand) {
    where.brand = { slug: brand };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  // ── Query ──────────────────────────────────────────────────────────────
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

  // ── Price protection ───────────────────────────────────────────────────
  const sanitized = products.map((product) => ({
    ...product,
    price: showPrice ? product.price : null,
  }));

  return NextResponse.json({
    products: sanitized,
    total,
    page,
    pageSize,
  });
}
