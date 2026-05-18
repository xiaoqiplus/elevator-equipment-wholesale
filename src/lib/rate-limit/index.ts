/**
 * Rate limiting utility.
 *
 * Uses Upstash Redis when environment variables are configured.
 * Falls back to an in-memory Map cache for development/testing.
 *
 * Configuration:
 *   UPSTASH_REDIS_REST_URL - Redis REST API URL
 *   UPSTASH_REDIS_REST_TOKEN - Redis REST API token
 */

const MAX_REQUESTS = 10;    // max requests per window
const WINDOW_MS = 60_000;   // 1 minute window

// In-memory fallback (used when Upstash is not configured)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

let upstashRatelimit: any = null;

function getUpstashRatelimit() {
  if (upstashRatelimit) return upstashRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    // Dynamic import to avoid hard dependency
    try {
      const { Ratelimit } = require("@upstash/ratelimit");
      const { Redis } = require("@upstash/redis");
      const redis = new Redis({ url, token });
      upstashRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
        analytics: true,
      });
      return upstashRatelimit;
    } catch {
      // fall through to memory fallback
    }
  }

  return null;
}

/**
 * Check if a request is within the rate limit.
 *
 * @param identifier - Unique identifier (e.g. IP address, email)
 * @returns `{ success: true }` if allowed, `{ success: false }` if rate limited
 */
export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean }> {
  const upstash = getUpstashRatelimit();

  if (upstash) {
    const result = await upstash.limit(identifier);
    return { success: result.success };
  }

  // In-memory fallback
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false };
  }

  entry.count++;
  return { success: true };
}
