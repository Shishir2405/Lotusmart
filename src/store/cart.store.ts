/**
 * Cart Store — works for BOTH guests and authenticated users.
 *
 * Guest  → items persisted in localStorage.
 * Logged in → items synced to server; localStorage acts as the source of truth
 *             until the user logs in, at which point we merge via /api/cart/merge.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartVariant {
  name: string;
  value: string;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  variant?: CartVariant;
  stock: number;
  unit: string;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;

  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variant?: CartVariant) => void;
  updateQuantity: (productId: string, quantity: number, variant?: CartVariant) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // Merge server cart into local (used after login)
  mergeServerCart: (serverItems: CartItem[]) => void;

  // Computed helpers (called as functions, not selectors)
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  isInCart: (productId: string, variant?: CartVariant) => boolean;
  getItem: (productId: string, variant?: CartVariant) => CartItem | undefined;
}

function sameVariant(a?: CartVariant, b?: CartVariant): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.name === b.name && a.value === b.value;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && sameVariant(i.variant, newItem.variant),
          );

          if (existing) {
            const newQty = Math.min(existing.quantity + (newItem.quantity ?? 1), newItem.stock);
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && sameVariant(i.variant, newItem.variant)
                  ? { ...i, quantity: newQty }
                  : i,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { ...newItem, quantity: Math.min(newItem.quantity ?? 1, newItem.stock) },
            ],
          };
        });
      },

      removeItem: (productId, variant) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && sameVariant(i.variant, variant)),
          ),
        }));
      },

      updateQuantity: (productId, quantity, variant) => {
        if (quantity <= 0) {
          get().removeItem(productId, variant);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && sameVariant(i.variant, variant)
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i,
          ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: null, discount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, discount }),
      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      mergeServerCart: (serverItems) => {
        set((state) => {
          const merged = [...serverItems];

          for (const local of state.items) {
            const exists = merged.find(
              (s) => s.productId === local.productId && sameVariant(s.variant, local.variant),
            );
            if (!exists) {
              merged.push(local);
            } else {
              // Take the higher quantity (capped at stock)
              exists.quantity = Math.min(
                Math.max(exists.quantity, local.quantity),
                local.stock,
              );
            }
          }

          return { items: merged };
        });
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return Math.max(0, subtotal - get().discount);
      },

      isInCart: (productId, variant) =>
        get().items.some(
          (i) => i.productId === productId && sameVariant(i.variant, variant),
        ),

      getItem: (productId, variant) =>
        get().items.find(
          (i) => i.productId === productId && sameVariant(i.variant, variant),
        ),
    }),
    {
      name: "lotusmart-cart",
      version: 1,
    },
  ),
);
