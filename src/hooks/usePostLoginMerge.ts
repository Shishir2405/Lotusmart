

import { useCallback } from "react";
import axios from "axios";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { getDeviceId } from "@/utils/device-id";
import type { CartItem } from "@/store/cart.store";
import type { WishlistItem } from "@/store/wishlist.store";

export function usePostLoginMerge() {
  const cartItems = useCartStore((s) => s.items);
  const mergeServerCart = useCartStore((s) => s.mergeServerCart);

  const wishlistItems = useWishlistStore((s) => s.items);
  const mergeServerWishlist = useWishlistStore((s) => s.mergeServerWishlist);

  const runMerge = useCallback(async () => {
    const deviceId = getDeviceId();

    try {
      
      const cartRes = await axios.post<{ data: { items: CartItem[] } }>("/api/cart/merge", {
        localItems: cartItems,
        deviceId: deviceId || undefined,
      });
      if (cartRes.data?.data?.items) {
        mergeServerCart(cartRes.data.data.items);
      }
    } catch {
      
    }

    try {
      
      const wlRes = await axios.post<{ data: { items: WishlistItem[] } }>(
        "/api/wishlist/merge",
        {
          localItems: wishlistItems,
          deviceId: deviceId || undefined,
        },
      );
      if (wlRes.data?.data?.items) {
        mergeServerWishlist(wlRes.data.data.items);
      }
    } catch {
      
    }
  }, [cartItems, wishlistItems, mergeServerCart, mergeServerWishlist]);

  return { runMerge };
}
