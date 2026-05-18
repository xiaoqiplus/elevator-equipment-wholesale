import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyNewQuotation } from "../notifyQuotation";

/**
 * Email notification tests.
 *
 * Stub is no-op → all tests fail until implementation.
 */

// Mock Resend client — vi.hoisted ensures the variable is available
// before vi.mock factory runs (factory is hoisted to top of file).
const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: "email-123" }, error: null })
);
vi.mock("@/lib/email/resend", () => ({
  resend: {
    emails: {
      send: mockSend,
    },
  },
}));

const sampleQuotation = {
  id: "QUO-001",
  status: "PENDING",
  items: [
    { sku: "SKU-A", name: "Product A", quantity: 2, price: 99.99 },
    { sku: "SKU-B", name: "Product B", quantity: 1, price: 199.5 },
  ],
  user: {
    email: "customer@example.com",
    name: "Test Customer",
    companyName: "Test Corp",
  },
  createdAt: new Date("2026-05-18T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notifyNewQuotation", () => {
  it("should call Resend send with correct parameters", async () => {
    await notifyNewQuotation(sampleQuotation);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should send email to ADMIN_EMAIL environment variable", async () => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

    await notifyNewQuotation(sampleQuotation);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs).toHaveProperty("to");
    expect(callArgs.to).toBe(adminEmail);
  });

  it("should include quotation ID in the email subject", async () => {
    await notifyNewQuotation(sampleQuotation);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.subject).toContain("QUO-001");
    expect(callArgs.subject).toContain("报价");
  });

  it("should include product summary in the email body", async () => {
    await notifyNewQuotation(sampleQuotation);

    const callArgs = mockSend.mock.calls[0][0];
    // Body should mention product names
    expect(callArgs.html || callArgs.text).toContain("Product A");
    expect(callArgs.html || callArgs.text).toContain("Product B");
    // Should include quantitles
    expect(callArgs.html || callArgs.text).toContain("2");
    expect(callArgs.html || callArgs.text).toContain("1");
  });

  it("should include customer name and company in email body", async () => {
    await notifyNewQuotation(sampleQuotation);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html || callArgs.text).toContain("Test Customer");
    expect(callArgs.html || callArgs.text).toContain("Test Corp");
  });

  it("should not throw when Resend returns an error", async () => {
    mockSend.mockRejectedValue(new Error("Resend API error"));

    // Should not throw — error should be caught and logged
    await expect(
      notifyNewQuotation(sampleQuotation)
    ).resolves.not.toThrow();
  });

  it("should not block the caller (resolves quickly)", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-456" }, error: null });

    const start = Date.now();
    await notifyNewQuotation(sampleQuotation);
    const duration = Date.now() - start;

    // Should resolve quickly (not block on slow email delivery)
    expect(duration).toBeLessThan(5000);
  });

  it("should handle quotations with a single item", async () => {
    const singleItemQuotation = {
      ...sampleQuotation,
      items: [{ sku: "SKU-SINGLE", name: "Single Product", quantity: 1, price: 49.99 }],
    };

    await notifyNewQuotation(singleItemQuotation);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should handle quotations with many items", async () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      sku: `SKU-${i}`,
      name: `Product ${i}`,
      quantity: i + 1,
      price: (i + 1) * 10,
    }));

    await notifyNewQuotation({ ...sampleQuotation, items: manyItems });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArgs = mockSend.mock.calls[0][0];
    // Should list all items or summarize them
    expect(callArgs.html || callArgs.text).toContain("Product 0");
    expect(callArgs.html || callArgs.text).toContain("Product 19");
  });
});
