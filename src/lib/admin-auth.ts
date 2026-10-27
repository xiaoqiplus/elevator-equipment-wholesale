import crypto from "crypto";
import type { NextRequest } from "next/server";

/**
 * 后台认证工具
 *
 * ⚠️ 历史漏洞（2026-10-27 修复）：
 * 原实现是 token = base64("admin:<时间戳>")，校验时只做
 * `Buffer.from(token,"base64").toString().startsWith("admin:")` ——
 * 没有签名、没有密钥、没有有效期。
 * 后果：任何人只要带 cookie `admin_token=YWRtaW46eA==`（= base64("admin:x")）
 * 就能通过全部 /api/admin/* 的校验。已在线上实测复现（能读到完整产品数据）。
 *
 * 现在的做法：HMAC-SHA256 签名 + 12 小时有效期 + 定长比对。
 * 密钥来自环境变量，且"没配置口令就不认任何登录"（fail-closed）。
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 与 login 路由里 cookie 的 maxAge 保持一致

export const ADMIN_USERNAME = "admin";
export const ADMIN_TOKEN_MAX_AGE_SEC = TOKEN_TTL_MS / 1000;

/** 后台口令只从环境变量读；未配置或为空 → 返回 null（此时任何登录都不通过） */
export function getAdminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) return null;
  const v = p.trim();
  return v.length > 0 ? v : null;
}

/** 签名密钥：优先 ADMIN_SECRET，否则从口令派生 —— 改口令即自动吊销所有旧会话 */
function signingSecret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

/** 签发 token：<base64url(payload)>.<base64url(hmac)> */
export function createAdminToken(): string {
  const payload = `${ADMIN_USERNAME}:${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

/** 校验请求携带的 admin_token；任何一项不满足即 false */
export function checkAdminAuth(req: NextRequest): boolean {
  const raw = req.cookies.get("admin_token")?.value;
  if (!raw) return false;

  // 密钥未配置 → 一律不通过（宁可锁死，也不接受可伪造的凭证）
  const key = signingSecret();
  if (!key) return false;

  // 用 lastIndexOf：payload 的 base64url 里不会出现 "."，签名也不会，但保守处理
  const dot = raw.lastIndexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return false;

  const b64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString();
  } catch {
    return false;
  }
  if (!payload.startsWith(`${ADMIN_USERNAME}:`)) return false;

  // 定长比对，避免时序侧信道
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  // 有效期（同时拒绝未来时间戳超过 1 分钟的异常 token）
  const ts = Number(payload.slice(ADMIN_USERNAME.length + 1));
  if (!Number.isFinite(ts)) return false;
  const now = Date.now();
  if (ts > now + 60_000) return false;
  if (now - ts > TOKEN_TTL_MS) return false;

  return true;
}
