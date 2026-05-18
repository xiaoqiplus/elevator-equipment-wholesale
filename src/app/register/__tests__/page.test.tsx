import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RegisterPage from "../page";

/**
 * Register page tests.
 *
 * Stub returns null → all tests fail until implementation.
 */

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

let mockLoggedIn = false;
vi.mock("next-auth", () => ({
  default: () => (mockLoggedIn ? { user: { email: "user@test.com" } } : null),
}));

describe("RegisterPage", () => {
  it("should render the registration form", () => {
    render(<RegisterPage />);
    expect(
      screen.getByPlaceholderText(/邮箱|email/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/密码|password/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/姓名|name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /注册|register|sign up/i })
    ).toBeInTheDocument();
  });

  it("should redirect to home if already logged in", async () => {
    mockLoggedIn = true;
    render(<RegisterPage />);
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/");
    });
  });

  it("should show a link to the login page", () => {
    mockLoggedIn = false;
    render(<RegisterPage />);
    const loginLink = screen.getByRole("link", { name: /登录|login|sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
