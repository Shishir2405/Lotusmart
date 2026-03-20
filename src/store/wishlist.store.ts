/**
 * Wishlist Store — guest + authenticated.
 * Guest items persist in localStorage; merged into DB on login.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  unit: string;
  isInStock: boolean;
}

interface WishlistState {
  items: WishlistItem[];

  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => boolean; // returns true if added, false if removed
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;

  // Merge server wishlist after login
  mergeServerWishlist: (serverItems: WishlistItem[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (get().isInWishlist(item.productId)) return;
        set((state) => ({ items: [...state.items, item] }));
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
      },

      toggleItem: (item) => {
        if (get().isInWishlist(item.productId)) {
          get().removeItem(item.productId);
          return false;
        }
        get().addItem(item);
        return true;
      },

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (productId) => get().items.some((i) => i.productId === productId),

      mergeServerWishlist: (serverItems) => {
        set((state) => {
          const merged = [...serverItems];
          for (const local of state.items) {
            if (!merged.some((s) => s.productId === local.productId)) {
              merged.push(local);
            }
          }
          return { items: merged };
        });
      },
    }),
    {
      name: "lotusmart-wishlist",
      version: 1,
    },
  ),
);
