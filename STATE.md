# Elevator Equipment Wholesale — 项目状态快照

> 最后更新: 2026-05-18 20:17 CST · 会话数: 2

---

## 0. ⚠️ 现状校正（2026-10-27 实测，优先于下文所有内容）

**本文档第 1～10 节是 2026-05-18 写的，技术栈与部署方式已全部更换。** 以下为实测现状：

| 项 | 文档旧写法（过时） | 实际现状（2026-10-27 核实） |
|:--|:--|:--|
| 部署 | Vercel（GitHub 自动部署） | **Hostinger 共享主机**（push 到 GitHub → hPanel 自动拉取构建） |
| 数据库 | Supabase PostgreSQL | **Hostinger MySQL**（`u899509956_elevator_db`，prisma provider = mysql） |
| 域名 | xxx.vercel.app | **quickeaseliftparts.com**（Namesilo 注册） |
| 邮件 | Resend | **nodemailer + Hostinger SMTP**（smtp.hostinger.com:465） |
| 限流 | Upstash Redis | 内存限流（未接 Redis）；`/api/contact` 2026-10-27 起有进程内限流 |
| 文件存储 | Cloudflare R2 | 本地 `public/uploads/`（6568 个 SKU 目录） |
| 地域限制 | 无 | **CN IP 屏蔽**（`src/middleware.ts`，fail-open，仅明确判定 CN 才拦） |
| 产品数 | 12（种子） | **3803**（其中 2474 个从 lift-spares 竞品导入） |
| 登录 | NextAuth + Prisma Adapter | 后台是**独立口令登录**（`/api/admin/login`），2026-10-27 起为 HMAC 签名 token + 环境变量口令（详见下方「后台认证已加固」） |

代码活的最后一个提交（截至 2026-10-27）：`f2360d9`（2026-08-18，产品图 lightbox）。
2026-09-21 只动过协作文档机制，没动代码。

### 🚨 2026-11-10 Google Search Console 批量报「无法编入索引」（已修，待部署）

**现象**：GSC 邮件 `[WNC-20237597]` 报两个新原因：
1. **备用网页（有适当的规范标记）** — Alternate page with proper canonical tag
2. **网页会自动重定向** — Page with redirect

**根因（已在线上实测确认，非推测）**：

| 问题 | 位置 | 说明 |
|:--|:--|:--|
| ① canonical 泄漏到全站 | `src/app/layout.tsx` | 2026-10-27 的 `f8dfd4a`（"SEO fixes"）在根布局加了 `alternates: { canonical: "/" }`。Next 的 metadata 向下继承，于是所有没自己声明 canonical 的页面都输出 `canonical = 首页`。实测 `/products`、`/categories/elevator-door-parts`、`/brands/otis`、`/knowledge`、`/about`、`/contact` 全部 `canonical=https://quickeaseliftparts.com`。分类页是商业词落地页，等于主动申请"别收录我"。 |
| ② `/categories` 进了 sitemap | `src/app/sitemap.ts` | 该路由自 `cee5963`（2026-06-30）起就是 `redirect("/products")` 跳转壳，`f8dfd4a` 又把它加回 sitemap（priority 0.8）→ Google 抓一条报一条"网页会自动重定向"。 |
| ③ sitemap 含 3 个不存在的路由 | `src/app/sitemap.ts` | `/quotation`、`/login`、`/register` 在 `src/app` 下没有对应目录，抓取即 404。这三个是照抄本文档第 3 节过时的路由表加进去的——**该表已一并更正**。 |
| ④ 分类/品牌/联系页没有自己的 title | 各 `page.tsx` | 无 metadata，标题回落到站点默认标题（"Elevator Parts Supplier in China | XI'AN..."），落地页在 SERP 里毫无区分度。 |
| ⑤ 产品 SKU 有 7 个含空格 | 数据库数据 | sitemap 原先直接拼 `product.sku`，产生 7 条非法 URL（如 `/products/QE-K-KM611085H01 `）。**线上实测：这 7 个产品的详情页本来就 404**（见下方「7 个不可达 SKU」）。 |

**为什么报成「新原因」**：`f8dfd4a` 同时做了两件事——加 `canonical: "/"` **和** 把分类/品牌/知识库页首次提交进 sitemap。Google 之前几乎没抓这批页，这次批量抓取，一抓就同时命中①②，于是 GSC 立刻报"新原因"。时间线与 2026-11-09 的线上构建（buildId `Wz1qeRHzSdIVoAz2i5dy8`）吻合。

**本轮改动**：

