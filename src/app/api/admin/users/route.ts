import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/utils";

async function checkAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(request: NextRequest) {
  const err = await checkAdmin(request);
  if (err) return err;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Don't expose password hashes
  const safe = users.map(({ passwordHash, ...rest }) => rest);

  return NextResponse.json(safe, { status: 200 });
}
