import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const articles = [
  { id: "cmr0k37sm0000fnwf7gg8ba21", img: "/uploads/7gg8ba21_article.jpg" },
  { id: "cmr0k38fj0001fnwf6cmh6fmu", img: "/uploads/6cmh6fmu_article.jpg" },
  { id: "cmr0k2u9d0000ryosvcc02zwg", img: "/uploads/vcc02zwg_article.jpg" },
  { id: "cmr0k39bh0002fnwfd0b2u1w5", img: "/uploads/d0b2u1w5_article.jpg" },
];

export async function GET() {
  const results: any[] = [];
  for (const article of articles) {
    try {
      const updated = await prisma.knowledge.update({
        where: { id: article.id },
        data: { images: article.img },
      });
      results.push({ id: article.id.slice(-8), title: updated.title?.slice(0, 40), images: updated.images, status: "ok" });
    } catch (err: any) {
      results.push({ id: article.id.slice(-8), error: err.message, status: "fail" });
    }
  }
  return NextResponse.json({ success: true, results });
}
