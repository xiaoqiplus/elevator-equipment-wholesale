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
    expect(screen.getByText(/QuickEasy/)).toBeInTheDocument();
  });

  it("应包含产品中心链接", () => {
    render(<Header />);
    expect(screen.getByText("产品中心")).toBeInTheDocument();
  });

  it("应包含关于我们链接", () => {
    render(<Header />);
    expect(screen.getByText("关于我们")).toBeInTheDocument();
  });

  it("应包含联系我们链接", () => {
    render(<Header />);
    expect(screen.getByText("联系我们")).toBeInTheDocument();
  });

  it("不应包含登录链接", () => {
    render(<Header />);
    expect(screen.queryByText("登录")).not.toBeInTheDocument();
  });

  it("不应包含注册链接", () => {
    render(<Header />);
    expect(screen.queryByText("注册")).not.toBeInTheDocument();
  });
});

describe("📞 页脚 Footer", () => {
  it("应显示联系方式", () => {
    render(<Footer />);
    expect(screen.getByText(/电话/)).toBeInTheDocument();
    expect(screen.getByText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByText(/微信/)).toBeInTheDocument();
  });

  it("应包含产品中心链接", () => {
    render(<Footer />);
    expect(screen.getByText("产品中心")).toBeInTheDocument();
  });
});
