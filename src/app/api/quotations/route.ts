import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewQuotation } from "@/lib/email/notifyQuotation";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

// ─── POST /api/quotations  ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "items is required and must be a non-empty array" },
      { status: 400 }
    );
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.sku || item.quantity === undefined || item.quantity === null) {
      return NextResponse.json(
        { error: `Item at index ${i} must have 'sku' and 'quantity'` },
        { status: 400 }
      );
    }
  }

  // Look up server-side prices AND names from database.
  // Client-supplied price and name MUST be ignored and replaced
  // with authoritative server values.
  const skus = items.map((item: any) => item.sku);
  const dbProducts = await prisma.product.findMany({
    where: { sku: { in: skus } },
  });
  const productMap = new Map(dbProducts.map((p) => [p.sku, p]));

  const itemsSnapshot = items.map((item: any) => {
    const dbProduct = productMap.get(item.sku);
    return {
      sku: item.sku,
      name: dbProduct?.name ?? (item.name || item.sku),
      quantity: item.quantity,
      price: Number(dbProduct?.price ?? 0),
    };
  });

  const quotation = await prisma.quotationRequest.create({
    data: {
      userId: user.id!,
      status: "PENDING",
      items: itemsSnapshot,
    },
  });

  notifyNewQuotation({
    id: quotation.id,
    status: quotation.status,
    items: itemsSnapshot,
    user: {
      email: user.email!,
      name: user.name,
      companyName: (user as any).companyName,
    },
    createdAt: quotation.createdAt,
  }).catch((err) => {
    console.error("[POST /api/quotations] Email notification failed:", err);
  });

  return NextResponse.json(
    { id: quotation.id, status: quotation.status, items: quotation.items, createdAt: quotation.createdAt },
    { status: 201 }
  );
}

// ─── GET /api/quotations  ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotations = await prisma.quotationRequest.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotations, { status: 200 });
}
