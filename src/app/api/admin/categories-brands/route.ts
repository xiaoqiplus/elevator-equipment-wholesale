import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (type === "categories") {
    const cats = await prisma.category.findMany({
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(cats);
  }

  if (type === "brands") {
    const brs = await prisma.brand.findMany({
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(brs);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
