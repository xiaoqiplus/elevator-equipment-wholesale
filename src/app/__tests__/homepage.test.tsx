/**
 * 首页测试 — 验证页面结构和关键组件
 *
 * 2026-11-18 修：Header/Footer 是 client 组件，Header 依赖 usePathname()。
 * 之前没有 mock next/navigation，6 条用例一直红（STATE.md 记录为「既有失败」）。
 * 这里补上 router mock；Footer 的联系方式断言同步到当前域名（quickeaseliftparts.com）。
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

describe("🏠 首页", () => {
  it("首页组件应正常导出", async () => {
    const mod = await import("../page");
    expect(mod.default).toBeDefined();
  });
});

describe("🧭 导航栏 Header", () => {
  it("应显示公司名称", () => {
    render(<Header />);
    // 公司名以 logo 的 alt 文本呈现（不是可见文本节点）
    expect(screen.getByAltText(/QuickEase/i)).toBeInTheDocument();
  });

  it("应包含产品链接", () => {
    render(<Header />);
    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  it("应包含关于链接", () => {
    render(<Header />);
    expect(screen.getByText("About Us")).toBeInTheDocument();
  });

  it("应包含联系链接", () => {
    render(<Header />);
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
  });

  it("应包含 Knowledge 链接", () => {
    render(<Header />);
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
  });
});

describe("📞 页脚 Footer", () => {
  it("应显示联系方式", () => {
    render(<Footer />);
    expect(screen.getByText(/@quickeaseliftparts/)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp/)).toBeInTheDocument();
  });

  it("应包含产品链接", () => {
    render(<Footer />);
    expect(screen.getByText("Products")).toBeInTheDocument();
  });
});
