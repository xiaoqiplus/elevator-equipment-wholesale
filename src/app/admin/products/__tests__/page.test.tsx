import React from "react";
import { act } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminProductsPage from "../page";

/**
 * Admin product management page tests.
 */

let mockSessionData: any = null;
let mockSessionStatus = "unauthenticated";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: mockSessionData, status: mockSessionStatus }),
}));

const mockProducts = [
  { id: "p1", sku: "SKU-001", name: "Product A", price: 99.99, category: { name: "Electrical" } },
  { id: "p2", sku: "SKU-002", name: "Product B", price: 149.5, category: { name: "Lift" } },
  { id: "p3", sku: "SKU-003", name: "Product C", price: 249.0, category: { name: "Electrical" } },
];

beforeEach(() => {
  mockSessionData = null;
  mockSessionStatus = "unauthenticated";
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ products: mockProducts, total: 3, page: 1, pageSize: 10 }),
  });
});

describe("AdminProductsPage — access control", () => {
  it("should show 403 for non-admin users", () => {
    mockSessionData = { user: { email: "customer@test.com", role: "CUSTOMER" } };
    mockSessionStatus = "authenticated";
    render(<AdminProductsPage />);
    expect(screen.getByText(/403|无权访问/i)).toBeInTheDocument();
  });
});

describe("AdminProductsPage — admin view", () => {
  beforeEach(() => {
    mockSessionData = { user: { email: "admin@test.com", role: "ADMIN" } };
    mockSessionStatus = "authenticated";
  });

  it("should render product list in a table", () => {
    render(<AdminProductsPage />);
    expect(screen.getByText(/SKU/i)).toBeInTheDocument();
    expect(screen.getByText(/名称|Name/i)).toBeInTheDocument();
    expect(screen.getByText(/价格|Price/i)).toBeInTheDocument();
    expect(screen.getByText(/分类|Category/i)).toBeInTheDocument();
  });

  it("should display each product's SKU and name", async () => {
    render(<AdminProductsPage />);
    await waitFor(() => {
      expect(screen.getByText("SKU-001")).toBeInTheDocument();
    });
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("SKU-003")).toBeInTheDocument();
  });

  it("should have an edit button for each product", async () => {
    render(<AdminProductsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /编辑|Edit/i }).length).toBe(3);
    });
  });

  it("should have a delete button for each product", async () => {
    render(<AdminProductsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /删除|Delete/i }).length).toBe(3);
    });
  });

  it("should show confirmation dialog before deleting", async () => {
    render(<AdminProductsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /删除|Delete/i }).length).toBe(3);
    });
    const deleteBtn = screen.getAllByRole("button", { name: /删除|Delete/i })[0];
    const user = userEvent.setup();
    await user.click(deleteBtn);
    expect(await screen.findByText(/确认删除|确认/i)).toBeInTheDocument();
  });

  it("should call DELETE API when delete is confirmed", async () => {
    render(<AdminProductsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /删除|Delete/i }).length).toBe(3);
    });
    const deleteBtn = screen.getAllByRole("button", { name: /删除|Delete/i })[0];
    const user = userEvent.setup();
    await user.click(deleteBtn);
    const confirmBtn = await screen.findByRole("button", { name: /确认|Confirm/i });

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await user.click(confirmBtn);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products/"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it('should have an "新增产品" button', () => {
    render(<AdminProductsPage />);
    const addButton = screen.getByRole("button", { name: /新增产品|新增|Add Product/i });
    expect(addButton).toBeInTheDocument();
  });
});
