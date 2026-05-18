import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminQuotationsPage from "../page";

/**
 * Admin quotation management page tests.
 */

let mockSessionData: any = null;
let mockSessionStatus = "unauthenticated";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: mockSessionData, status: mockSessionStatus }),
}));

const mockQuotations = [
  { id: "q1", status: "PENDING", items: [{ sku: "SKU-A", name: "Product A", quantity: 2 }], createdAt: "2026-05-18T10:00:00Z", user: { name: "Customer A", email: "a@test.com" } },
  { id: "q2", status: "RESPONDED", items: [{ sku: "SKU-B", name: "Product B", quantity: 1 }], createdAt: "2026-05-17T14:00:00Z", user: { name: "Customer B", email: "b@test.com" } },
];

beforeEach(() => {
  mockSessionData = null;
  mockSessionStatus = "unauthenticated";
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockQuotations),
  });
});

describe("AdminQuotationsPage — access control", () => {
  it("should show 403 for non-admin users", () => {
    mockSessionData = { user: { email: "customer@test.com", role: "CUSTOMER" } };
    mockSessionStatus = "authenticated";
    render(<AdminQuotationsPage />);
    expect(screen.getByText(/403|无权访问/i)).toBeInTheDocument();
  });
});

describe("AdminQuotationsPage — admin view", () => {
  beforeEach(() => {
    mockSessionData = { user: { email: "admin@test.com", role: "ADMIN" } };
    mockSessionStatus = "authenticated";
  });

  it("should render quotations in a table", () => {
    render(<AdminQuotationsPage />);
    expect(screen.getByText(/ID|报价单/i)).toBeInTheDocument();
    expect(screen.getByText(/客户|Customer/i)).toBeInTheDocument();
    expect(screen.getByText(/状态|Status/i)).toBeInTheDocument();
    expect(screen.getByText(/时间|Created/i)).toBeInTheDocument();
  });

  it("should display quotation IDs and statuses", async () => {
    render(<AdminQuotationsPage />);
    await waitFor(() => {
      expect(screen.getByText("q1")).toBeInTheDocument();
    });
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("RESPONDED")).toBeInTheDocument();
  });

  it("should display customer names", async () => {
    render(<AdminQuotationsPage />);
    await waitFor(() => {
      expect(screen.getByText("Customer A")).toBeInTheDocument();
    });
    expect(screen.getByText("Customer B")).toBeInTheDocument();
  });

  it('should have "查看详情" operation for each quotation', async () => {
    render(<AdminQuotationsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /查看详情|View|Detail/i }).length).toBe(2);
    });
  });

  it('should have "更改状态" operation for each quotation', async () => {
    render(<AdminQuotationsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /更改状态|Change Status/i }).length).toBe(2);
    });
  });

  it("should call PATCH API when changing status", async () => {
    render(<AdminQuotationsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /更改状态|Change Status/i }).length).toBe(2);
    });

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const statusBtn = screen.getAllByRole("button", { name: /更改状态|Change Status/i })[0];
    fireEvent.click(statusBtn);

    // Select new status in dropdown/select
    const statusSelect = screen.getByRole("combobox", { name: /状态|status/i });
    fireEvent.change(statusSelect, { target: { value: "RESPONDED" } });

    // Confirm
    const confirmBtn = screen.getByRole("button", { name: /确认|Confirm|Save/i });
    fireEvent.click(confirmBtn);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/quotations/"),
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
