import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approveUser } from "@/lib/db/user";

/**
 * PATCH /api/admin/users/[id]/approve
 *
 * Admin-only endpoint to approve a pending customer registration.
 * Uses the same getServerSession pattern as the quotations route.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Get session using the same dynamic import pattern
  let session: any = null;
  try {
    const mod = await import("next-auth");
    const fn = (mod as any).default;
    session = typeof fn === "function" ? fn() : null;
  } catch {
    // not authenticated
  }

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the current user to check admin role
  const currentUser = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
