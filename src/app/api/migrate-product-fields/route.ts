import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: any = {};
  try {
    // 加列
    const cols = await prisma.$queryRawUnsafe<any[]>(
      "SHOW COLUMNS FROM Product",
    );
    const colNames = cols.map((c: any) => c.Field);
    results.existing = colNames.filter((c: string) =>
      ["warranty", "leadTime", "payment", "isHot"].includes(c),
    );

    if (!colNames.includes("warranty")) {
      await prisma.$executeRawUnsafe("ALTER TABLE Product ADD COLUMN warranty VARCHAR(255) NULL");
    }
    if (!colNames.includes("leadTime")) {
      await prisma.$executeRawUnsafe("ALTER TABLE Product ADD COLUMN leadTime VARCHAR(255) NULL");
    }
    if (!colNames.includes("payment")) {
      await prisma.$executeRawUnsafe("ALTER TABLE Product ADD COLUMN payment VARCHAR(255) NULL");
    }
    if (!colNames.includes("isHot")) {
      await prisma.$executeRawUnsafe("ALTER TABLE Product ADD COLUMN isHot BOOLEAN NOT NULL DEFAULT false");
    }

    // 填默认值（只填 NULL 的）
    const r1 = await prisma.$executeRawUnsafe(
      "UPDATE Product SET warranty='12 months' WHERE warranty IS NULL OR warranty=''",
    );
    const r2 = await prisma.$executeRawUnsafe(
      "UPDATE Product SET leadTime='3-5 working days' WHERE leadTime IS NULL OR leadTime=''",
    );
    const r3 = await prisma.$executeRawUnsafe(
      "UPDATE Product SET payment='Western Union/PayPal/T/T' WHERE payment IS NULL OR payment=''",
    );

    results.defaults = { warranty: r1, leadTime: r2, payment: r3 };
    results.ok = true;
  } catch (err: any) {
    results.ok = false;
    results.error = err.message?.substring(0, 300);
  }
  return NextResponse.json(results);
}
