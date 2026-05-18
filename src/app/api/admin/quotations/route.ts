import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null; // authenticated as admin
}

export async function GET() {
  const err = await checkAdmin();
  if (err) return err;

  const quotations = await prisma.quotationRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotations, { status: 200 });
}
