import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "../Header";

/**
 * Header component tests.
 */

let mockSessionData: any = null;
let mockSessionStatus = "unauthenticated";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: mockSessionData, status: mockSessionStatus }),
  signOut: vi.fn(),
}));

beforeEach(() => {
  mockSessionData = null;
  mockSessionStatus = "unauthenticated";
});

describe("Header — navigation links", () => {
  it("should render the logo link", () => {
    render(<Header />);
    const logoLink = screen.getByRole("link", { name: /Elevator Equipment/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("should render Products navigation link", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: /Products/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/products");
  });

  it("should render Categories navigation link", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: /Categories/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/categories");
  });

  it("should render Brands navigation link", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: /Brands/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/brands");
  });

  it("should render Quotation Cart navigation link", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: /Quotation Cart/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/quotation");
  });
});

describe("Header — unauthenticated state", () => {
  it('should show "登录" and "注册" buttons', () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /登录/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /注册/i })).toBeInTheDocument();
  });

  it("should not show user info or logout button", () => {
    render(<Header />);
    expect(screen.queryByText(/退出/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/已认证/i)).not.toBeInTheDocument();
  });
});

describe("Header — authenticated state", () => {
  beforeEach(() => {
    mockSessionData = {
      user: { name: "Test User", email: "user@test.com" },
    };
    mockSessionStatus = "authenticated";
  });

  it("should show the user name", () => {
    render(<Header />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("should show a link to user account page", () => {
    render(<Header />);
    const accountLink = screen.getByRole("link", { name: /Test User/i });
    expect(accountLink).toHaveAttribute("href", "/account");
  });

  it('should show "退出" button', () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: /退出/i })).toBeInTheDocument();
  });

  it("should not show login/register buttons", () => {
    render(<Header />);
    expect(screen.queryByRole("link", { name: /登录/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /注册/i })).not.toBeInTheDocument();
  });

  it('should show "已认证" badge when user is approved', () => {
    mockSessionData.user.isApproved = true;
    render(<Header />);
    expect(screen.getByText(/已认证/i)).toBeInTheDocument();
  });

  it('should not show "已认证" badge when user is not approved', () => {
    mockSessionData.user.isApproved = false;
    render(<Header />);
    expect(screen.queryByText(/已认证/i)).not.toBeInTheDocument();
  });
});

describe("Header — loading state", () => {
  beforeEach(() => {
    mockSessionStatus = "loading";
  });

  it("should not show login/register buttons", () => {
    render(<Header />);
    expect(screen.queryByRole("link", { name: /登录/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /注册/i })).not.toBeInTheDocument();
  });

  it("should not show user info or logout", () => {
    render(<Header />);
    expect(screen.queryByText(/退出/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/已认证/i)).not.toBeInTheDocument();
  });
});
