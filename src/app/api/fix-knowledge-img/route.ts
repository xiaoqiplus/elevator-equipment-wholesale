import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const updated = await prisma.knowledge.update({
      where: { id: "cmr0k39bh0002fnwfd0b2u1w5" },
      data: { images: "/uploads/d0b2u1w5_article.jpg" },
    });
    return NextResponse.json({ success: true, title: updated.title, images: updated.images });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
