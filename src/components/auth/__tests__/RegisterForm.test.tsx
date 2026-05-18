import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RegisterForm from "../RegisterForm";

/**
 * RegisterForm component tests.
 *
 * Stub returns null → all tests fail until implementation.
 */

describe("RegisterForm", () => {
  it("should render email input field", () => {
    render(<RegisterForm />);
    expect(
      screen.getByPlaceholderText(/邮箱|email/i)
    ).toBeInTheDocument();
  });

  it("should render password input field", () => {
    render(<RegisterForm />);
    expect(
      screen.getByPlaceholderText(/密码|password/i)
    ).toBeInTheDocument();
  });

  it("should render name input field", () => {
    render(<RegisterForm />);
    expect(
      screen.getByPlaceholderText(/姓名|name/i)
    ).toBeInTheDocument();
  });

  it("should render company name input field", () => {
    render(<RegisterForm />);
    expect(
      screen.getByPlaceholderText(/公司|company/i)
    ).toBeInTheDocument();
  });

  it("should render a register button", () => {
    render(<RegisterForm />);
    expect(
      screen.getByRole("button", { name: /注册|register|sign up/i })
    ).toBeInTheDocument();
  });

  it("should call onSubmit with form data on submit", () => {
    const onSubmit = vi.fn();
    render(<RegisterForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/邮箱|email/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/密码|password/i), {
      target: { value: "SecurePass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/姓名|name/i), {
      target: { value: "New User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/公司|company/i), {
      target: { value: "My Company" },
    });

    const registerButton = screen.getByRole("button", {
      name: /注册|register|sign up/i,
    });
    fireEvent.click(registerButton);

    expect(onSubmit).toHaveBeenCalledWith({
      email: "newuser@example.com",
      password: "SecurePass123!",
      name: "New User",
      companyName: "My Company",
    });
  });

  it("should show validation errors for required fields", () => {
    render(<RegisterForm />);
    const registerButton = screen.getByRole("button", {
      name: /注册|register|sign up/i,
    });
    fireEvent.click(registerButton);

    expect(screen.getByText(/请输入邮箱|邮箱不能为空/i)).toBeInTheDocument();
    expect(screen.getByText(/请输入密码|密码不能为空/i)).toBeInTheDocument();
    expect(screen.getByText(/请输入姓名|姓名不能为空/i)).toBeInTheDocument();
  });

  it("should show success message after successful registration", () => {
    render(<RegisterForm isSuccess={true} />);
    expect(
      screen.getByText(/注册成功|registration successful/i)
    ).toBeInTheDocument();
  });

  it("should show error message when email already exists", () => {
    render(<RegisterForm error="邮箱已被注册" />);
    expect(screen.getByText(/邮箱已被注册/i)).toBeInTheDocument();
  });

  it("should disable submit button while loading", () => {
    render(<RegisterForm isLoading={true} />);
    const registerButton = screen.getByRole("button", {
      name: /注册|register|sign up/i,
    });
    expect(registerButton).toBeDisabled();
  });
});
