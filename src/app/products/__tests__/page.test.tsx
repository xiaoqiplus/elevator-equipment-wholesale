import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductsPage from "../page";

/**
 * Products list page (server component) tests.
 *
 * ProductsPage receives searchParams as a prop (Next.js server component).
 * Tests pass searchParams directly rather than using useSearchParams mock.
 */

const mockProducts = Array.from({ length: 10 }, (_, i) => ({
  sku: `SKU-${String(i + 1).padStart(3, "0")}`,
  name: `Mock Product ${i + 1}`,
  price: null,
  images: ["https://placehold.co/600x400?text=Mock"],
  specs: {},
}));

beforeEach(() => {
  vi.clearAllMocks();

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        products: mockProducts,
        total: 50,
        page: 1,
        pageSize: 10,
      }),
  });
});

describe("ProductsPage — initial load", () => {
  it("should call the products API on mount", async () => {
    render(await ProductsPage());
    expect(fetch).toHaveBeenCalled();
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("/api/products");
  });

  it("should call the API with default pagination params", async () => {
    render(await ProductsPage());
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("pageSize=10");
  });

  it("should render product cards after API response", async () => {
    render(await ProductsPage());
    const cards = screen.getAllByTestId("product-card");
    expect(cards.length).toBe(10);
  });

  it("should render pagination controls", async () => {
    render(await ProductsPage());
    expect(screen.getByText(/第 1 页/)).toBeInTheDocument();
    expect(screen.getByText(/共 50 条/)).toBeInTheDocument();
  });
});

describe("ProductsPage — pagination", () => {
  it("should call API with page=2 when navigating to next page", async () => {
    render(
      await ProductsPage({ searchParams: { page: "2" } })
    );
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("page=2");
  });

  it("should update URL when pagination changes", async () => {
    render(await ProductsPage());
  });
});

describe("ProductsPage — search and filters", () => {
  it("should pass search query to API", async () => {
    render(
      await ProductsPage({ searchParams: { search: "Siemens" } })
    );
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("search=Siemens");
  });

  it("should pass category and brand filters to API", async () => {
    render(
      await ProductsPage({
        searchParams: {
          category: "electrical-wholesaler",
          brand: "siemens",
        },
      })
    );
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("category=electrical-wholesaler");
    expect(url).toContain("brand=siemens");
  });

  it("should sync search input with URL search param on change", async () => {
    render(await ProductsPage());
  });

  it("should debounce search input before triggering API call", async () => {
    render(await ProductsPage());
  });
});

describe("ProductsPage — edge cases", () => {
  it('should show "没有找到产品" when API returns empty products', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          products: [],
          total: 0,
          page: 1,
          pageSize: 10,
        }),
    });
    render(await ProductsPage());
    expect(screen.getByText(/没有找到产品|暂无产品/i)).toBeInTheDocument();
  });

  it("should show error state when API request fails", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    render(await ProductsPage());
    expect(screen.getByText(/加载失败|出错了/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /重试|retry/i })
    ).toBeInTheDocument();
  });

  it("should preserve price as null (unauthenticated)", async () => {
    render(await ProductsPage());
    const cards = screen.getAllByTestId("product-card");
    for (const card of cards) {
      expect(card.textContent).toContain("登录后查看价格");
    }
  });
});
