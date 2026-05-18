# 电梯零件 B2B 网站 - 项目书

## 1. 项目概览
**项目名称**：Elevator Equipment Wholesale（暂定）  
**项目类型**：B2B 电子商务网站  
**核心目标**：为电梯制造商、安装维修公司和建筑公司提供电梯专用设备与电气部件的一站式线上采购平台。  
**商业模式**：次日发货、部件图片识别询价、领先制造商供货。  
**对标网站**：elevatorequipment.co.uk

## 2. 目标用户与角色
### 匿名访客
- 浏览所有产品（不显示价格）
- 使用搜索（名称或 SKU）
- 产品分类/品牌筛选
- 查看产品详情（规格、PDF 图纸/证书）
- 本地收藏夹
- 部件识别询价（WhatsApp 或图片上传表单）

### 已注册客户（审批通过）
- 访客全部权限
- 查看产品价格
- 报价车功能（增删改数量，提交生成报价请求）
- 查看历史报价单及状态
- 收藏夹云端同步
- 下载产品 PDF 附件

### 管理员
- 管理后台操作
- 产品 CRUD（含图片、PDF 上传）
- 处理报价（状态变更、手动回复、生成 PDF 报价单）
- 审批用户注册
- 分类与品牌管理

## 3. 功能模块与优先级
| 模块 | 功能点 | 优先级 |
|------|--------|--------|
| 产品目录 | 分类/品牌浏览，列表分页，详情（图片、规格、SKU、PDF 下载） | P0 |
| 搜索 | 按名称、SKU 模糊搜索 | P0 |
| 报价车 | 登录用户将产品加入报价车，调整数量，填写备注 | P0 |
| 报价提交 | 提交报价车，生成 QuotationRequest，邮件通知管理员 | P0 |
| 用户认证 | 邮箱注册、登录、公司信息，管理员审批 | P1 |
| 价格可见性 | 仅已审批客户可见价格，未登录显示"登录后查看" | P1 |
| 用户中心 | 历史报价单列表、收藏夹管理 | P1 |
| 管理员后台 | 产品管理、报价处理、用户审批 | P1 |
| 部件识别询价 | WhatsApp 悬浮按钮 + 图片上传表单（拖拽），邮件通知管理员 | P2 |
| PDF 自动生成 | 管理员在后台生成报价 PDF 并邮件回复客户 | P2 |
| SEO 优化 | 动态 sitemap、元描述、结构化数据 | P3 |

## 4. 技术栈
- **全栈框架**：Next.js 14 (App Router) + TypeScript
- **UI**：Tailwind CSS + shadcn/ui
- **数据库**：PostgreSQL（通过 Supabase 托管）
- **ORM**：Prisma
- **认证**：NextAuth.js (Credentials/Email provider)
- **文件存储**：Cloudflare R2（图片、PDF 等）
- **邮件服务**：Resend（或 Nodemailer + SES）
- **状态管理**：Zustand（管理报价车等客户端状态）
- **部署**：Vercel（应用）+ Supabase（数据库）

## 5. 数据模型（Prisma Schema 核心结构）
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  companyName   String?
  phone         String?
  role          Role      @default(CUSTOMER)
  isApproved    Boolean   @default(false)
  favorites     Favorite[]
  quotations    QuotationRequest[]
}

enum Role {
  CUSTOMER
  ADMIN
}

model Product {
  id          String     @id @default(cuid())
  sku         String     @unique
  name        String
  description String?
  price       Decimal?
  categoryId  String?
  brandId     String?
  images      String[]   // R2 URLs
  specs       Json?
  category    Category?  @relation(fields: [categoryId], references: [id])
  brand       Brand?     @relation(fields: [brandId], references: [id])
  documents   Document[]
  favorites   Favorite[]
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  parentId String?
  parent   Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  products Product[]
}

model Brand {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  logoUrl  String?
  products Product[]
}

model Document {
  id        String   @id @default(cuid())
  productId String
  type      DocumentType
  name      String
  fileUrl   String
  product   Product  @relation(fields: [productId], references: [id])
}

