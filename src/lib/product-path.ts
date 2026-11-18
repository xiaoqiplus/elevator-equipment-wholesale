/**
 * 产品规范路径的**唯一真源**（2026-11-18 抽出）
 *
 * 背景：SKU 是外部导入的，历史上出现过空格、斜杠等保留字符。
 * 列表页/详情页/搜索页原来都裸拼 `/products/${sku}`，于是页面上真的会出现
 *   href="/products/QE-K-KM611085H01 "   （尾随空格）
 *   href="/products/MP310SCE08/09"      （斜杠，变成两段路径）
 * 这类链接点进去 100% 404，Google 顺着它们抓一遍就记进「未找到（404）」。
 *
 * 所有对外输出产品 URL 的地方都必须走这个函数，禁止再裸拼。
 * 注意：encodeURIComponent('MP310SCE08/09') = 'MP310SCE08%2F09'，
 * 但实测 hcdn/Next 对 %2F 仍返回 404 —— 这种 SKU 必须去后台改名（空格/斜杠改 `-`），
 * 编码只是防御，不是根治。
 */
export function productPath(sku: string): string {
  return `/products/${encodeURIComponent(sku)}`;
}
