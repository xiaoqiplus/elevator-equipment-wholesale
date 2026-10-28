import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 部署探针（公开，无敏感信息）
 * ---------------------------------------------------------------------------
 * 用途：判断「新代码到底部署上去了没有」。
 *   推代码前先记下 buildId / startedAt，推完再看：
 *     - 404            → 这次构建没成功（或还没发布），线上仍是旧版
 *     - buildId 变了   → 新构建已发布（Hostinger 每次构建都会生成新 BUILD_ID）
 *     - startedAt 变了 → 应用进程重启过（部署会重启）
 * 另外暴露 Node 版本：`geoip-lite@2` 要求 Node >= 24，构建容器是 22，
 * 这里能直接看出运行时是哪一版。
 *
 * 不放大攻击面：不读环境变量、不碰数据库、不返回任何密钥。
 */
export async function GET() {
  let buildId = "unknown";
  try {
    // next start 的工作目录就是项目根，BUILD_ID 每次构建重写
    buildId = fs.readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    // 读不到不视为故障（例如 standalone 输出或权限限制）
  }

  const startedAt = new Date(Date.now() - process.uptime() * 1000);

  return NextResponse.json(
    {
      ok: true,
      buildId,
      startedAt: startedAt.toISOString(),
      uptimeSec: Math.round(process.uptime()),
      node: process.versions.node,
      env: process.env.NODE_ENV ?? "unknown",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
