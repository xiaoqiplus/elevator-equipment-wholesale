import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QuotationItem from "../QuotationItem";

/**
 * QuotationItem component tests.
 *
 * Stub returns null → all tests fail until implementation.
 */

const baseProps = {
  sku: "ITEM-SKU-001",
  name: "Elevator Controller Board",
  price: 249.99,
  quantity: 2,
};

describe("QuotationItem", () => {
  it("should render the product name", () => {
    render(<QuotationItem {...baseProps} />);
    expect(screen.getByText("Elevator Controller Board")).toBeInTheDocument();
  });

  it("should render the product SKU", () => {
    render(<QuotationItem {...baseProps} />);
    expect(screen.getByText(/ITEM-SKU-001/)).toBeInTheDocument();
  });

  it("should render the unit price", () => {
    render(<QuotationItem {...baseProps} />);
    expect(screen.getByText(/\$249\.99/)).toBeInTheDocument();
  });

  it("should render the subtotal (price × quantity)", () => {
    render(<QuotationItem {...baseProps} />);
    // 249.99 * 2 = 499.98
    expect(screen.getByText(/\$499\.98/)).toBeInTheDocument();
  });

  it("should render the current quantity", () => {
    render(<QuotationItem {...baseProps} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should call onQuantityChange with increased quantity when + is clicked", () => {
    const onQuantityChange = vi.fn();
    render(
      <QuotationItem {...baseProps} onQuantityChange={onQuantityChange} />
    );
    const plusButton = screen.getByRole("button", { name: /增加|plus|\+/i });
    fireEvent.click(plusButton);
    expect(onQuantityChange).toHaveBeenCalledWith("ITEM-SKU-001", 3);
  });

  it("should call onQuantityChange with decreased quantity when - is clicked", () => {
    const onQuantityChange = vi.fn();
    render(
      <QuotationItem {...baseProps} onQuantityChange={onQuantityChange} />
    );
    const minusButton = screen.getByRole("button", { name: /减少|minus|-/i });
    fireEvent.click(minusButton);
    expect(onQuantityChange).toHaveBeenCalledWith("ITEM-SKU-001", 1);
  });

  it("should call onRemove when delete button is clicked", () => {
    const onRemove = vi.fn();
    render(<QuotationItem {...baseProps} onRemove={onRemove} />);
    const deleteButton = screen.getByRole("button", { name: /删除|移除|remove|delete/i });
    fireEvent.click(deleteButton);
    expect(onRemove).toHaveBeenCalledWith("ITEM-SKU-001");
  });

  it("should call onNoteChange when note input changes", () => {
    const onNoteChange = vi.fn();
    render(<QuotationItem {...baseProps} onNoteChange={onNoteChange} />);
    const noteInput = screen.getByPlaceholderText(/备注|note/i);
    fireEvent.change(noteInput, { target: { value: "Rush order" } });
    expect(onNoteChange).toHaveBeenCalledWith("ITEM-SKU-001", "Rush order");
  });

  it("should display the note text when provided", () => {
    render(<QuotationItem {...baseProps} note="Express delivery" />);
    expect(screen.getByText(/Express delivery/)).toBeInTheDocument();
  });

  it("should disable minus button when quantity is 1", () => {
    render(<QuotationItem {...baseProps} quantity={1} />);
    const minusButton = screen.getByRole("button", { name: /减少|minus|-/i });
    expect(minusButton).toBeDisabled();
  });
});
