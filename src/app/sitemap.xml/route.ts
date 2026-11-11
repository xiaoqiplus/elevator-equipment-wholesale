import { createHash } from "crypto";
import { buildSitemapEntries, renderSitemapXml } from "@/lib/sitemap-data";

/**
 * GET /sitemap.xml（2026-11-11 从 src/app/sitemap.ts 改为路由处理器）
 *
 * 为什么不用 metadata 路由：Next 会强制追加 `Cache-Control: must-revalidate`，
 * 与我们想要的 `s-maxage` 并存成两个头，边缘缓存很可能被后者废掉。
 * 自己写处理器才能：① 只发一个 Cache-Control；② 发 ETag 并在
 * If-None-Match 命中时回 304，爬虫重复抓取时几乎零传输。
 */
export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(request: Request) {
  const entries = await buildSitemapEntries();
  const xml = renderSitemapXml(entries);

  const etag = `"${createHash("sha1").update(xml).digest("hex").slice(0, 32)}"`;

  // 条件请求：内容没变就回 304，不重复传 700 KB
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": CACHE_CONTROL },
    });
  }

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
      ETag: etag,
    },
  });
}
