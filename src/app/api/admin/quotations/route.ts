import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/utils";

async function checkAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null; // authenticated as admin
}

export async function GET(request: NextRequest) {
  const err = await checkAdmin(request);
  if (err) return err;

  const quotations = await prisma.quotationRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotations, { status: 200 });
}
