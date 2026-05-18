import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const err = await checkAdmin();
  if (err) return err;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status: newStatus, adminNotes } = body;

  if (!["PENDING", "RESPONDED", "CONVERTED_TO_ORDER"].includes(newStatus)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  const updated = await prisma.quotationRequest.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    },
  });

  return NextResponse.json(updated, { status: 200 });
}
