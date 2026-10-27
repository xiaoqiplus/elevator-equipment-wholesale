import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "465"),
    secure: SMTP_PORT !== "587",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// ── 简易内存限流（挡脚本刷表单；Hostinger 上是单进程，够用）──
// 同一 IP 每 10 分钟最多 5 条；进程重启即清零，属预期行为
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  // 顺手清理过大的表，避免内存增长
  if (hits.size > 5000) {
    const stale: string[] = [];
    hits.forEach((v: number[], k: string) => {
      if (!v.some((t: number) => now - t < WINDOW_MS)) stale.push(k);
    });
    stale.forEach((k: string) => hits.delete(k));
  }
  return false;
}

function clientIp(request: Request): string {
  const h = request.headers;
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later, or email us directly." },
      { status: 429 }
    );
  }

  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }
    if (String(message).length > 5000 || String(name).length > 200) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    // 存库（这一步必须成功，否则询盘就真丢了）
    const contact = await prisma.contactMessage.create({
      data: {
        name: String(name).slice(0, 200),
        email: String(email).trim().slice(0, 200),
        phone: phone ? String(phone).slice(0, 50) : null,
        message: String(message).slice(0, 5000),
      },
    });

    // 邮件通知：best-effort，但失败必须留得下痕迹（不能只是静默）
    let emailed = false;
    let emailError: string | null = null;
    try {
      const transporter = createTransporter();
      if (!transporter) {
        emailError = "SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing)";
      } else {
        const notifyEmail = process.env.NOTIFY_EMAIL || "info@quickeaseliftparts.com";
        const isProductInquiry = String(message).startsWith("[Inquiry about");
        const subject = isProductInquiry
          ? `New Product Inquiry from ${name}`
          : `New Contact Message from ${name}`;
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: notifyEmail,
          // 客户留了邮箱就设 replyTo，直接点"回复"就能回到客户
          replyTo: String(email).trim(),
          subject,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone || "N/A"}`,
            `Received: ${new Date().toISOString()}`,
            `Message ID: ${contact.id}`,
            "",
            `Message:`,
            message,
            "",
            "— 也可在后台 /admin/messages 查看全部询盘",
          ].join("\n"),
        });
        emailed = true;
      }
    } catch (emailErr) {
      emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
      // ★ 用固定前缀 + 完整内容和 ID，SMTP 挂掉时也能从服务器日志里人工捞回这条询盘
      console.error(
        `[CONTACT-EMAIL-FAILED] id=${contact.id} name=${JSON.stringify(name)} email=${JSON.stringify(
          email
        )} phone=${JSON.stringify(phone || "")} reason=${emailError} message=${JSON.stringify(
          String(message).slice(0, 2000)
        )}`
      );
    }
    if (!emailed && !emailError) {
      emailError = "unknown reason";
    }

    // emailed 字段只供调试/前端埋点用，客户侧文案不变（不暴露内部状态）
    return NextResponse.json({ success: true, id: contact.id, emailed });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
