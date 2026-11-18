import { permanentRedirect } from "next/navigation";

// 2026-06-30 起的跳转壳。2026-11-18 改成 308 单跳：
// 原来 redirect() 是 307（且 /categories/ 会先被尾斜杠 308 打一次，形成两跳），
// GSC 会把它记成「网页会自动重定向」；它已不在 sitemap，站内也无链接。
export default function CategoriesPage() {
  permanentRedirect("/products");
}
