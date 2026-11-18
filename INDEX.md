# elevator-website · 项目索引

> 电梯配件外贸站 quickeaseliftparts.com（3803 SKU）
>
> 分类：**Web 站点与服务** ｜ 返回 [项目总索引](../INDEX.md) ｜ 协作规则：[../CLAUDE.md](../CLAUDE.md)

## 一、基本信息

| 项 | 内容 |
|:--|:--|
| 路径 | `C:\Users\23236\projects\elevator-website` |
| 形态 | 网站（Next.js） |
| 技术栈 | Next.js 14 · React 18 · Prisma · MySQL · Tailwind |
| 运行环境 | Hostinger 共享主机；域名 Namesilo；Node |
| 当前状态 | **运营中；2026-11-18 GSC 第二轮修复已上线（buildId `OLwxvrsv8oMGtHyciNm5E`）：旧 URL 308 映射 113 条、www→apex、产品 URL 编码、分页 canonical、sitemap 3863 条无 404；52/52 测试通过。首版曾误加大小写规则导致 11 分钟全站重定向环，已 hotfix** |
| 最后改动 | 2026-11-18（GSC 索引修复 + 重定向环 hotfix） |
| 规模 | 12771 个文件 / 641.7 MB（不含 .git、node_modules、dist、build 等） |
| 文档 | 根目录 4 份 md；主文档：`STATE.md` |
| 协作元数据 | CLAUDE.md ✅ ｜ 共享进度 ✅ ｜ 署名台账 ✅ |

## 二、快速开始

```bash
pnpm install
pnpm dev            # 本地
pnpm build          # prisma generate + next build
```

## 三、目录结构

```
elevator-website/
├── .claude/                      # 共享进度（Claude 入口）
├── .hermes/                      # 署名台账 / 快照
├── geoip-data/                   # GeoIP 数据
├── prisma/
├── public/                       # 静态资源
├── scripts/                      # 脚本
├── src/                          # 源码
├── package.json                  # 前端依赖与脚本
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
├── vitest.config.ts              # 测试配置
└── components.json               # —
```

## 四、入口与关键文件

| 文件 | 作用 | 大小 |
|:--|:--|--:|
| [`package.json`](package.json) | 前端依赖与脚本 | 1.6 KB |
| [`tailwind.config.ts`](tailwind.config.ts) | Tailwind 配置 | 1.5 KB |
| [`tsconfig.json`](tsconfig.json) | TypeScript 配置 | 0.6 KB |
| [`vitest.config.ts`](vitest.config.ts) | 测试配置 | 0.4 KB |
| [`components.json`](components.json) | — | 0.4 KB |

**交付物**

- `postgresql-installer.exe`

## 五、文档地图

| 文档 | 内容 | 更新 |
|:--|:--|:--|
| [`CLAUDE.md`](CLAUDE.md) | 协作约定（Claude 自动读） | 2026-09-21 |
| [`PROJECT_BOOK.md`](PROJECT_BOOK.md) | 电梯零件 B2B 网站 - 项目书 | 2026-05-18 |
| [`README.md`](README.md) | 项目说明 | 2026-05-18 |
| [`STATE.md`](STATE.md) | 状态快照（第 0 节含 2026-11-10 GSC 修复记录） | 2026-11-10 |
| [`.claude/共享进度.md`](.claude/共享进度.md) | 脱敏进度副本（派生产物） | 2026-10-27 |

## 六、当前状态

电梯配件外贸站：产品/分类/品牌/知识库/联系表单，3803 个 SKU（2474 个从竞品导入）。Hostinger 共享主机 + MySQL，`/api/admin` 独立口令登录。2026-10-27 校正了 STATE 的技术栈/部署信息，并给后台加 HMAC token、给 `/api/contact` 加进程内限流；2026-10-28 定位到 hPanel 那条"部署失败"日志是旧构建记录（线上一直是新版），并给构建加线程上限与失败重试（`scripts/build-next.mjs`），首发构建成功；新增 `/api/health` 部署探针（buildId / Node 版本 / 启动时间），以后不必靠面板猜部署结果。

**下一步**：见 `STATE.md` 末尾待办；注意第 1–10 节仍是 2026-05 旧稿，现状以第 0 节为准。

**2026-11-10 SEO 修复（Google Search Console 报「备用网页」+「网页会自动重定向」）**：
根因是 2026-10-27 的 `f8dfd4a` 在根布局加了 `alternates: { canonical: "/" }`——Next 的 metadata 向下继承，导致除产品详情页外的所有页面（分类/品牌/知识库/联系/关于/产品列表）都在输出 `canonical = 首页`，等于主动放弃收录；同一提交又把跳转壳 `/categories` 和 3 个不存在的路由（`/quotation`、`/login`、`/register`）写进了 sitemap。已改：移除根布局 canonical、清理 sitemap、各路由补自指 canonical 与 title/description、`/brands` 死链修复 + 英文化、`/search` 改 noindex、剔除 7 个线上 404 的含空白 SKU。**已推送上线并线上复验通过**（sitemap 3864 条、各页 canonical 自指）。剩余待办：GSC 重新提交 sitemap + 请求编入索引；那 7 个 SKU 需在后台改名才能变回可访问；www → 非 www 建议加 301。

**2026-11-18 GSC 第二轮（404=129 / 重复网页=64 / 自动重定向=3）**：
- **404 主因**：2026-08-02 `e77bf01` migrate-brands 把 ~80 个品牌并入 `other`、16 个 `elevator-pcb-*` 并入 `elevator-pcb`，旧 URL 无任何 301 → 80 旧品牌 + 20 旧分类 + 4 旧路由 + 8 问题 SKU ≈ 114 条实锤。
- **改动**：新增 `legacy-redirects.mjs`（113 条 308 映射，含 www→apex）；`/products?view=brands`→`/brands`；新增 `src/lib/product-path.ts` 统一产品 URL 编码（替换 6 处裸拼）；`src/lib/catalog-url.ts` 修正分页 canonical（第 N 页自指且保留筛选参数）；分页越界改 404；sitemap 过滤空白/斜杠 SKU；分类/品牌/knowledge 大写 slug 308 归一；`/categories` 改单跳。
- **上线过程**：19:02 首版（buildId `1q17KIj9…`）因 Next redirects 大小写不敏感匹配，误加的大写规则让小写路径自我 308 → 全站 11 分钟重定向环；19:13 hotfix 上线（buildId `OLwxvrsv8oMGtHyciNm5E`），删掉大写规则并加 3 条回归测试锁死。
- **验证**：`tsc` 0 错、`vitest` 52/52、`npm run build` 通过；线上复验：/products /about /brands /knowledge 200、/categories 308→/products、/brands/thyssenkrupp 308→/brands/tke、?brand=kone&page=2 canonical 含 brand&page、?page=999 → 404、sitemap 3863 条无 %2F。
- **待办**：GSC 重新提交 sitemap/验证修正（1~3 周收敛）；后台改名 8 个问题 SKU（唯一根治）；64 条「重复网页」需 GSC 导出示例 URL 才能逐条定性。详见 `STATE.md` 同名小节。

主文档：[`STATE.md`](STATE.md)

---
> 索引生成：2026-10-27 ｜ 文件数/结构来自目录扫描 ｜ 状态以主文档为准；入口或结构变化后请同步本页。
