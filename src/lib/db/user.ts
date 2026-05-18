import type { PrismaClient } from "@prisma/client";

/**
 * Find a user by email using case-insensitive matching.
 * For PostgreSQL this uses the `insensitive` mode via Prisma.
 */
export function getUserByEmail(prisma: PrismaClient, email: string) {
  return prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });
}

/**
 * Approve a user by setting isApproved to true.
 * Throws if the user does not exist.
 */
export function approveUser(prisma: PrismaClient, userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isApproved: true },
  });
}
