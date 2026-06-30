/**
 * 产品页面测试 — 产品展示
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductCard from "@/components/products/ProductCard";

const mockCard = {
  sku: "ELE-DR-001",
  name: "电梯门机控制器",
  description: "适用于中分门",
  images: [],
  category: { name: "电梯门系统", slug: "door-systems" },
  brand: { name: "三菱", slug: "mitsubishi" },
};

describe("📦 产品卡片 ProductCard", () => {
  it("应显示产品名称和SKU", () => {
    render(<ProductCard {...mockCard} />);
    expect(screen.getByText("电梯门机控制器")).toBeInTheDocument();
    expect(screen.getByText(/ELE-DR-001/)).toBeInTheDocument();
  });

  it("应显示分类和品牌", () => {
    render(<ProductCard {...mockCard} />);
    expect(screen.getByText("电梯门系统")).toBeInTheDocument();
    expect(screen.getByText("三菱")).toBeInTheDocument();
  });

  it("不应显示价格", () => {
    render(<ProductCard {...mockCard} />);
    expect(screen.queryByText(/¥|￥|价格|price/i)).not.toBeInTheDocument();
  });

  it("不应显示登录查看价格", () => {
    render(<ProductCard {...mockCard} />);
    expect(screen.queryByText(/登录|login/i)).not.toBeInTheDocument();
  });

  it("不应显示加入报价车按钮", () => {
    render(<ProductCard {...mockCard} />);
    expect(screen.queryByText(/报价|quotation|cart/i)).not.toBeInTheDocument();
  });
});
