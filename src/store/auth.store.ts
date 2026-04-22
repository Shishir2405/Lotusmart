

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
  profileComplete?: boolean;
  authProvider?: "local" | "google";
  permissions?: string[];
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
      
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
