/**
 * 分类页 / 品牌页的 canonical 构造（2026-11-18 抽出，两处同源）
 *
 * 修复的历史缺陷（GSC「重复网页，用户未选定规范网页」/「备用网页」）：
 * 原来写成 `hasFilter || pageNum<=1 ? 根URL : ?page=N` —— 筛选优先、分页被吞，
 * 于是 `/categories/x?brand=kone&page=2` 渲染的是「Kone 筛选第 2 页」，
 * canonical 却是「无筛选第 1 页」：规范目标与页面内容不一致，Google 会忽略它
 * 或者把这批 URL 判成重复内容。
 *
 * 现在口径：
 * - 第 1 页（含带筛选的第 1 页）→ 归一到分类/品牌根 URL；
 * - 第 2 页及以后 → **自指**，并把筛选参数一并带上（内容即「筛选 + 第 N 页」）。
 * 筛选根视图仍归一到根 URL，这是标准的导航筛选处理；分页页则必须自指，
 * 否则第 2 页起的产品会被判重复。
 */
export type CatalogKind = "categories" | "brands";

export function catalogCanonical(
  kind: CatalogKind,
  slug: string,
  filterKey: "brand" | "category",
  filterValue: string,
  pageNum: number
): string {
  const base = `/${kind}/${slug}`;
  if (pageNum <= 1) return base;

  const qs = new URLSearchParams();
  if (filterValue) qs.set(filterKey, filterValue);
  qs.set("page", String(pageNum));
  return `${base}?${qs.toString()}`;
}
