import * as geoip from "geoip-lite";
import { prisma } from "@/lib/prisma";

// ── 访问记录模块 ────────────────────────────────────────────────────────
// 根 layout 每收到一个页面请求调用 recordVisit(headers())：
//   取真实 IP → geoip-lite 查国家（nodejs runtime，纯 JS 离线库）→ upsert 进 VisitLog
// 同 IP 合并计数（ip @unique），数据量 = 独立 IP 数，不会因爬虫刷屏膨胀
// 表结构用 ensureTable() 幂等创建（Hostinger 构建环境无法 prisma db push，
// 沿用 SiteConfig 的 raw SQL 建表模式）。记录失败静默，绝不影响页面渲染。

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

    const path = headers.get("x-pathname") || "/";
    // 管理后台与 API 不算外部访问，不记录
    if (path.startsWith("/admin") || path.startsWith("/api/") || path.startsWith("/_next")) return;

    const ua = (headers.get("user-agent") || "").slice(0, 500);

    let country: string | null = null;
    try {
      const geo = geoip.lookup(ip);
      country = geo?.country || null;
    } catch {
      country = null;
    }

    await ensureVisitLogTable();
    await prisma.visitLog.upsert({
      where: { ip },
      update: {
        visitCount: { increment: 1 },
        lastSeen: new Date(),
        path,
        userAgent: ua,
      },
      create: { ip, country, path, userAgent: ua },
    });
  } catch {
    // 记录失败绝不影响页面渲染
  }
}
