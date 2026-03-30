/**
 * Auth Store
 * Tracks the currently logged-in user client-side.
 * On login/register success → triggers cart + wishlist merge.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  permissions?: string[]; // RBAC permissions - undefined means super admin (all access)
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (v: boolean) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (isHydrated) => set({ isHydrated }),

      logout: async () => {
        await axios.post("/api/auth/logout").catch(() => null);
        set({ user: null });
        // Clear persisted cart + wishlist on logout
        localStorage.removeItem("lotusmart-cart");
        localStorage.removeItem("lotusmart-wishlist");
      },

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const res = await axios.get<{ data: { user: AuthUser } }>("/api/auth/me");
          set({ user: res.data.data.user });
        } catch {
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "lotusmart-auth",
      version: 1,
      // Only persist the user object, not loading states
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
