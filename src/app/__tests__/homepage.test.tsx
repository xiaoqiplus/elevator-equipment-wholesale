/**
 * 首页测试 — 验证页面结构和关键组件
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText(/QuickEase/)).toBeInTheDocument();
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
    expect(screen.getByText(/@quickeasylift/)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp/)).toBeInTheDocument();
  });

  it("应包含产品链接", () => {
    render(<Footer />);
    expect(screen.getByText("Products")).toBeInTheDocument();
  });
});