- `layout.tsx`：删除 `alternates.canonical: "/"`，并留下注释禁止再加回来。
- `sitemap.ts`：移除 `/categories`、`/quotation`、`/login`、`/register`；产品 URL 用 `encodeURIComponent` 编码，并**跳过 7 个含空白字符、线上 404 的 SKU**（见「7 个不可达 SKU」）。
- 各路由补自指 canonical（+ 补 title/description）：`products`、`categories/[slug]`、`brands`、`brands/[slug]`、`knowledge`、`knowledge/[id]`、`about`、`contact`（新增 `contact/layout.tsx`，因为其 page 是 client 组件）。
- `categories/[slug]`、`brands/[slug]` 的 canonical 忽略 `?brand=` / `?category=` 过滤参数，所有筛选视图归一到分类/品牌根 URL。
- `products/[sku]`：URL 的 SKU 与数据库规范写法不一致时 `permanentRedirect`（308）到规范地址；canonical/JSON-LD 统一走 `encodeURIComponent`。
- `brands` 页：把指向 `/products?brand=xxx`（**该参数根本没被 `products` 页处理，等于死链**）的链接改为 `/brands/[slug]`；中文文案改英文（`品牌列表` → `Elevator Parts by Brand` 等）。
- `search`：`metadata.robots.index = false`；同时从 `robots.ts` 的 disallow 里移除 `/search`（disallow 会让 Googlebot 看不到 noindex，已收录的搜索页删不掉）。
- 首页：canonical 改为显式声明在 `src/app/page.tsx`（`/`），不再靠根布局兜底——根布局兜底正是这次的病根。
- 新增回归测试 `src/app/__tests__/seo-metadata.test.ts`（10 条），锁住：根布局不得再出现 `alternates.canonical`、每个公开路由自指、`/search` noindex、sitemap 不含跳转壳/404/含空白 SKU。

**本地验证（2026-11-10，诚实标注）**：

| 项 | 结果 |
|:--|:--|
| `npx tsc --noEmit` | ✅ 无错误 |
| `node scripts/build-next.mjs` | ✅ 成功，BUILD_ID `iZF_8Od1TeUFbZUwxUqiw`（脚本真实退出码 0，全文改动后重建） |
| `vitest run seo-metadata` | ✅ 10/10 |
| 本地 `next start` 实测 `/about` | ✅ `canonical=https://quickeaseliftparts.com/about`（不再是首页） |
| 本地实测 `/search` | ✅ `robots: noindex, follow`，无 canonical |
| 本地实测 `/robots.txt` | ✅ 只剩 `Disallow: /api/`、`/admin/` |
| 本地实测 `/sitemap.xml` | ✅ 只剩 6 条静态 URL（本地 `.env` 是占位 `localhost` 库，产品/分类/品牌/知识库查询失败被 try-catch 吞掉，所以列表为空——**这不是回归**，线上有库会照常输出） |
| **未验证**：产品/分类/品牌页真实渲染 | ⚠️ 本地连不上数据库（真库在 Hostinger），这三类页面的 canonical 只经单测（mock prisma）验证，需部署后在线上复验 |

**遗留（与本次无关，未动）**：`src/app/__tests__/homepage.test.tsx` 有 6 条**既有失败**——Header 用例没套 `SiteConfigProvider`，Footer 用例还在找旧域名 `@quickeasylift`。`pnpm test` 因此是红的。

**线上验证（2026-11-10 两次部署后实测：`ipjyxrApB494f9fSjkozt` → `zgyf55djZzDXcW9Q2a5yi`）**：

> 注：Hostinger 每次 push 都会重建，纯文档提交也会让 buildId 再变一次。
> 记这里的 buildId 只用于说明「验证时跑的是哪一版」，实际以 `/api/health` 返回值为准。

| 页面 | 结果 |
|:--|:--|
| `/about` | ✅ `canonical=https://quickeaseliftparts.com/about` |
| `/categories/elevator-door-parts` | ✅ 自指 + 标题变成 `Elevator Door Parts — Elevator & Escalator Parts`（原先标题是站点默认） |
| `/brands` | ✅ 自指 + `Elevator Parts by Brand`（原中文 `品牌列表`） |
| `/brands/otis` | ✅ 自指 + `Otis Elevator Parts` |
| `/products` | ✅ 自指 |
| `/search` | ✅ `robots: noindex, follow`，无 canonical |
| `/robots.txt` | ✅ 不再 disallow `/search` |
| `/sitemap.xml` | ✅ 最终 **3864** 条（3875 → 去掉 4 条脏路由 → 3871 → 再剔除 7 个 404 SKU → 3864），其中产品 3794 条；`%20` 0 条、含空白 0 条、无 `/categories`、无 `/quotation` `/login` `/register` |
| 产品/分类/品牌页（最终构建复验） | ✅ `/products/KM964619G24`、`/categories/escalator-handrail`、`/brands/kone`、`/knowledge`、`/` 全部自指 canonical |
| `/categories` | ✅ 仍 307 → `/products`（行为不变，只是不再进 sitemap、站内也无链接指向它） |

**7 个不可达 SKU（既有问题，非本次引入）**：

```
Thyssen 3800700010          Schindler 50659077
ELELATOR DRIVE GBA21310JC1  QE-BUTTON-KONE   KM863050G069H092
QE-K-KM611085H01␠           QE-K-␠KM470560G01
QE-O-HAA180DA2␠             （␠ = 尾随空格）
```

线上实测：`%20` 编码、裸空格、尾随空格、NBSP（`%C2%A0`）、全角空格（`%E3%80%80`）、窄空格（`%E2%80%AF`）**全部 404**；连"去掉空格"的写法也 404。站内搜索能查到这些产品（`sku` 字段带空格确实存在），但点进去就是 404 —— 等于 7 个产品页从未可访问。故其 canonical/索引问题无从谈起，本轮先把它们从 sitemap 移除，避免继续喂 Google 404。

