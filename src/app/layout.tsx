import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AOSProvider from "@/components/AOSProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "QuickEase Lift Parts - 电梯配件供应商",
    template: "%s | QuickEase Lift Parts",
  },
  description:
    "Quick Delivery. Easy Service. Zero Downtime. 专业电梯零部件供应商，提供门系统、控制系统、曳引系统等全系列电梯配件。",
  keywords: [
    "电梯配件",
    "电梯零部件",
    "电梯门系统",
    "电梯控制系统",
    "电梯曳引系统",
    "电梯线缆",
    "电梯安全部件",
    "三菱电梯配件",
    "奥的斯电梯配件",
  ],
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <AOSProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AOSProvider>
      </body>
    </html>
  );
}
