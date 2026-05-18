import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminUsersPage from "../page";

/**
 * Admin user management page tests.
 */

let mockSessionData: any = null;
let mockSessionStatus = "unauthenticated";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: mockSessionData, status: mockSessionStatus }),
}));

const mockUsers = [
  { id: "u1", email: "pending@test.com", name: "Pending User", companyName: "Test Corp", isApproved: false, role: "CUSTOMER" },
  { id: "u2", email: "approved@test.com", name: "Approved User", companyName: "ACME Corp", isApproved: true, role: "CUSTOMER" },
];

beforeEach(() => {
  mockSessionData = null;
  mockSessionStatus = "unauthenticated";
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockUsers),
  });
});

describe("AdminUsersPage — access control", () => {
  it("should show 403 for non-admin users", () => {
    mockSessionData = { user: { email: "customer@test.com", role: "CUSTOMER" } };
    mockSessionStatus = "authenticated";
    render(<AdminUsersPage />);
    expect(screen.getByText(/403|无权访问/i)).toBeInTheDocument();
  });
});

describe("AdminUsersPage — admin view", () => {
  beforeEach(() => {
    mockSessionData = { user: { email: "admin@test.com", role: "ADMIN" } };
    mockSessionStatus = "authenticated";
  });

  it("should render users in a table", () => {
    render(<AdminUsersPage />);
    expect(screen.getByText(/邮箱|Email/i)).toBeInTheDocument();
    expect(screen.getByText(/姓名|Name/i)).toBeInTheDocument();
    expect(screen.getByText(/公司|Company/i)).toBeInTheDocument();
    expect(screen.getByText(/审批|Approved/i)).toBeInTheDocument();
  });

  it("should display user emails and names", async () => {
    render(<AdminUsersPage />);
    await waitFor(() => {
      expect(screen.getByText("pending@test.com")).toBeInTheDocument();
    });
    expect(screen.getByText("Pending User")).toBeInTheDocument();
    expect(screen.getByText("Approved User")).toBeInTheDocument();
  });

  it("should show company names", async () => {
    render(<AdminUsersPage />);
    await waitFor(() => {
      expect(screen.getByText("Test Corp")).toBeInTheDocument();
    });
    expect(screen.getByText("ACME Corp")).toBeInTheDocument();
  });

  it('should show "审批" button for unapproved users', async () => {
    render(<AdminUsersPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /审批|Approve/i }).length).toBe(1);
    });
  });

  it('should show "已审批" label for approved users', async () => {
    render(<AdminUsersPage />);
    expect(await screen.findByText(/已审批/i)).toBeInTheDocument();
  });

  it("should call PATCH /api/admin/users/[id]/approve when approving", async () => {
    render(<AdminUsersPage />);
    await waitFor(() => {
      expect(screen.getByText("pending@test.com")).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole("button", { name: /审批|Approve/i });
    fireEvent.click(approveBtn);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/users/"),
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("should hide approve button after successful approval", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ isApproved: true }) });
    });

    render(<AdminUsersPage />);
    await waitFor(() => {
      expect(screen.getByText("pending@test.com")).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole("button", { name: /审批|Approve/i });
    fireEvent.click(approveBtn);

    expect(await screen.findByText(/已审批/i)).toBeInTheDocument();
  });
});
