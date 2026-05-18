import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QuotationPage from "../page";

/**
 * Quotation page tests.
 *
 * Stub returns null → all tests fail until implementation.
 */

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Mock next-auth/react useSession
let mockSessionData: any = { user: { email: "user@test.com" } };
let mockSessionStatus = "authenticated";
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: mockSessionData, status: mockSessionStatus }),
}));

// Mock Zustand store
const mockItems: any[] = [];
const mockAddItem = vi.fn();
const mockRemoveItem = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockClearItems = vi.fn();
const mockGetItemCount = vi.fn(() => 0);

vi.mock("@/store/quotationStore", () => ({
  useQuotationStore: () => ({
    items: mockItems,
    addItem: mockAddItem,
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    clearItems: mockClearItems,
    getItemCount: mockGetItemCount,
    getTotalItems: () => mockItems.length,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset mock items
  mockItems.length = 0;
  // Reset session to authenticated by default
  mockSessionData = { user: { email: "user@test.com" } };
  mockSessionStatus = "authenticated";

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ id: "QUO-001" }),
  });
});

describe("QuotationPage — empty cart", () => {
  it('should show "报价车为空" when there are no items', () => {
    render(<QuotationPage />);
    expect(screen.getByText(/报价车为空/i)).toBeInTheDocument();
  });

  it("should show a link to products page when empty", () => {
    render(<QuotationPage />);
    const link = screen.getByRole("link", { name: /浏览产品|产品列表/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/products");
  });
});

describe("QuotationPage — with items", () => {
  beforeEach(() => {
    mockItems.push(
      {
        sku: "SKU-A",
        name: "Product A",
        price: 199.99,
        quantity: 2,
        note: "",
      },
      {
        sku: "SKU-B",
        name: "Product B",
        price: 89.5,
        quantity: 1,
        note: "",
      }
    );
    mockGetItemCount.mockReturnValue(3); // 2 + 1
  });

  it("should render product list with names and SKUs", () => {
    render(<QuotationPage />);
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
    expect(screen.getByText(/SKU-A/)).toBeInTheDocument();
    expect(screen.getByText(/SKU-B/)).toBeInTheDocument();
  });

  it("should render quantity for each item", () => {
    render(<QuotationPage />);
    const quantities = screen.getAllByText(/^\d+$/);
    expect(quantities.length).toBeGreaterThanOrEqual(2);
  });

  it("should display item count in the header", () => {
    render(<QuotationPage />);
    expect(screen.getByText(/共 3 件/)).toBeInTheDocument();
  });

  it("should display total price", () => {
    render(<QuotationPage />);
    // 199.99 * 2 + 89.5 * 1 = 489.48
    expect(screen.getByText(/\$489\.48/)).toBeInTheDocument();
  });

  it("should provide quantity adjustment buttons", () => {
    render(<QuotationPage />);
    const plusButtons = screen.getAllByRole("button", { name: /增加|plus|\+/i });
    expect(plusButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(plusButtons[0]);
    expect(mockUpdateQuantity).toHaveBeenCalled();
  });

  it("should provide remove buttons for each item", () => {
    render(<QuotationPage />);
    const removeButtons = screen.getAllByRole("button", {
      name: /删除|移除|remove|delete/i,
    });
    expect(removeButtons.length).toBe(2);
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveItem).toHaveBeenCalledWith("SKU-A");
  });

  it('should have a "提交报价" submit button', () => {
    render(<QuotationPage />);
    expect(
      screen.getByRole("button", { name: /提交报价|submit/i })
    ).toBeInTheDocument();
  });

  it("should call POST /api/quotations on submit", async () => {
    render(<QuotationPage />);
    const submitButton = screen.getByRole("button", { name: /提交报价|submit/i });
    fireEvent.click(submitButton);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/quotations",
      expect.objectContaining({
        method: "POST",
      })
    );
    // Verify body contains items
    const callArgs = (globalThis.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.items).toHaveLength(2);
  });
});

describe("QuotationPage — submit success", () => {
  beforeEach(() => {
    mockItems.push({
      sku: "SKU-SUBMIT",
      name: "Submit Product",
      price: 150.0,
      quantity: 1,
      note: "",
    });
  });

  it("should show success message after submitting", async () => {
    render(<QuotationPage />);
    const submitButton = screen.getByRole("button", { name: /提交报价|submit/i });
    fireEvent.click(submitButton);

    // After successful submit, show success message
    expect(await screen.findByText(/提交成功|报价已提交/i)).toBeInTheDocument();
  });

  it("should clear the cart after successful submission", async () => {
    render(<QuotationPage />);
    const submitButton = screen.getByRole("button", { name: /提交报价|submit/i });
    fireEvent.click(submitButton);

    // Wait for the async submit to complete
    await screen.findByText(/提交成功|报价已提交/i);
    expect(mockClearItems).toHaveBeenCalled();
  });
});

describe("QuotationPage — unauthenticated", () => {
  beforeEach(() => {
    mockSessionData = null;
    mockSessionStatus = "unauthenticated";
  });

  it("should redirect to login page when user is not authenticated", async () => {
    render(<QuotationPage />);
    expect(mockRouterPush).toHaveBeenCalledWith("/login");
  });
});

describe("QuotationPage — submit failure", () => {
  beforeEach(() => {
    mockItems.push({
      sku: "SKU-FAIL",
      name: "Fail Product",
      price: 99.99,
      quantity: 1,
      note: "",
    });
  });

  it("should show error message when submission fails", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<QuotationPage />);
    const submitButton = screen.getByRole("button", { name: /提交报价|submit/i });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText(/提交失败|出错了/i)
    ).toBeInTheDocument();
  });
});