> 另注：实测 `/products/km964619g24`（小写）也是 404，说明该库 SKU 比较**区分大小写**。
> 所以最初担心的「大小写变体造成重复内容」并不成立；`products/[sku]` 里的 308 归一只作为防御性兜底保留。

**遗留（与本次无关，未动）**：`src/app/__tests__/homepage.test.tsx` 有 6 条**既有失败**——Header 用例没套 `SiteConfigProvider`，Footer 用例还在找旧域名 `@quickeasylift`。`pnpm test` 因此是红的。

**部署后待办**：
1. 重新提交 `sitemap.xml`，GSC 对「网页会自动重定向」点「验证修正」。
2. 挑 3 个分类页 + 1 个品牌页点「请求编入索引」。
3. **数据清理（P3，最划算的一步）**：后台把这 7 个 SKU 改成 URL 安全写法（空格改 `-` 或删掉），改完它们自动回到 sitemap 并可被索引。这是唯一能让这 7 个产品页真正可访问的办法。
4. www 子域目前**不跳转**（实测 `https://www.quickeaseliftparts.com` 直接 200），整站 www 版本天然成为"备用网页"。建议在 hPanel 加 www → 非 www 的 301。

### ✅ 后台认证已加固（2026-10-27 15:32 修复，上一版此处是「待处理」）

**修的两个问题（原状态已作废）：**

| 问题 | 原实现 | 现实现 |
|:--|:--|:--|
| **token 可伪造**（最严重） | `token = base64("admin:<时间戳>")`，校验只做 `startsWith("admin:")` —— 无签名/无密钥/无有效期。任何人自己编一个 cookie，其内容为 base64 编码的 `admin:x`，即可通过全部 admin 接口（2026-10-27 线上实测：返回完整产品数据） | `src/lib/admin-auth.ts`：HMAC-SHA256 签名 + 12h 有效期 + `timingSafeEqual` 定长比对 + 拒绝未来时间戳（>1min） |
| 口令明文在 public 仓库 | `ADMIN_PASS = "..."` 写死在 `login/route.ts`，自 2026-07-11 提交 `537bec9` 起暴露 | 只从环境变量 `ADMIN_PASSWORD` 读；**未配置时 fail-closed**（登录返回 503，不认任何凭证） |

**改动范围：** 新增 `src/lib/admin-auth.ts`；`login/route.ts` 改为签发签名 token；7 个受保护接口
（`products` / `brands` / `brands/merge` / `knowledge` / `site-config` / `upload` / `visits`）统一改用
`checkAdminAuth()`，旧的 `startsWith("admin:")` 校验已无残留。

**密钥派生：** `ADMIN_SECRET` 优先，未设则用 `ADMIN_PASSWORD` —— 即**改口令自动吊销所有旧会话**。

**部署前提（顺序不能反）：** 新代码是 fail-closed，服务器环境变量里必须先有 `ADMIN_PASSWORD`，
再推送代码。否则后台直接锁死（登录 503）。响哥已于 2026-10-27 在 Hostinger 面板添加。

**仍未做：** `/api/admin/login` 无登录失败限流 —— 密码改为环境变量后，暴力猜测成为唯一攻击面。
建议后续加（同 IP 10 次/10 分钟锁）。

### 🚀 部署记录：两次构建失败后上线成功（2026-10-27 晚）

| 轮次 | 结果 | 原因 / 处理 |
|:--|:--|:--|
| 第 1 次 | ❌ 失败 | `compiled successfully` 之后，在 **Generating static pages** 阶段 build worker 起线程被 OS 拒绝：`Resource temporarily unavailable (os error 11)` → SIGABRT。**本地永远复现不出来**（本机资源充足） |
| 修复 | — | `next.config.mjs` 的 `experimental` 加 `cpus: 1` + `workerThreads: false` —— 静态生成串行化，不 fork 多 worker。本地验证 build 通过（299s，原 188s）。提交 `9eeebd8` |
| 第 2 次 | ✅ 成功 | 新代码上线 |

> 那个 `6ae0a8d753b48.next.config.mjs` 是 Hostinger 构建容器自己的残留，本地项目里不存在，
> Next 也不会读带前缀的配置名 —— 不是失败原因，无需处理。

**上线后实测（curl 直连线上；`middleware.ts` 第 146 行对 `/admin` 与 `/api/admin` 放行，
所以后台接口不受 CN IP 屏蔽影响，可在国内直连验证）：**

| 验证项 | 结果 |
|:--|:--|
| 新口令登录 | **200** `{"ok":true}` |
| 旧口令 `zctss833423` | **401**（已失效） |
| 伪造 cookie（内容为 base64 编码的 `admin:x`）打 products / brands / knowledge / visits / brands-merge | **全部 401** ← 原漏洞已堵死 |
| 同一伪造 cookie 打 `site-config` | GET 返回 200 —— **这是设计如此**（该 GET 注释写明「公开，供前端展示」）；**PUT 返回 401**；线上该表当前为空（`{"ok":true,"config":{}}`），无信息泄露 |
| 真实登录 token 打 `/api/admin/products` | 200（功能未被一刀切砍死） |
| token 格式 | `payload.signature`，70 字节，确认为新签名格式 |
| `/admin/messages`（本批新做的询盘列表） | **200**，41 KB，页面含「询盘」「总计」 |

