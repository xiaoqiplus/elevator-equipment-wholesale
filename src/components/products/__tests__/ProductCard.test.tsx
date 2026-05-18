import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "../ProductCard";

/**
 * ProductCard component tests.
 *
 * Stub returns null → all rendering tests will fail until implementation.
 * This is expected test-first behavior.
 */

const baseProps = {
  sku: "TEST-SKU-001",
  name: "Test Elevator Part",
  description: "A reliable elevator component",
  price: 129.99,
  images: ["https://placehold.co/600x400?text=Test"],
  specs: { voltage: "24V", material: "Steel" },
};

describe("ProductCard", () => {
  it("should render the product name and SKU", () => {
    render(<ProductCard {...baseProps} />);
    expect(screen.getByText("Test Elevator Part")).toBeInTheDocument();
    expect(screen.getByText(/TEST-SKU-001/)).toBeInTheDocument();
  });

  it("should display price when user is authenticated and approved", () => {
    render(<ProductCard {...baseProps} isAuthenticated={true} />);
    expect(screen.getByText(/\$129\.99/)).toBeInTheDocument();
  });

  it('should show "登录后查看价格" when user is not authenticated', () => {
    render(<ProductCard {...baseProps} isAuthenticated={false} />);
    expect(screen.getByText(/登录后查看价格/)).toBeInTheDocument();
  });

  it('should show "登录后查看价格" by default when isAuthenticated is omitted', () => {
    render(<ProductCard {...baseProps} />);
    expect(screen.getByText(/登录后查看价格/)).toBeInTheDocument();
  });

  it("should render the product image with alt text", () => {
    render(<ProductCard {...baseProps} />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt");
  });

  it("should navigate to product detail page on click", () => {
    // Card contains multiple <Link> elements (image link + login link).
    // At least one should point to the product detail page.
    render(<ProductCard {...baseProps} />);
    const links = screen.getAllByRole("link");
    const productLink = links.find(
      (l) => l.getAttribute("href") === "/products/TEST-SKU-001"
    );
    expect(productLink).toBeTruthy();
  });

  it("should show fallback image when image fails to load", () => {
    render(
      <ProductCard
        {...baseProps}
        images={["https://invalid.example.com/missing.jpg"]}
      />
    );
    const img = screen.getByRole("img");
    fireEvent.error(img);
    // After error, the img src should switch to a fallback placeholder
    expect(img).toHaveAttribute("src");
    expect(img.getAttribute("src")).not.toContain("missing.jpg");
  });

  it("should display product specs (e.g. voltage, material)", () => {
    render(<ProductCard {...baseProps} />);
    expect(screen.getByText(/24V/)).toBeInTheDocument();
    expect(screen.getByText(/Steel/)).toBeInTheDocument();
  });

  it("should handle missing optional fields gracefully", () => {
    render(
      <ProductCard
        sku="MIN-SKU"
        name="Minimal Product"
        price={null}
        images={[]}
      />
    );
    // Should not crash; should still render name
    expect(screen.getByText("Minimal Product")).toBeInTheDocument();
  });

  it("should render an Add to Quotation Cart button when authenticated", () => {
    const onAddToCart = vi.fn();
    render(
      <ProductCard
        {...baseProps}
        isAuthenticated={true}
        onAddToCart={onAddToCart}
      />
    );
    const addButton = screen.getByRole("button", { name: /加入报价车/i });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(onAddToCart).toHaveBeenCalledWith("TEST-SKU-001");
  });
});
