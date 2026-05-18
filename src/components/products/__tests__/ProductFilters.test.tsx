import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductFilters from "../ProductFilters";

/**
 * ProductFilters component tests.
 *
 * Stub returns null → all rendering tests will fail until implementation.
 */

describe("ProductFilters", () => {
  it("should render a search input field", () => {
    render(<ProductFilters />);
    const searchInput = screen.getByPlaceholderText(/搜索|search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("should render a category dropdown selector", () => {
    render(<ProductFilters />);
    const categorySelect = screen.getByRole("combobox", { name: /分类|category/i });
    expect(categorySelect).toBeInTheDocument();
  });

  it("should render a brand dropdown selector", () => {
    render(<ProductFilters />);
    const brandSelect = screen.getByRole("combobox", { name: /品牌|brand/i });
    expect(brandSelect).toBeInTheDocument();
  });

  it("should call onFilterChange with search text on input", async () => {
    const onFilterChange = vi.fn();
    render(<ProductFilters onFilterChange={onFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/搜索|search/i);
    await userEvent.type(searchInput, "Siemens");

    // Should fire with the search value (possibly debounced)
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "Siemens" })
    );
  });

  it("should call onFilterChange when a category is selected", async () => {
    const onFilterChange = vi.fn();
    render(<ProductFilters onFilterChange={onFilterChange} />);

    const categorySelect = screen.getByRole("combobox", { name: /分类|category/i });
    await userEvent.selectOptions(categorySelect, "electrical-wholesaler");

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: "electrical-wholesaler" })
    );
  });

  it("should call onFilterChange when a brand is selected", async () => {
    const onFilterChange = vi.fn();
    render(<ProductFilters onFilterChange={onFilterChange} />);

    const brandSelect = screen.getByRole("combobox", { name: /品牌|brand/i });
    await userEvent.selectOptions(brandSelect, "siemens");

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ brand: "siemens" })
    );
  });

  it("should render a reset button to clear all filters", () => {
    render(<ProductFilters />);
    const resetBtn = screen.getByRole("button", { name: /重置|清除|reset/i });
    expect(resetBtn).toBeInTheDocument();
  });

  it("should clear all filters and call onFilterChange when reset is clicked", async () => {
    const onFilterChange = vi.fn();
    render(<ProductFilters onFilterChange={onFilterChange} />);

    const resetBtn = screen.getByRole("button", { name: /重置|清除|reset/i });
    await userEvent.click(resetBtn);

    // Reset triggers with empty/cleared values
    expect(onFilterChange).toHaveBeenCalledWith({
      search: "",
      category: "",
      brand: "",
    });
  });

  it("should update the search input value as user types", async () => {
    render(<ProductFilters />);
    const searchInput = screen.getByPlaceholderText(/搜索|search/i) as HTMLInputElement;

    await userEvent.type(searchInput, "Otis Elevator");

    expect(searchInput.value).toBe("Otis Elevator");
  });

  it("should accept initial filter values via props", () => {
    render(
      <ProductFilters
        initialFilters={{ search: "Siemens", category: "electrical", brand: "otis" }}
      />
    );

    const searchInput = screen.getByPlaceholderText(/搜索|search/i) as HTMLInputElement;
    expect(searchInput.value).toBe("Siemens");
  });
});