**结论：** 询盘列表、contact 防静默、SEO 硬伤、GA/GSC 框架、后台认证加固 —— 全部已上线。
真机浏览器点一遍仍待响哥（以上是 HTTP 层验证，不等于肉眼验过）。

---

## 🔍 2026-10-28 排查：「部署失败」的真相 + 构建护栏

**现象：** hPanel 里看到红字 `ERROR: Failed to build the application` / `Build failed after 1m 29s`。

**真相：那是 `b599c69`（10-27 第 1 次）的旧记录，不是最新部署。** 10-28 早实测线上（国内直连）：

| 验证项 | 结果 | 说明 |
|:--|:--|:--|
| `/admin/messages` | 200 / 42 KB | 上一批新做的询盘页在线 |
| 错口令 POST `/api/admin/login` | **401**（不是 503） | `ADMIN_PASSWORD` 已配，后台没被 fail-closed 锁死 |
| `/admin/login` 响应头 CSP | 含 `googletagmanager` | 线上是 10-27 之后的构建，不是旧版 |
| 无 token GET `/api/admin/products` | 401 | 加固后的鉴权在工作 |
| 本地 git | `main` = `origin/main` = `4d8e8ae` | 没有未推的提交 |

**另一个容易误判的点：** 国内直接打开 `quickeaseliftparts.com` 会看到 `403 Access Restricted` ——
这是**站点自己的 CN 屏蔽页**（`src/middleware.ts:126-137`），不是故障；
`/admin` 与 `/api/admin` 在 `middleware.ts:146` 已放行，所以后台在国内能直连。
（副作用：响哥自己打不开公开页做目测，这条以后还会反复踩——要么用海外网络，要么加个临时 IP 白名单。）

**但构建脆弱性是真的，10-27 的修法不完整：**
`experimental.cpus: 1` 只压住 **Next 进程**的并行度；panic 栈里的
`tokio/runtime/multi_thread/worker.rs` 表明 **worker 内部的 Rust 线程池仍按容器 CPU 数开线程**，
libuv 线程池同理。容器 CPU 数一变、或同时有别的任务占线程额度，单个 worker 也会撞上限而 SIGABRT。

**本次加固：**

- 新增 `scripts/build-next.mjs`：
  - 把 `TOKIO_WORKER_THREADS=1`、`RAYON_NUM_THREADS=1`、`UV_THREADPOOL_SIZE=1` 钉死
    （Next 的 `forkOptions.env` 会透传 `process.env`，见 `next/dist/build/index.js:309-318`，worker 子进程同样受限）
  - 失败后自动重试（默认 3 次、间隔 15s）；EAGAIN 属瞬时资源争用，重试通常能过；
    真正的代码错误重试照样失败，退出码原样传给 npm，不会掩盖问题
  - 不删 `.next`：`next build` 自己清理，删了只会让重试变慢
- `package.json`：`build` → `prisma generate && node scripts/build-next.mjs`；
  保留 `build:plain`（原生 `next build`）供对照
- 本地验证：`npm run build` 通过，**1 次成功 / 111s / 24-24 静态页 / 日志无告警**；
  重试逻辑用假 next CLI 验过 3 种情况（永远失败→退出 1、第 2 次成功→退出 0、一次成功→退出 0）

**部署后怎么确认新脚本生效：** hPanel 构建日志开头应出现 `[build-next] node v... · next CLI: ...` 等三行。

**✅ 已验证（2026-10-28 14:56 CST，`4f38ff6` 推送后）：** Hostinger 这次构建**成功并已发布**，
`/api/health` 返回
`{"buildId":"697H1atryUmN-XRp-sK3W","startedAt":"2026-10-28T06:56:27Z","uptimeSec":1,"node":"22.23.4"}`。
同一个 buildId 可作后续部署的比对基线。上线后回归：`/admin/messages` 200(42KB)、`/admin` 200、
`/admin/visits` 200、错口令登录 401、无 token 打 `/api/admin/products` 401、CSP 含 `googletagmanager`、
首页仍 403（CN 屏蔽照常）。

**⚠️ 由此确认的新事实：运行时 Node 也是 22.23.4**，不是只有构建容器是 22。
`geoip-lite@2.0.3` 声明 `engines.node >= 24`，所以生产环境长期在"超范围"运行。
`src/lib/visit-log.ts:47-56` 对 `geoip.lookup()` 做了 try/catch 返回 null，
**失效时不会报错，只会让访问统计的 country 静默变空**——不可见，需要单独验（见遗留风险 2）。

