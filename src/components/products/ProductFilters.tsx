"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";

export interface ProductFilterValues {
  search: string;
  category: string;
  brand: string;
}

interface ProductFiltersProps {
  onFilterChange?: (filters: ProductFilterValues) => void;
  initialFilters?: Partial<ProductFilterValues>;
}

export default function ProductFilters({
  onFilterChange,
  initialFilters,
}: ProductFiltersProps) {
  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const [category, setCategory] = useState(initialFilters?.category ?? "");
  const [brand, setBrand] = useState(initialFilters?.brand ?? "");

  const emitChange = (overrides: Partial<ProductFilterValues>) => {
    onFilterChange?.({
      search: overrides.search ?? search,
      category: overrides.category ?? category,
      brand: overrides.brand ?? brand,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    emitChange({ search: value });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    emitChange({ category: value });
  };

  const handleBrandChange = (value: string) => {
    setBrand(value);
    emitChange({ brand: value });
  };

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    onFilterChange?.({ search: "", category: "", brand: "" });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索产品名称或 SKU…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category select */}
      <select
        aria-label="分类"
        value={category}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">全部分类</option>
        <option value="electrical-wholesaler">Electrical Wholesaler</option>
        <option value="lift-equipment">Lift Equipment</option>
      </select>

      {/* Brand select */}
      <select
        aria-label="品牌"
        value={brand}
        onChange={(e) => handleBrandChange(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">全部品牌</option>
        <option value="siemens">Siemens</option>
        <option value="otis">Otis</option>
      </select>

      {/* Reset button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        aria-label="重置"
      >
        <RotateCcw className="mr-1 h-3.5 w-3.5" />
        重置
      </Button>
    </div>
  );
}
