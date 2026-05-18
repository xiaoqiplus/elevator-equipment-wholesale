import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { validateCsrf } from "../csrf";
import { createHash } from "crypto";

// ── Helpers ────────────────────────────────────────────────────────────────

const TEST_SECRET = "test-csrf-secret-key-at-least-32-chars!!!";

function makeCsrfCookie(rawToken: string): string {
  const hash = createHash("sha256")
    .update(`${rawToken}${TEST_SECRET}`)
    .digest("hex");
  return `${hash}|${rawToken}`;
}

function makeRequest(
  cookieValue: string | null,
  headerToken: string | null,
  bodyToken: string | null = null
): NextRequest {
  const init: any = { headers: {} };

  if (cookieValue) {
    init.headers["Cookie"] = `next-auth.csrf-token=${cookieValue}`;
  }

  if (headerToken) {
    init.headers["X-CSRF-Token"] = headerToken;
  }

  // Body token is read via request.json(), which requires a body
  const baseUrl = "http://localhost:3000/api/admin";
  if (bodyToken && !headerToken) {
    init.method = "POST";
    init.body = JSON.stringify({ csrfToken: bodyToken });
    // Simulate body stream for .json() — NextRequest reads from the body
  }

  return new NextRequest(baseUrl, init);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("validateCsrf", () => {
  const rawToken = "a1b2c3d4e5f6g7h8i9j0";

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true for a valid CSRF token in header", async () => {
    const cookie = makeCsrfCookie(rawToken);
    const req = makeRequest(cookie, rawToken);

    const result = await validateCsrf(req);
    expect(result).toBe(true);
  });

  it("should return false when CSRF cookie is missing", async () => {
    const req = makeRequest(null, rawToken);
    const result = await validateCsrf(req);
    expect(result).toBe(false);
  });

  it("should return false when X-CSRF-Token header is missing", async () => {
    const cookie = makeCsrfCookie(rawToken);
    const req = makeRequest(cookie, null);
    const result = await validateCsrf(req);
    expect(result).toBe(false);
  });

  it("should return false when CSRF token does not match cookie hash", async () => {
    const cookie = makeCsrfCookie(rawToken);
    const wrongToken = "wrong-token-that-does-not-match";

    const req = makeRequest(cookie, wrongToken);
    const result = await validateCsrf(req);
    expect(result).toBe(false);
  });

  it("should return false when NEXTAUTH_SECRET is not set", async () => {
    delete (process.env as any).NEXTAUTH_SECRET;

    const cookie = makeCsrfCookie(rawToken);
    const req = makeRequest(cookie, rawToken);
    const result = await validateCsrf(req);
    expect(result).toBe(false);
  });

  it("should return false for tampered cookie format", async () => {
    // Cookie missing the hash|raw separator
    const req = makeRequest("not-a-valid-cookie", rawToken);
    const result = await validateCsrf(req);
    expect(result).toBe(false);
  });

  it("should return false for an empty cookie value", async () => {
    const req = makeRequest("|", rawToken);
    const result = await validateCsrf(req);
    expect(result).toBe(false);
  });

  it("should return false for empty string token", async () => {
    const cookie = makeCsrfCookie(rawToken);
    const req = makeRequest(cookie, "");
    const result = await validateCsrf(req);
    expect(result).toBe(false);
  });
});