**新增部署探针 `/api/health`（本次）：** 返回 `buildId` / `startedAt` / `uptimeSec` / `node`，无敏感信息，
已在 `middleware.ts` 对 CN 屏蔽放行。判断方法：
- **404** → 本次构建没成功（或还没发布），线上仍是旧版
- **buildId 变了** → 新构建已发布（Hostinger 每次构建重写 `.next/BUILD_ID`）
- **startedAt 变了** → 应用进程重启过

以后不必再靠 hPanel 日志猜部署结果。它同时能看出运行时 Node 版本（见遗留风险 2）。

**遗留风险（未处理，按优先级）：**

1. **依赖不可复现**：Hostinger 用 npm 装（日志 `Package manager: npm`），但仓库只有 `pnpm-lock.yaml`，
   没有 `package-lock.json` → 每次构建按 `^` 范围重新解析，某天拉到坏版本就会莫名构建失败。
2. **`geoip-lite@2.0.3` 要求 Node ≥ 24，而线上运行时就是 Node 22.23.4**（`/api/health` 实测）。
   lib 里没扫到 Node 24 专有 API，但它自带 `.node` 数据文件与 `engines` 声明都在提示"未验证组合"；
   `visit-log.ts` 吞掉了异常，所以**只能靠数据反查**：看 `/admin/visits` 的国家分布是否长期全空。
   若全空，要么升运行时到 24，要么把 geoip-lite 降到 1.4.x。
3. **登录冷启动慢**：错口令登录首包 12.6s，疑似共享主机休眠唤醒；不影响功能，但体验差。

---

## 2026-10-29 内容：知识库 4 → 20 篇（16 篇新增 + 4 篇旧稿重写，**已上线**）

**背景**：询盘量偏低，知识库原本只有 4 篇从竞品扒来的机翻稿（110–200 词、`•` 变「路」、标题 handrail 拼成 handraill），
长尾搜索基本没有入口。本次按「故障诊断 + 替换选型」的采购意图写了 16 篇原创稿（901–1053 词），
纯文本正文（对齐 `whitespace-pre-line` 渲染）。

**发布结果（2026-10-29 16:3x / 17:0x 两批，走 `/api/admin/knowledge`，未改代码、未触发构建）**：

| 项 | 结果 |
|:--|:--|
| 新增 | **16 篇**（第一批 12 + 第二批 4），全部 `200 {"ok":true}`，id 见 `content/knowledge/00-index.md` |
| 重写旧稿 | 4 篇用 `PUT` 按原 id 覆盖；标题/摘要/正文换新，`url` 与 `images` 保留；610–714 词 |
| 知识库总数 | **20** |
| 页面验证 | 逐篇回读词数与源文件一致；抽查 8 篇公开页 200、H1 正确、段落空行保留、无 markdown、无 em dash、无乱码 |
| 列表页 | 新文按 `date` 倒序排在前面；旧 4 篇标题已改为正常英文 |
| sitemap | `src/app/sitemap.ts` 是 `revalidate = 0` 实时生成，已自动收录 20 条 `/knowledge/*`，**不需要重新构建** |

**第二批选题**：门锁/门刀啮合（7 mm）、限速器与安全钳联动试验、无机房钢带、称重与超载开关。

### 封面图（同日 18:2x–19:0x，16 张全挂上）

用火山方舟 `doubao-seedream-5-0-pro-260628` 生成 16 张 `2560×1440` 封面，`watermark: false`。
出图走 `/api/admin/upload`（接口固定压站点 logo 150 px，响哥确认可接受），再 `PUT` 写回 `images`，未发版。
风格选定**纪实工业现场**而非示意图：列表页缩略图只有 400×225，示意图标注在此时不可读；且 B2B 配件站用实拍更可信。
`15-mrl-belt`（原图画成钢带露钢丝）与 `16-load-weighing`（原图画成拉杆支架）已按"场景照"重出。

**踩坑记录（下次直接用）**：

1. **后台口令末尾有个「.」**（`Zctss833423.`），漏掉就是 401 且没有任何提示。口令以 hPanel 的 `ADMIN_PASSWORD` 为准。
2. 本机 IPv6 到站点 TLS 会卡 30 s 后被重置 → curl 必须 `-4`；`/admin`、`/api/admin` 本来就不受 CN 屏蔽。
3. 公开页从国内是 403（站点自己的 CN 拦截），要读渲染结果得走本机代理 `-x http://127.0.0.1:7897`。
4. Hostinger 链路偶发 TLS 握手失败/中途断流，批量写入要带重试（本次每篇最多 4 次，代理 2 次 + 直连 2 次）。
5. **`Get-Content`/`Set-Content` 处理中文文件会按 GBK 解码再按 UTF-8 写回，直接毁文件**（本次把 STATE.md 写坏过一次，
   已用 `git checkout --` 还原后改用编辑工具重写）。涉中文的文档改动一律走编辑工具，不要用 PowerShell 读改写。
6. **后台列表接口 `GET /api/admin/knowledge?limit=100` 的响应会在 ~5.6 KB 处被截断**（返回 20 条时必现），
   拿它当"标题字典"会让后续 `PUT` 全部 400、上传的图白传。批量改文章时标题从本地文件取，别依赖这个接口。
