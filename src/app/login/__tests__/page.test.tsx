import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LoginPage from "../page";

/**
 * Login page tests.
 *
 * Stub returns null → all tests fail until implementation.
 */

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Mock next-auth session
let mockLoggedIn = false;
vi.mock("next-auth", () => ({
  default: () => (mockLoggedIn ? { user: { email: "user@test.com" } } : null),
}));

describe("LoginPage", () => {
  it("should render the login form", () => {
    render(<LoginPage />);
    expect(
      screen.getByPlaceholderText(/邮箱|email/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/密码|password/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /登录|login|sign in/i })
    ).toBeInTheDocument();
  });

  it("should redirect to home if already logged in", async () => {
    mockLoggedIn = true;
    render(<LoginPage />);
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/");
    });
  });

  it("should show a link to the register page", () => {
    mockLoggedIn = false;
    render(<LoginPage />);
    const registerLink = screen.getByRole("link", { name: /注册|register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });
});
