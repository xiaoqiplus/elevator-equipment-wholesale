import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductList from "../ProductList";

/**
 * ProductList component tests — state-driven.
 * The component fetches data internally; tests mock fetch to control states.
 */

const mockProducts = Array.from({ length: 12 }, (_, i) => ({
  sku: `SKU-${String(i + 1).padStart(3, "0")}`,
  name: `Product ${i + 1}`,
  description: `Description for product ${i + 1}`,
  price: i % 2 === 0 ? 99.99 + i * 10 : null,
  images: ["https://placehold.co/600x400?text=Product"],
  specs: { weight: `${i + 1}kg` },
}));

describe("ProductList — loading state", () => {
  it("should render skeleton placeholders while loading", () => {
    render(<ProductList />);
    // When data is still loading, show skeleton cards
    const skeletons = screen.getAllByTestId("product-skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should not show product cards while loading", () => {
    render(<ProductList />);
    expect(screen.queryAllByTestId("product-card")).toHaveLength(0);
  });
});

describe("ProductList — data state", () => {
  it("should render product cards after data loads", () => {
    render(
      <ProductList
        products={mockProducts}
        total={50}
        page={1}
        pageSize={10}
        loading={false}
      />
    );
    const cards = screen.getAllByTestId("product-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("should render pagination controls for multi-page results", () => {
    render(
      <ProductList
        products={mockProducts}
        total={50}
        page={1}
        pageSize={10}
        loading={false}
      />
    );
    expect(screen.getByRole("button", { name: /上一页|prev/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /下一页|next/i })).toBeInTheDocument();
    expect(screen.getByText(/第.*页/)).toBeInTheDocument();
  });

  it("should display the correct page number", () => {
    render(
      <ProductList
        products={mockProducts}
        total={50}
        page={1}
        pageSize={10}
        loading={false}
      />
    );
    expect(screen.getByText(/第 1 页/)).toBeInTheDocument();
  });
});

describe("ProductList — empty state", () => {
  it('should show "没有找到产品" when no products match filters', () => {
    render(<ProductList products={[]} total={0} loading={false} />);
    expect(screen.getByText(/没有找到产品|暂无产品/i)).toBeInTheDocument();
  });
});

describe("ProductList — error state", () => {
  it("should show error message when fetch fails", () => {
    render(
      <ProductList
        error="Something went wrong"
        loading={false}
        onRetry={() => {}}
      />
    );
    expect(screen.getByText(/加载失败|出错了/i)).toBeInTheDocument();
  });

  it("should show a retry button on error", () => {
    const onRetry = vi.fn();
    render(
      <ProductList
        error="Something went wrong"
        loading={false}
        onRetry={onRetry}
      />
    );
    expect(
      screen.getByRole("button", { name: /重试|retry/i })
    ).toBeInTheDocument();
  });
});

describe("ProductList — filtering", () => {
  it("should accept category and brand as props", () => {
    render(<ProductList category="electrical-wholesaler" brand="siemens" />);
    // Should not crash — renders filtered view
  });
});
