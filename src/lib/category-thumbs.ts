import { prisma } from "@/lib/prisma";

/**
 * 获取每个分类的第一个有图产品（按名称排序），用作分类缩略图。
 * 一次查询所有产品的 categoryId+images，在内存中分组，
 * 避免对每个分类单独查询导致数据库连接池耗尽。
 */
export async function getFirstProductImageByCategory(): Promise<
  Map<string, string[]>
> {
  const allProds = await prisma.product.findMany({
    where: { categoryId: { not: null } },
    select: { categoryId: true, images: true },
    orderBy: { name: "asc" },
  });

  const map = new Map<string, string[]>();
  for (const p of allProds) {
    if (!p.categoryId) continue;
    if (map.has(p.categoryId)) continue;
    if (Array.isArray(p.images) && p.images.length > 0) {
      const imgs = p.images.filter((img): img is string => typeof img === "string");
      if (imgs.length > 0) map.set(p.categoryId, imgs);
    }
  }
  return map;
}
