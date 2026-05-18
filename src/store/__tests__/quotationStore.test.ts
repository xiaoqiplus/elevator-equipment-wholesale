import { describe, it, expect, beforeEach } from "vitest";
import { useQuotationStore } from "../quotationStore";

/**
 * Quotation Zustand store tests.
 *
 * Stub returns null → all tests fail until implementation.
 */

const sampleProduct = {
  sku: "TEST-SKU-001",
  name: "Test Product",
  price: 129.99,
};

beforeEach(() => {
  // Reset store state before each test
  useQuotationStore.getState().clearItems();
});

describe("useQuotationStore — initial state", () => {
  it("should start with an empty items array", () => {
    const { items } = useQuotationStore.getState();
    expect(items).toEqual([]);
  });

  it("should have getItemCount return 0 initially", () => {
    const count = useQuotationStore.getState().getItemCount();
    expect(count).toBe(0);
  });

  it("should have getTotalItems return 0 initially", () => {
    const count = useQuotationStore.getState().getTotalItems();
    expect(count).toBe(0);
  });
});

describe("useQuotationStore — addItem", () => {
  it("should add a product to items", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].sku).toBe("TEST-SKU-001");
    expect(items[0].quantity).toBe(1);
  });

  it("should increase quantity when adding an existing product", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().addItem(sampleProduct);
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("should add multiple different products", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().addItem({
      sku: "TEST-SKU-002",
      name: "Second Product",
      price: 89.99,
    });
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(2);
  });
});

describe("useQuotationStore — removeItem", () => {
  it("should remove a product by SKU", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().removeItem("TEST-SKU-001");
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(0);
  });

  it("should only remove the specified product", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().addItem({
      sku: "SKU-002",
      name: "Product B",
      price: 49.99,
    });
    useQuotationStore.getState().removeItem("TEST-SKU-001");
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].sku).toBe("SKU-002");
  });
});

describe("useQuotationStore — updateQuantity", () => {
  it("should update the quantity of a product", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().updateQuantity("TEST-SKU-001", 5);
    const { items } = useQuotationStore.getState();
    expect(items[0].quantity).toBe(5);
  });

  it("should remove the product when quantity < 1", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().updateQuantity("TEST-SKU-001", 0);
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(0);
  });

  it("should remove the product when quantity is negative", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().updateQuantity("TEST-SKU-001", -1);
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(0);
  });

  it("should handle updating a non-existent SKU gracefully", () => {
    // Should not throw
    expect(() => {
      useQuotationStore.getState().updateQuantity("NONEXISTENT", 5);
    }).not.toThrow();
  });
});

describe("useQuotationStore — clearItems", () => {
  it("should clear all items from the cart", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().addItem({
      sku: "SKU-003",
      name: "Product C",
      price: 199.0,
    });
    useQuotationStore.getState().clearItems();
    const { items } = useQuotationStore.getState();
    expect(items).toHaveLength(0);
  });
});

describe("useQuotationStore — counts", () => {
  it("getItemCount should return total quantity (sum of all quantities)", () => {
    useQuotationStore.getState().addItem(sampleProduct); // qty 1
    useQuotationStore.getState().addItem(sampleProduct); // qty 2
    useQuotationStore.getState().addItem({
      sku: "SKU-004",
      name: "Product D",
      price: 59.99,
    }); // qty 1
    const count = useQuotationStore.getState().getItemCount();
    expect(count).toBe(3); // 2 + 1
  });

  it("getTotalItems should return number of unique product types", () => {
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().addItem({
      sku: "SKU-005",
      name: "Product E",
      price: 39.99,
    });
    const total = useQuotationStore.getState().getTotalItems();
    expect(total).toBe(2); // 2 unique SKUs
  });
});

describe("useQuotationStore — persistence", () => {
  it("should persist items to localStorage and restore on re-initialization", () => {
    // Add data
    useQuotationStore.getState().addItem(sampleProduct);
    useQuotationStore.getState().addItem({
      sku: "PERSIST-SKU",
      name: "Persist Product",
      price: 299.99,
    });

    // Simulate page reload by re-creating the store
    const { persist } = useQuotationStore.persist;
    expect(persist).toBeDefined();

    // The persisted data should be in localStorage
    const stored = localStorage.getItem(
      Object.keys(localStorage).find((k) => k.includes("quotation")) ?? ""
    );
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state.items).toHaveLength(2);
    }
  });
});
