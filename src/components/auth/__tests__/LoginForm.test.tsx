import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginForm from "../LoginForm";

/**
 * LoginForm component tests.
 *
 * Stub returns null → all tests fail until implementation.
 */

describe("LoginForm", () => {
  it("should render email input field", () => {
    render(<LoginForm />);
    expect(
      screen.getByPlaceholderText(/邮箱|email/i)
    ).toBeInTheDocument();
  });

  it("should render password input field", () => {
    render(<LoginForm />);
    expect(
      screen.getByPlaceholderText(/密码|password/i)
    ).toBeInTheDocument();
  });

  it("should render a login button", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("button", { name: /登录|login|sign in/i })
    ).toBeInTheDocument();
  });

  it("should call onSubmit with email and password when form is submitted", () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    const emailInput = screen.getByPlaceholderText(/邮箱|email/i);
    const passwordInput = screen.getByPlaceholderText(/密码|password/i);
    const loginButton = screen.getByRole("button", { name: /登录|login|sign in/i });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "mypassword" } });
    fireEvent.click(loginButton);

    expect(onSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "mypassword",
    });
  });

  it("should show validation error when email is empty", () => {
    render(<LoginForm />);
    const loginButton = screen.getByRole("button", { name: /登录|login|sign in/i });
    fireEvent.click(loginButton);
    expect(screen.getByText(/请输入邮箱|邮箱不能为空/i)).toBeInTheDocument();
  });

  it("should show validation error when password is empty", () => {
    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText(/邮箱|email/i);
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });

    const loginButton = screen.getByRole("button", { name: /登录|login|sign in/i });
    fireEvent.click(loginButton);
    expect(screen.getByText(/请输入密码|密码不能为空/i)).toBeInTheDocument();
  });

  it("should display error message when login fails", () => {
    render(<LoginForm error="邮箱或密码错误" />);
    expect(screen.getByText(/邮箱或密码错误/i)).toBeInTheDocument();
  });

  it("should disable the submit button while loading", () => {
    render(<LoginForm isLoading={true} />);
    const loginButton = screen.getByRole("button", { name: /登录|login|sign in/i });
    expect(loginButton).toBeDisabled();
  });

  it("should show loading text on button when isLoading", () => {
    render(<LoginForm isLoading={true} />);
    expect(screen.getByText(/登录中|loading/i)).toBeInTheDocument();
  });
});
