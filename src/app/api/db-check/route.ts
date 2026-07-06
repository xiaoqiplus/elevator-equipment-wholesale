import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = { env: {}, db: null, errors: [] };

  // Check environment
  results.env.hasDatabaseUrl = !!process.env.DATABASE_URL;
  results.env.urlPrefix = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.substring(0, 50) + "..."
    : "NOT SET";

  // Test database connection
  try {
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    await prisma.$connect();
    results.db = "Connected!";

    // Try a simple query
    const brandCount = await prisma.brand.count();
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    results.db = {
      brands: brandCount,
      products: productCount,
      categories: categoryCount,
    };

    await prisma.$disconnect();
  } catch (err: any) {
    results.db = "FAILED";
    results.errors.push({
      message: err.message?.substring(0, 300),
      code: err.code,
    });
  }

  return NextResponse.json(results);
}
