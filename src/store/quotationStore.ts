import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QuotationItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
}

interface QuotationStore {
  items: QuotationItem[];

  // Actions
  addItem: (product: Omit<QuotationItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearItems: () => void;
  setItemNote: (sku: string, note: string) => void;

  // Getters
  getItemCount: () => number;
  getTotalItems: () => number;
}

const rawStore = create<QuotationStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const { items } = get();
        const existing = items.find((item) => item.sku === product.sku);

        if (existing) {
          set({
            items: items.map((item) =>
              item.sku === product.sku
                ? { ...item, quantity: item.quantity + (product.quantity ?? 1) }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                sku: product.sku,
                name: product.name,
                price: product.price,
                quantity: product.quantity ?? 1,
                note: product.note ?? "",
                image: product.image,
              },
            ],
          });
        }
      },

      removeItem: (sku) => {
        set({ items: get().items.filter((item) => item.sku !== sku) });
      },

      updateQuantity: (sku, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter((item) => item.sku !== sku) });
          return;
        }
        set({
          items: get().items.map((item) =>
            item.sku === sku ? { ...item, quantity } : item
          ),
        });
      },

      clearItems: () => set({ items: [] }),

      setItemNote: (sku, note) => {
        set({
          items: get().items.map((item) =>
            item.sku === sku ? { ...item, note } : item
          ),
        });
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.length;
      },
    }),
    {
      name: "quotation-cart",
    }
  )
);

// zustand v5 persist middleware doesn't expose the `persist` property
// on the store hook. Add it for compatibility.
(rawStore as any).persist = { persist: rawStore };

export const useQuotationStore = rawStore;
