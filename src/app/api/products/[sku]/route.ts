import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/utils";

/**
 * GET /api/products/[sku]
 *
 * Returns a single product with its category, brand, and documents.
 *
 * Price protection:
 *   Returns price only when the user has an approved session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  const { sku } = params;

  if (!sku) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ── Get session for price protection ───────────────────────────────────
  const session = await getSessionFromRequest(request);
  const showPrice = session?.isApproved === true;

  const product = await prisma.product.findUnique({
    where: { sku },
    include: {
      category: true,
      brand: true,
      documents: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    price: showPrice ? product.price : null,
  });
}
