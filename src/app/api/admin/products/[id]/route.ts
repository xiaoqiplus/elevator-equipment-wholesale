import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/utils";

async function checkAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const err = await checkAdmin(request);
  if (err) return err;

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true }, { status: 200 });
}
