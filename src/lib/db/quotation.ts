import type { PrismaClient, Prisma } from "@prisma/client";

export interface CreateQuotationData {
  userId: string;
  items: Prisma.InputJsonValue;
  adminNotes?: string;
}

/**
 * Create a new quotation request with the given items snapshot.
 * Items should be an array of product snapshots, e.g.:
 *   [{ productId, sku, name, quantity, note }]
 */
export function createQuotation(
  prisma: PrismaClient,
  data: CreateQuotationData
) {
  return prisma.quotationRequest.create({
    data: {
      userId: data.userId,
      items: data.items,
      adminNotes: data.adminNotes ?? null,
      status: "PENDING",
    },
    include: {
      user: true,
    },
  });
}

/**
 * Retrieve all quotation requests for a user, ordered by creation date
 * descending (most recent first).
 */
export function getUserQuotations(prisma: PrismaClient, userId: string) {
  return prisma.quotationRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
    },
  });
}

/**
 * Update the status of a quotation request. Optionally set admin notes
 * at the same time.
 */
export function updateQuotationStatus(
  prisma: PrismaClient,
  quotationId: string,
  status: "PENDING" | "RESPONDED" | "CONVERTED_TO_ORDER",
  adminNotes?: string
) {
  return prisma.quotationRequest.update({
    where: { id: quotationId },
    data: {
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    },
  });
}
