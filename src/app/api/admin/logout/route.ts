import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const res = NextResponse.redirect(new URL("/admin/login", "https://quickeaseliftparts.com"));
  res.cookies.set("admin_token", "", { maxAge: 0, path: "/admin" });
  return res;
}