enum DocumentType {
  DRAWING
  MANUAL
  CERTIFICATE
}

model QuotationRequest {
  id        String        @id @default(cuid())
  userId    String
  status    QuotationStatus @default(PENDING)
  items     Json          // [{productId, sku, name, quantity, note}]
  adminNotes String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  user      User          @relation(fields: [userId], references: [id])
}

enum QuotationStatus {
  PENDING
  RESPONDED
  CONVERTED_TO_ORDER
}

model Favorite {
  userId    String
  productId String
  user      User    @relation(fields: [userId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
  @@id([userId, productId])
}

## 6. 路由设计（App Router）
| 路径 | 页面名称 | 功能简述 |
|------|---------|---------|
| / | 首页 | 精选分类、新品推荐、搜索入口 |
| /products | 产品列表 | 分页、筛选、搜索 |
| /products/[slug] | 产品详情 | 图片、规格、PDF 下载、加报价车 |
| /categories/[slug] | 分类页 | 该分类下产品列表 |
| /brands/[slug] | 品牌页 | 该品牌下产品列表 |
| /quotation | 报价车 | 查看、编辑、提交报价 |
| /account | 用户中心 | 历史报价、收藏、个人信息 |
| /admin | 管理后台 | 产品管理、报价处理、用户审批 |
| /admin/products | 产品管理 | CRUD |
| /admin/quotations | 报价管理 | 查看、修改状态、回复 |
| /admin/users | 用户管理 | 审批客户 |
| /api/auth/[...nextauth] | 认证 API | NextAuth 路由 |
| /api/products | 产品 API | 列表/详情（含权限） |
| /api/quotations | 报价 API | 提交、查询 |
| /api/upload | 文件上传 | 图片/PDF 上传至 R2 |
| /api/contact | 部件识别询价 | 图片上传表单后端 |

## 7. 核心业务逻辑实现要点
- **价格保护**：API 返回产品时检查用户认证与审批状态，未审批产品价格字段返回 null。前端显示"登录后查看价格"。
- **报价车**：使用 Zustand 管理本地状态，提交时调 API 创建 QuotationRequest，同时发送邮件通知管理员。
- **邮件通知**：使用 Resend 发送模板邮件，包含客户信息、产品清单、链接至后台。
- **PDF 生成（P2）**：后台处理报价时可生成 PDF（使用 @react-pdf/renderer），包含公司信息、产品列表、总价，邮件发送给客户。
- **部件识别询价**：页面底部 WhatsApp 悬浮按钮，点击跳转；独立上传页面用 react-dropzone，上传到 R2，邮件发送链接。

## 8. 环境变量
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
ADMIN_EMAIL=
```

## 9. 开发阶段
### 阶段一：地基
- 初始化 Next.js 项目，配置 TypeScript, Tailwind, shadcn/ui
- 配置 Supabase 数据库，推送 Prisma Schema
- 编写种子脚本，导入示例数据
- 搭建基础布局和静态首页

### 阶段二：骨架
- 实现产品浏览（列表、详情、搜索、分类/品牌）
- 报价车与提交功能（价格保护）
- 用户注册登录（NextAuth）
- 管理员审批价格可见

### 阶段三：血肉
- 用户中心（报价历史、收藏夹）
- 管理员后台（产品管理、报价处理、用户审批）
- 部件识别询价（WhatsApp + 上传表单）
- PDF 生成与邮件回复（P2）

### 阶段四：润色
- SEO 优化、性能调优、错误处理
- 部署至 Vercel，绑定域名
- 最终测试与上线

## 10. OpenClaw 开发协作说明
本项目的所有开发工作将由 OpenClaw 智能体执行。我将作为架构师提供分阶段指令，并审查 OpenClaw 的输出。

协作规则：
- 每个阶段开始前，明确需交付的代码文件和功能。
- OpenClaw 完成编码后，我会进行代码审查和功能验证。
- 所有配置信息（环境变量等）不存储在代码仓库中，仅通过 .env.example 提示。
- 此项目书将作为 OpenClaw 执行任务的最高指南。
