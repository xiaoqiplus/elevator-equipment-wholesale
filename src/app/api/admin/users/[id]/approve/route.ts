import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approveUser } from "@/lib/db/user";
import { auth } from "@/lib/auth/auth";
import { validateCsrf } from "@/lib/auth/csrf";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/users/[id]/approve
 *
 * Admin-only endpoint to approve a pending customer registration.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Find target user
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Approve
  const updated = await approveUser(prisma, id);

  return NextResponse.json({ id: updated.id, isApproved: updated.isApproved }, { status: 200 });
}
