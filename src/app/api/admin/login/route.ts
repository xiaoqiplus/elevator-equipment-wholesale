import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

const ADMIN_USER = "admin";
const ADMIN_PASS = "zctss833423";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = Buffer.from(`admin:${Date.now()}`).toString("base64");
      const res = NextResponse.json({ ok: true });
      res.cookies.set("admin_token", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 12, // 12 hours
        path: "/admin",
        sameSite: "lax",
      });
      return res;
    }
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
