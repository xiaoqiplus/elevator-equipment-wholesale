import type { NextRequest } from "next/server";
import { createHash } from "crypto";

/**
 * NextAuth CSRF cookie name.
 * Matches the cookie issued by next-auth during sign-in flows
 * and page renders (via `getCsrfToken`).
 */
const CSRF_COOKIE = "next-auth.csrf-token";

/**
 * Validate a CSRF token against the NextAuth CSRF cookie.
 *
 * NextAuth stores the CSRF cookie as `hash|rawToken`.
 * The client sends only the raw token (via X-CSRF-Token header
 * or csrfToken body field). We re-hash the client token with
 * NEXTAUTH_SECRET and compare against the cookie hash.
 *
 * @returns true if the CSRF token is valid, false otherwise.
 */
export async function validateCsrf(request: NextRequest): Promise<boolean> {
  try {
    // 1. Read cookie
    const cookieHeader = request.cookies.get(CSRF_COOKIE);
    if (!cookieHeader) return false;

    const [cookieHash, cookieRaw] = cookieHeader.value.split("|");
    if (!cookieHash || !cookieRaw) return false;

    // 2. Read client token (header takes priority, then body)
    let clientToken: string | null = null;

    // Header
    const headerToken = request.headers.get("X-CSRF-Token");
    if (headerToken) {
      clientToken = headerToken;
    }

    // Body (only for JSON requests, fallback)
    if (!clientToken) {
      try {
        const cloned = request.clone();
        const body = await cloned.json();
        clientToken = body?.csrfToken ?? null;
      } catch {
        // Body not JSON or not parsed — no usable token
      }
    }

    if (!clientToken) return false;

    // 3. Hash client token with NEXTAUTH_SECRET and compare
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return false;

    const expectedHash = createHash("sha256")
      .update(`${clientToken}${secret}`)
      .digest("hex");

    // Constant-time: compare lengths AND content
    if (expectedHash.length !== cookieHash.length) return false;

    let diff = 0;
    for (let i = 0; i < expectedHash.length; i++) {
      diff |= expectedHash.charCodeAt(i) ^ cookieHash.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
