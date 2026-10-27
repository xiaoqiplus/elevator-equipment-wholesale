import { NextResponse } from "next/server";
import {
  ADMIN_USERNAME,
  ADMIN_TOKEN_MAX_AGE_SEC,
  createAdminToken,
  getAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 口令只从环境变量读（原先明文硬编码在本文件里，且仓库是 public）
  const expected = getAdminPassword();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "后台口令未配置：请在 Hostinger 面板的环境变量里设置 ADMIN_PASSWORD，然后重启应用。",
      },
      { status: 503 }
    );
  }

  try {
    const { username, password } = await req.json();
    if (username === ADMIN_USERNAME && typeof password === "string" && password === expected) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("admin_token", createAdminToken(), {
        httpOnly: true,
        maxAge: ADMIN_TOKEN_MAX_AGE_SEC,
        path: "/",
        sameSite: "lax",
        // 线上是 https；本地 http 开发时不加 secure，否则浏览器不保存 cookie
        secure: process.env.NODE_ENV === "production",
      });
      return res;
    }
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
