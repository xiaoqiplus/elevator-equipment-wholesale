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

### ✅ 后台认证已加固（2026-10-27 15:32 修复，上一版此处是「待处理」）

**修的两个问题（原状态已作废）：**

| 问题 | 原实现 | 现实现 |
|:--|:--|:--|
| **token 可伪造**（最严重） | `token = base64("admin:<时间戳>")`，校验只做 `startsWith("admin:")` —— 无签名/无密钥/无有效期。任何人带 cookie `admin_token=YWRtaW46eA==`（= base64("admin:x")）即可通过全部 admin 接口 | `src/lib/admin-auth.ts`：HMAC-SHA256 签名 + 12h 有效期 + `timingSafeEqual` 定长比对 + 拒绝未来时间戳（>1min） |
| 口令明文在 public 仓库 | `ADMIN_PASS = "..."` 写死在 `login/route.ts`，自 2026-07-11 提交 `537bec9` 起暴露 | 只从环境变量 `ADMIN_PASSWORD` 读；**未配置时 fail-closed**（登录返回 503，不认任何凭证） |

**改动范围：** 新增 `src/lib/admin-auth.ts`；`login/route.ts` 改为签发签名 token；7 个受保护接口
（`products` / `brands` / `brands/merge` / `knowledge` / `site-config` / `upload` / `visits`）统一改用
`checkAdminAuth()`，旧的 `startsWith("admin:")` 校验已无残留。

**密钥派生：** `ADMIN_SECRET` 优先，未设则用 `ADMIN_PASSWORD` —— 即**改口令自动吊销所有旧会话**。

**部署前提（顺序不能反）：** 新代码是 fail-closed，服务器环境变量里必须先有 `ADMIN_PASSWORD`，
再推送代码。否则后台直接锁死（登录 503）。响哥已于 2026-10-27 在 Hostinger 面板添加。

**仍未做：** `/api/admin/login` 无登录失败限流 —— 密码改为环境变量后，暴力猜测成为唯一攻击面。
建议后续加（同 IP 10 次/10 分钟锁）。

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

## 3. 路由清单（28 条路由）

### 页面

| 路由 | 类型 | 状态 |
|------|------|------|
| `/` | Static | ✅ 首页（含分类卡片） |
| `/products` | Dynamic | ✅ 产品列表（搜索/筛选/分页） |
| `/products/[sku]` | Dynamic | ✅ 产品详情 |
| `/categories` | Static | ✅ 全部分类 |
| `/categories/[slug]` | Dynamic | ✅ 分类产品列表 |
| `/brands` | Static | ✅ 全部品牌 |
| `/brands/[slug]` | Dynamic | ✅ 品牌产品列表 |
| `/quotation` | Static | ✅ 报价车 |
| `/login` | Static | ✅ 登录 |
| `/register` | Static | ✅ 注册 |
| `/account` | Static | ✅ 用户中心（报价历史+收藏占位） |
| `/admin` | Static | ✅ 管理后台首页 |
| `/admin/products` | Static | ✅ 产品管理 |
| `/admin/quotations` | Static | ✅ 报价管理 |
| `/admin/users` | Static | ✅ 用户管理 |
| `/robots.txt` | Static | ✅ |
| `/sitemap.xml` | Static | ✅ |
| `/not-found` | Static | ✅ 自定义 404 |
| `/error` | Static | ✅ 错误边界 |

### API 路由

| 路由 | 方法 | 认证 | CSRF |
|------|------|------|------|
| `/api/products` | GET | 公开 | - |
| `/api/products/[sku]` | GET | 公开（价格需要登录） | - |
| `/api/quotations` | GET/POST | 需要登录 | POST 不需要 |
| `/api/auth/register` | POST | 公开 | - |
| `/api/auth/[...nextauth]` | * | NextAuth 内部 | NextAuth 内置 |
| `/api/admin/users` | GET | Admin | - |
| `/api/admin/users/[id]/approve` | PATCH | Admin | ✅ CSRF |
| `/api/admin/products/[id]` | DELETE | Admin | ✅ CSRF |
| `/api/admin/quotations` | GET | Admin | - |
| `/api/admin/quotations/[id]` | PATCH | Admin | ✅ CSRF |

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
