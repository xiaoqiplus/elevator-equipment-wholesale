# Elevator Equipment Wholesale — 项目状态快照

> 最后更新: 2026-05-18 20:17 CST · 会话数: 2

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
