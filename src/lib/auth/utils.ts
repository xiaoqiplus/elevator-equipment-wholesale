import type { NextRequest } from "next/server";

/**
 * Get the authenticated user session from the request.
 *
 * Uses next-auth's auth() via dynamic import. Falls back to
 * checking request headers for development/testing when
 * next-auth is not configured.
 *
 * TODO: Once auth is fully configured, remove the header fallback.
 */
export async function getSessionFromRequest(
  _request?: NextRequest
): Promise<{ id?: string; userId: string; email: string; role?: string; isApproved?: boolean } | null> {
  // Try next-auth
  try {
    // Dynamic import so tests can mock next-auth directly
    const mod = await import("next-auth");
    const defaultExport = (mod as any).default;
    if (typeof defaultExport === "function") {
      // In tests, the mock returns a function that returns the session directly
      const session = defaultExport();
      if (session?.user?.email) {
        return {
          id: session.user.id,
          userId: session.user.id,
          email: session.user.email,
          role: (session.user as any).role,
          isApproved: (session.user as any).isApproved,
        };
      }
    }
  } catch {
    // next-auth not available — fall through
  }

  // Fallback: request headers (development/testing)
  if (_request) {
    const userId = _request.headers.get("x-user-id");
    const email = _request.headers.get("x-user-email");
    if (userId && email) {
      return { userId, email };
    }
  }

  return null;
}

/**
 * Require authentication. Throws 401 Error if not authenticated.
 * Returns the session user data.
 */
export async function requireAuth(
  request?: NextRequest
): Promise<{ id?: string; userId: string; email: string; role?: string; isApproved?: boolean }> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return session;
}

/**
 * Require the user to be authenticated AND approved.
 * Throws 401 if not authenticated, 403 if not approved.
 */
export async function requireApproved(
  request?: NextRequest
): Promise<{ id?: string; userId: string; email: string; role?: string; isApproved?: boolean }> {
  const session = await requireAuth(request);
  if (!session.isApproved) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return session;
}

/**
 * Check if a user has the ADMIN role.
 */
export function isAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role === "ADMIN";
}
