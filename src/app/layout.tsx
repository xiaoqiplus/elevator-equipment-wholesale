import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import FloatingContact from "@/components/FloatingContact";
import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AOSProvider from "@/components/AOSProvider";
import { SiteConfigProvider } from "@/lib/site-config-context";
import { recordVisit } from "@/lib/visit-log";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";
const SITE_NAME = "XI'AN QUICKEASE LIFT PARTS CO., Ltd";
// 分析标识：没配置就不渲染任何第三方脚本（不影响站点）
// ⚠️ 故意不用 NEXT_PUBLIC_ 前缀：那种变量在构建时就被内联进 bundle，
//    而 Hostinger 面板的环境变量是运行时注入的 —— 面板里填了也不会生效。
//    这里用服务端变量 + SSR 输出，面板改完重启应用即可，无需重新构建。
const GA_ID = process.env.GA_ID || process.env.NEXT_PUBLIC_GA_ID;
const GSC_TOKEN = process.env.GSC_VERIFICATION || process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elevator Parts Supplier in China | XI'AN QUICKEASE LIFT PARTS CO., Ltd",
    template: "%s | QuickEase Lift Parts",
  },
  // 站点面向海外采购商，描述必须是英文（原先是中文，会在英文结果里显示中文描述）
  description:
    "Elevator and escalator spare parts supplier based in Xi'an, China. Door systems, control boards, traction machines, escalator handrails and safety switches for Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp and more. Fast worldwide dispatch and technical support.",
  keywords: [
    "elevator parts",
    "escalator parts",
    "elevator spare parts supplier",
    "elevator door operator",
    "elevator control board",
    "escalator handrail",
    "elevator traction machine",
    "Otis elevator parts",
    "Kone elevator parts",
    "Schindler elevator parts",
    "Mitsubishi elevator parts",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "QuickEase Lift Parts",
    url: SITE_URL,
    title: "Elevator & Escalator Spare Parts Supplier | QuickEase Lift Parts",
    description:
      "Elevator and escalator spare parts for all major brands. Xi'an, China. Fast worldwide dispatch.",
    images: [{ url: "/uploads/company.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevator & Escalator Spare Parts Supplier | QuickEase Lift Parts",
    description: "Elevator and escalator spare parts for all major brands. Fast worldwide dispatch.",
  },
  // 拿到 Search Console 的验证码后，填环境变量 NEXT_PUBLIC_GSC_VERIFICATION 即可，无需改代码
  verification: GSC_TOKEN ? { google: GSC_TOKEN } : undefined,
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-112.png", sizes: "112x112", type: "image/png" },
      { url: "/icon-128.png", sizes: "128x128", type: "image/png" },
    ],
    apple: "/icon-128.png",
  },
};

// 公司实体结构化数据（帮助 Google 建立"这是一家真实公司"的认知）
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "QuickEase Lift Parts",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-128.png`,
  email: "info@quickeaseliftparts.com",
  description:
    "Supplier of elevator and escalator spare parts for Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp and other major brands.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "CN",
    addressRegion: "Shaanxi",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: "info@quickeaseliftparts.com",
    telephone: "+8613335386941",
    availableLanguage: ["English", "Chinese"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 记录访问者 IP + 归属国家（失败静默，不影响页面）
  try {
    await recordVisit(headers());
  } catch {
    // 忽略
  }

  return (
    // 全站内容是英文，语言标记必须是 en（原先写成 zh-CN，会误导搜索引擎判断页面语言）
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
        <AOSProvider>
          <SiteConfigProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingContact />
          </SiteConfigProvider>
        </AOSProvider>
      </body>
    </html>
  );
}
