import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminPage from "../page";

/**
 * Admin dashboard page tests.
 */

let mockSessionData: any = null;
let mockSessionStatus = "unauthenticated";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: mockSessionData, status: mockSessionStatus }),
}));

beforeEach(() => {
  mockSessionData = null;
  mockSessionStatus = "unauthenticated";
});

describe("AdminPage — access control", () => {
  it("should redirect or show 403 when user is not authenticated", () => {
    render(<AdminPage />);
    expect(screen.getByText(/403|无权访问|Unauthorized/i)).toBeInTheDocument();
  });

  it("should redirect or show 403 when user is not an admin", () => {
    mockSessionData = { user: { email: "customer@test.com", role: "CUSTOMER" } };
    mockSessionStatus = "authenticated";
    render(<AdminPage />);
    expect(screen.getByText(/403|无权访问|Unauthorized/i)).toBeInTheDocument();
  });

  it("should render admin navigation when user is admin", () => {
    mockSessionData = { user: { email: "admin@test.com", role: "ADMIN" } };
    mockSessionStatus = "authenticated";
    render(<AdminPage />);
    expect(screen.getByText(/管理后台/i)).toBeInTheDocument();
  });
});

describe("AdminPage — navigation links", () => {
  beforeEach(() => {
    mockSessionData = { user: { email: "admin@test.com", role: "ADMIN" } };
    mockSessionStatus = "authenticated";
  });

  it("should have a link to product management", () => {
    render(<AdminPage />);
    const link = screen.getByRole("link", { name: /产品管理|Products/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/admin/products");
  });

  it("should have a link to quotation management", () => {
    render(<AdminPage />);
    const link = screen.getByRole("link", { name: /报价管理|Quotations/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/admin/quotations");
  });

  it("should have a link to user management", () => {
    render(<AdminPage />);
    const link = screen.getByRole("link", { name: /用户管理|Users/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/admin/users");
  });
});
