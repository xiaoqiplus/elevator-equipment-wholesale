import { NextRequest, NextResponse } from "next/server";
import { CN_IPV4_RANGES, CN_IPV6_RANGES } from "@/lib/cn-ip-ranges";

export const config = {
  // 匹配所有走 Node 的请求（静态资源由 LiteSpeed 直服，到不了这里）
  matcher: ["/:path*"],
};

// 中国大陆 IP 屏蔽 middleware
// 原则 fail-open：只有明确判定为 CN 才拦截，其余全部放行（宁可漏，不误伤海外客户）

function getClientIp(request: NextRequest): string | null {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  return null;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let v = 0;
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    v = (v << 8) | n;
  }
  return v >>> 0;
}

// IPv6 -> 32 位 hex 字符串（8 组 16 位展开），字符串字典序 == 数值序
// 处理 :: 压缩、IPv4-mapped (::ffff:x.x.x.x)、zone id (%eth0)
function ipv6ToHex(ip: string): string | null {
  let s = ip.toLowerCase();
  const zoneIdx = s.indexOf("%");
  if (zoneIdx >= 0) s = s.slice(0, zoneIdx);

  // IPv4-mapped 尾部转 2 组 hex
  const v4m = s.match(/^(.*):(\d+\.\d+\.\d+\.\d+)$/);
  if (v4m) {
    const v4 = v4m[2].split(".").map((x: string) => Number(x));
    const hi = ((v4[0] << 8) | v4[1]).toString(16).padStart(4, "0");
    const lo = ((v4[2] << 8) | v4[3]).toString(16).padStart(4, "0");
    s = v4m[1] + ":" + hi + lo;
  }

  if (s.startsWith("::")) s = "0" + s;
  const sc = s.split("::");
  if (sc.length > 2) return null;
  const head = sc[0] ? sc[0].split(":") : [];
  const tail = sc[1] ? sc[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0) return null;
  const groups = head.concat(Array(missing).fill("0"), tail);
  if (groups.length !== 8) return null;
  let hex = "";
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    hex += g.padStart(4, "0");
  }
  return hex;
}

function inRanges(ip: number, ranges: Array<[number, number]>): boolean {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = ranges[mid][0];
    const e = ranges[mid][1];
    if (ip < s) hi = mid - 1;
    else if (ip > e) lo = mid + 1;
    else return true;
  }
  return false;
}

function inV6Ranges(hex: string, ranges: Array<[string, string]>): boolean {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = ranges[mid][0];
    const e = ranges[mid][1];
    if (hex < s) hi = mid - 1;
    else if (hex > e) lo = mid + 1;
    else return true;
  }
  return false;
}

function isCnIp(raw: string): boolean {
  const ip = raw.trim().toLowerCase();
  if (!ip) return false;

  // 含冒号视为 IPv6
  if (ip.includes(":")) {
    // IPv4-mapped 直接转 IPv4 查表
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) {
      const n = ipv4ToInt(mapped[1]);
      return n !== null && inRanges(n, CN_IPV4_RANGES);
    }
    const hex = ipv6ToHex(ip);
    if (!hex) return false;
    return inV6Ranges(hex, CN_IPV6_RANGES);
  }

  // IPv4
  const n = ipv4ToInt(ip);
  if (n === null) return false;
  return inRanges(n, CN_IPV4_RANGES);
}

const BLOCKED_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Access Restricted</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; background: #f5f6fa; color: #2c3e50; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; padding: 40px; max-width: 480px; }
  h1 { font-size: 26px; margin-bottom: 12px; }
  p { font-size: 15px; line-height: 1.7; color: #5a6a7a; }
</style>
</head>
<body>
<div class="box">
  <h1>Access Restricted</h1>
  <p>Sorry, this website is not available in your region.<br>If you believe this is an error, please contact us: info@quickeaseliftparts.com</p>
</div>
</body>
</html>`;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 管理后台放行（密码保护），避免国内管理操作被误伤
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  if (ip && isCnIp(ip)) {
    return new Response(BLOCKED_PAGE, {
      status: 403,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  return NextResponse.next();
}