7. 方舟图片模型：`doubao-seedream-5-0-pro-260628` 是唯一被识别的 ID，未开通时报 `ModelNotOpen`（不是 404）；
   4.0 / 4.5 / 5.0-flash / 3.0-t2i 在该账号下全部 `InvalidEndpointOrModel.NotFound`。
8. `covers/generate.ps1` 的 `-Only N` 参数切片写错（`$items[$Only-1..($Only-1)]` 在 PowerShell 里解析歧义），
   单出某张请删对应 jpg 后全量跑，靠"已存在跳过"来节省调用。

**产物位置**：`content/knowledge/`（`00-index.md` 清单 / `01`–`16` 新稿 / `rewrite/` 四篇重写稿 /
`covers/` 提示词、出图与上传脚本、16 张原图）。`prisma/` 未动。

**写作口径**：按 GitHub 的 [ai-slop-detector](https://github.com/FeedHive/ai-slop-detector)
与 [humanize-ai-writing](https://github.com/haidrrrry/humanize-ai-writing) 两份清单去 AI 味 —— 禁词表、
禁句式、禁 `In conclusion` 收尾、0 破折号、句子长度不齐、每个论点带数字或步骤。自检脚本：20 篇全部 0 命中、0 em dash。

**待办**：

1. ~~16 篇新稿封面图空~~ 已完成（16 张，见上），旧 4 篇保留原封面。
2. 正文纯文本，文内没有指向产品/分类的内链（页面不解析 HTML/Markdown），SEO 上少了内链权重传递 —— 要做需改渲染（加 markdown 或 related 区块），属代码改动。
3. 文章 URL 是 cuid（`/knowledge/cmvtacr1z…`），不可读；加 `slug` 字段更利于分享与搜索，属代码改动。
4. 文中行业数值（150 N / 10 J、绳径 10%、安全系数 12/16、梯级链 1.5%、门锁 7 mm、超载 110%）按通行做法写，建议一线维保师傅过一眼。
5. 下一批候选 4 个：缓冲器与底坑、扶梯梳齿板/梯级缺失监测、接触器与继电器老化、随行电缆断芯定位。

---

## 2026-10-27 本轮改动（询盘转化专项 · 第一批）

起因：询盘量偏低，做漏斗三层排查（流量 → 转化 → 接住）。本批落地的是「接住」+「装眼睛」+「SEO 硬伤」。

### 1. 后台能看到询盘了（原先只能靠邮件）

- 新增 `src/app/admin/messages/page.tsx` —— 询盘列表：统计卡（总计/近7天/近30天/产品询价数）、
  30 条一页倒序、产品询价解析出 SKU 并可跳产品页、一键「回复邮件」/「用 WhatsApp 跟进」、
  顶部显示 SMTP 是否配置（未配则红字警告"必须人工巡查"）
- `src/app/admin/layout.tsx` 侧边栏加「📨 询盘消息」（第二位）
- `src/app/admin/page.tsx` 概览页加「询盘·最近7天」卡片 + 「最近询盘」5 条列表
- ⚠️ 为什么重要：`ContactMessage` 表原先**只有写入没有读取**（全项目唯一引用是 api/contact），
  而邮件通知是 best-effort，SMTP 一挂询盘就无人知晓

### 2. `/api/contact` 不再静默失败

- 邮件失败：改打 `[CONTACT-EMAIL-FAILED]` 前缀 + 完整询盘内容 + Message ID 到服务器日志（可人工捞回）
- 邮件加 `replyTo` = 客户邮箱（点回复直接回到客户）
- 邮件正文带后台路径提示 `/admin/messages`
- 新增：邮箱格式校验、长度上限、**进程内限流**（同 IP 10 分钟 5 条，超限 429）
- 响应新增 `emailed: boolean`（供排查；客户侧文案不变）

### 3. SEO 硬伤修复

- `src/app/layout.tsx`：`<html lang="zh-CN">` → **`lang="en"`**（英文站标成中文，最严重的信号错误）
- 根 metadata `description` / `keywords` 由中文改英文；补 `metadataBase` / canonical / openGraph / twitter
- `src/app/sitemap.ts`：补上原先漏掉的 **分类页、品牌页、知识库文章页、about、contact**
- `src/app/robots.ts`：`disallow` 增加 `/search`（站内结果页重复内容）
- 首页加 `Organization` 结构化数据；产品页加 `Product` + `BreadcrumbList` 结构化数据
  （Product 的 offers 仅在数据库有 price 时输出，避免 Google 报"缺 price"警告）

### 4. 流量分析接好了（等 ID）

- `layout.tsx` 支持 `GA_ID` 与 `GSC_VERIFICATION` 两个环境变量，未配置则不渲染任何第三方脚本
- ⚠️ **故意不用 `NEXT_PUBLIC_` 前缀**：那种变量构建时内联进 bundle，而 Hostinger 面板是运行时注入
  → 用服务端变量 + SSR 输出，面板填完重启应用即生效，**不需要重新 build**
- `next.config.mjs` 的 CSP 已放行 `googletagmanager`（脚本）与 `google-analytics`（上报）
- `.env.example` 重写：删掉 Supabase/Resend/R2/Upstash 等废弃项，补 GA_ID / GSC_VERIFICATION / ADMIN_PASSWORD

### 验证状态（诚实标注）

- ✅ `npx tsc --noEmit` 零错误
- ✅ `pnpm build` 成功，`.next/server/app/admin/messages/page.js` 产物存在
- ❌ **未在真机点过**：本地 `.env` 指向 `localhost:3306`，本机没有那个 MySQL，
  连不上线上库 → 页面渲染与询盘写入**尚未在真实环境验证**。上线后需实测。

### 下一批（未做）

转化层：表单失败提示（`ProductInquiryForm.tsx:34`、`contact/page.tsx:26` 目前失败无任何提示）、
询价表单加 Qty/Company 字段、客户自动回复邮件、首页四条"为什么选我们"换成带数字的承诺、
Footer 补公司全名/详细地址/认证/内链、产品页 MOQ 与起订量锚点。

---

## 1. 项目概览

电梯零件 B2B 电商网站。技术栈：Next.js 14 + TypeScript + Tailwind + shadcn/ui + Prisma + Supabase + NextAuth v5 + Zustand。

| 项 | 值 |
|----|-----|
| 仓库 | `github.com/xiaoqiplus/elevator-equipment-wholesale` |
| 生产域名 | `https://elevator-equipment-wholesale.vercel.app` |
| 数据库 | Supabase PostgreSQL (`aws-1-ap-south-1.pooler.supabase.com`) |
| 部署 | Vercel（GitHub 自动部署，main 分支） |
| 包管理 | pnpm（锁文件: pnpm-lock.yaml） |
| Git 推送 | 代理 7897 / 直连（sslVerify=false） |
| 当前 commit | `f5d53d1` |

## 2. 开发环境

| 项 | 值 |
|----|-----|
| 工作目录 | `C:\Users\23236\.openclaw\workspace\elevator-equipment-wholesale` |
| Node | v24.15.0 |
| pnpm | v11.1.2 |
| Next.js | 14.2.35 |
| Prisma | 5.22.0 |
| React | 18.3.1 |

## 3. 路由清单（2026-11-10 按 `src/app` 实际目录重新生成）

> 上一版这张表是 2026-05-18 写的，`/quotation`、`/login`、`/register`、`/account` 早已不存在。
> 2026-10-27 的 sitemap 就是照抄这张表把 3 个 404 路由提交给了 Google —— **改路由务必同步本表**。

### 页面

| 路由 | 类型 | 状态 | canonical |
|------|------|------|:--|
| `/` | Dynamic | ✅ 首页（含分类卡片） | `/`（根布局不再声明，首页自身即规范） |
| `/products` | Dynamic | ✅ 产品列表（分类/品牌视图、`?q=` 搜索） | `/products`（忽略 query） |
| `/products/[sku]` | Dynamic | ✅ 产品详情 | 自指；大小写不一致时 308 归一 |
| `/categories` | Dynamic | ✅ **跳转壳** `redirect("/products")`，已从 sitemap 移除 | — |
| `/categories/[slug]` | Dynamic | ✅ 分类产品列表（商业词落地页） | 自指，忽略 `?brand=` |
| `/brands` | Dynamic | ✅ 全部品牌（列表） | `/brands` |
| `/brands/[slug]` | Dynamic | ✅ 品牌产品列表 | 自指，忽略 `?category=` |
| `/knowledge` | Dynamic | ✅ 知识库列表（20 篇） | `/knowledge` |
| `/knowledge/[id]` | Dynamic | ✅ 知识库文章 | 自指 |
| `/about` | Dynamic | ✅ 关于我们 | `/about` |
| `/contact` | Dynamic | ✅ 联系我们（client 组件，metadata 在 `contact/layout.tsx`） | `/contact` |
| `/search` | Dynamic | ✅ 站内搜索 | **noindex**（不参与收录） |
| `/admin`、`/admin/{products,products/new,products/[sku]/edit,brands,knowledge,knowledge/new,knowledge/[id]/edit,messages,settings,uploads,visits,about,login}` | Dynamic | ✅ 管理后台（独立口令登录） | 无可索引价值 |
| `/robots.txt` | Dynamic | ✅ 已移除 `/search` 的 disallow | — |
| `/sitemap.xml` | Dynamic | ✅ 只含 200 直出的真实 URL；产品 URL 已 URL 编码 | — |

### API 路由（15 条，同样按实际目录核过）

`/api/admin/{login,logout,products,brands,brands/merge,categories-brands,knowledge,site-config,upload,visits}`、
`/api/contact`、`/api/health`、`/api/db-check`、`/api/smtp-test`、`/api/fix-knowledge-img`。

> 注意：`/api/products`、`/api/quotations`、`/api/auth/*` 这些旧表里的条目**已不存在**。

## 4. 数据模型

```prisma
User: id, email, name, companyName, phone, passwordHash?, role(ADMIN/CUSTOMER), isApproved, createdAt, updatedAt
Product: id, sku(unique), name, description?, price?, categoryId?, brandId?, images[], specs(JSON), createdAt, updatedAt
Category: id, name, slug(unique), parentId?, products[], children[]
Brand: id, name, slug(unique), logoUrl?, products[]
Document: id, productId, type(DRAWING/MANUAL/CERTIFICATE), name, fileUrl
QuotationRequest: id, userId, status(PENDING/RESPONDED/CONVERTED_TO_ORDER), items(JSON), adminNotes?, createdAt, updatedAt
Favorite: userId+productId (复合主键)
```

种子数据: 12 产品 + 1 管理员（admin@example.com）+ 4 分类 + 4 品牌

## 5. 核心安全措施

| 措施 | 位置 | 状态 |
|------|------|------|
| 价格保护 | `api/products` / `api/quotations` | ✅ 仅已认证+已审批用户可见 |
| 报价价格覆盖 | `api/quotations` POST | ✅ 客户端 price/name 完全忽略，从 DB 重取 |
| 认证中间件 | `lib/auth/auth.ts` | ✅ NextAuth JWT + Prisma Adapter |
| CSRF 保护 | `lib/auth/csrf.ts` | ✅ 3 个 admin 写 API |
| CSP 头 | `next.config.mjs` | ✅ default-src 'self' + unsafe-inline |
| 安全响应头 | `next.config.mjs` | ✅ X-Frame/XSS/nosniff/Referrer-Policy/Permissions |
| 速率限制 | `lib/rate-limit` | ✅ 登录/注册（Upstash Redis） |
| 密码哈希 | `lib/auth/password.ts` | ✅ bcryptjs |

## 6. 关键架构决策

### API 鉴权方式
- **Admin 写 API** 使用 `auth()` from `@/lib/auth/auth`（直接导入，支持 Vercel 生产环境）
- **早期代码** 使用 `getSessionFromRequest`（动态 import next-auth，仅测试环境可用，生产返回 401）
- ⚠️ `getSessionFromRequest` 存在于 `lib/auth/utils.ts` 但**仅在测试中使用**，生产 API 已全部改用 `auth()`
- Admin API 全部添加 `export const dynamic = "force-dynamic"`

### 服务器组件
- 产品列表/详情/分类/品牌页面使用 Prisma 直连接口，**不通过 fetch 调用自身 API**（Vercel 无服务器环境中 localhost:3000 不可达）

### 测试
- 使用 prismock（内存数据库），无需真实 PostgreSQL
- 当前: 246 passed / 11 failed（9 个 products page + 2 个 AlertDialog，均为预存问题）

## 7. 环境变量

Vercel 环境变量（已配置）:
```
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=<已生成>
NEXTAUTH_URL=https://elevator-equipment-wholesale.vercel.app
ADMIN_EMAIL=admin@example.com
```

未配置的服务（不影响核心功能）:
- RESEND_API_KEY（报价邮件通知）
- R2_*（Cloudflare 文件上传）
- UPSTASH_REDIS_*（速率限制，本地 fallback 到内存）

## 8. 已知问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| Next.js 14 漏洞 | 高 | 15 个 CVE，全部需升级到 Next.js 15.5.16+（已记录，暂不处理） |
| AlertDialog 测试失败 | 低 | 2 个测试，radix-ui AlertDialog 与 jsdom 的兼容问题 |
| Products page 测试 | 中 | 9 个失败，涉及 mock 时序和 data-testid 查找 |
| approve route 测试 | 低 | 0 个测试，未实现 |
| 本地构建 Prisma 连接 | 低 | `/`、`/categories`、`/brands` 预渲染时连不上 Supabase（Vercel 正常） |
| postcss 8.4.31 漏洞 | 中 | next 内置依赖，pnpm overrides 无效 |

## 9. 未完成/可继续的任务

| 优先级 | 任务 |
|--------|------|
| P1 | 修复 11 个失败测试 |
| P1 | 收藏夹后端 API + 前端交互（目前是占位符） |
| P2 | Resend 邮件服务配置 |
| P2 | Cloudflare R2 文件上传 |
| P2 | Upstash Redis 速率限制配置 |
| P2 | PDF 报价单自动生成 |
| P2 | 部件识别询价（WhatsApp + 上传表单） |
| P3 | 修复 approve route 测试 |
| P3 | Next.js 15 升级（修复所有安全漏洞） |
| P3 | 首页分类卡片改为动态数据库查询 |

## 10. 关键文件索引

| 用途 | 路径 |
|------|------|
| 项目书 | `PROJECT_BOOK.md` |
| Next.js 配置 | `next.config.mjs` |
| Vercel 配置 | `vercel.json` |
| Prisma Schema | `prisma/schema.prisma` |
| 种子数据 | `prisma/seed.ts` |
| NextAuth 配置 | `src/lib/auth/auth.ts` |
| CSRF 工具 | `src/lib/auth/csrf.ts` |
| 鉴权工具（旧） | `src/lib/auth/utils.ts` |
| 数据库查询 | `src/lib/db/products.ts`, `quotation.ts`, `user.ts` |
| Prisma 客户端 | `src/lib/prisma.ts` |
| 报价 Store | `src/store/quotationStore.ts` |
| 测试工厂 | `src/test/factories.ts` |

---

_此文件用于新会话快速加载上下文。有重大变更时请更新。_
