import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing route handlers directly.
 *
 * @param url - The URL string including query parameters
 * @param options - Additional request options
 * @returns A NextRequest instance suitable for passing to route handlers
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: BodyInit | null;
  }
): NextRequest {
  const { method = "GET", headers = {}, body = null } = options ?? {};

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body,
  });
}

/**
 * Parse the JSON body from a NextResponse.
 * Works with the direct response returned by route handlers.
 */
export async function parseResponse<T = unknown>(
  response: Response
): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Helper to extract an array of products from a paginated API response.
 */
export interface PaginatedResponse<T> {
  products: T[];
  total: number;
  page: number;
  pageSize: number;
}
