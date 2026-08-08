import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 临时诊断路由：dump 所有请求头，确认 Hostinger 反代传的真实 IP 字段
// 用后即删
export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};
  request.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });
  return NextResponse.json({
    note: "temporary diagnostic route - delete after verification",
    headers,
  });
}
