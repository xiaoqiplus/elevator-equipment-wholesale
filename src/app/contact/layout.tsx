import type { Metadata } from "next";

// /contact 的 page.tsx 是客户端组件（"use client"），不能直接导出 metadata，
// 所以用一个只负责 metadata 的 layout 包一层。
// 之前这里没有 metadata，导致联系页标题是站点默认标题、canonical 继承成了首页。
export const metadata: Metadata = {
  title: "Contact Us — Request a Quote",
  description:
    "Contact QuickEase Lift Parts in Xi'an, China for elevator and escalator spare parts quotes. Email, WhatsApp and phone support for international buyers.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us — Request a Quote",
    description:
      "Contact QuickEase Lift Parts for elevator and escalator spare parts quotes. Email, WhatsApp and phone support for international buyers.",
    type: "website",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
