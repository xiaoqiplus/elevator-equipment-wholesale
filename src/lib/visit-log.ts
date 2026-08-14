import * as path from "path";
import { prisma } from "@/lib/prisma";

// ── 访问记录模块 ────────────────────────────────────────────────────────
// 根 layout 每收到一个页面请求调用 recordVisit(headers())：
//   取真实 IP → geoip-lite 查国家（country-only 模式）→ upsert 进 VisitLog
// 同 IP 合并计数（ip @unique），数据量 = 独立 IP 数，不会因爬虫刷屏膨胀
// 表结构用 ensureTable() 幂等创建（Hostinger 构建环境无法 prisma db push，
// 沿用 SiteConfig 的 raw SQL 建表模式）。记录失败静默，绝不影响页面渲染。

// ⚠️ geoip-lite 数据文件自带策略：
//   Hostinger 共享主机构建后会清理 node_modules 里的大文件（geoip-lite 的
//   data/ 共 115MB 会被删，运行时 preload() 直接 ENOENT → 所有页面 500）。
//   因此把 country 数据文件（3.2MB×2）提交在项目根 geoip-data/，
//   require geoip-lite 之前设置 global.geodatadir 指向它（模块加载时
//   path.resolve(__dirname, global.geodatadir || ...) 计算数据路径）。
//   country 文件存在时 preload() 自动降级 country-only 模式，满足"精确到国家"。

let tableEnsured = false;

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS VisitLog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(64) NOT NULL UNIQUE,
  country VARCHAR(8),
  path VARCHAR(512),
  userAgent TEXT,
  firstSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  visitCount INT DEFAULT 1,
  INDEX (country),
  INDEX (lastSeen)
)
`;

export async function ensureVisitLogTable(): Promise<void> {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(CREATE_TABLE_SQL);
  } catch {
    // 已存在 / 权限问题：静默，查询时再尝试
  }
  tableEnsured = true;
}

// geoip-lite 国家查询（延迟 require + 自带数据目录），失败返回 null 不影响记录
function lookupCountry(ip: string): string | null {
  try {
    (globalThis as { geodatadir?: string }).geodatadir =
      path.join(process.cwd(), "geoip-data") + "/";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const geoip = require("geoip-lite");
    const r = geoip.lookup(ip);
    return r?.country || null;
  } catch {
    return null;
  }
}

// 提取真实客户端 IP：x-real-ip（LiteSpeed 已覆盖 XFF 伪造，最可靠）优先
function extractIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip");
  if (real) return real.split(",")[0].trim() || null;
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.split(",")[0].trim() || null;
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || null;
  return null;
}

function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "127.0.0.1") return true;
  if (lower.startsWith("10.") || lower.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(lower)) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // IPv6 ULA
  return false;
}

export async function recordVisit(headers: Headers): Promise<void> {
  try {
    const ip = extractIp(headers);
    if (!ip || isPrivateIp(ip)) return;

    const pathname = headers.get("x-pathname") || "/";
    // 管理后台与 API 不算外部访问，不记录
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/") || pathname.startsWith("/_next")) return;

    const ua = (headers.get("user-agent") || "").slice(0, 500);
    const country = lookupCountry(ip);

    await ensureVisitLogTable();
    await prisma.visitLog.upsert({
      where: { ip },
      update: {
        visitCount: { increment: 1 },
        lastSeen: new Date(),
        path: pathname,
        userAgent: ua,
      },
      create: { ip, country, path: pathname, userAgent: ua },
    });
  } catch {
    // 记录失败绝不影响页面渲染
  }
}
