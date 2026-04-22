

import { useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { usePostLoginMerge } from "@/hooks/usePostLoginMerge";
import toast from "@/components/ui/toast";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();
  const { runMerge } = usePostLoginMerge();
  const router = useRouter();

  const login = useCallback(
    async (payload: LoginPayload, redirectTo = "/") => {
      setLoading(true);
      try {
        const res = await axios.post<{ data: { user: Parameters<typeof setUser>[0] } }>(
          "/api/auth/login",
          payload,
        );
        const loggedInUser = res.data.data.user;
        setUser(loggedInUser);

        
        await runMerge();

        toast.success(`Welcome back, ${loggedInUser?.name?.split(" ")[0]}!`);
        router.push(redirectTo);
      } catch (err) {
        const msg =
          axios.isAxiosError(err)
            ? err.response?.data?.message ?? "Login failed"
            : "Login failed";
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, runMerge, router],
  );

  const register = useCallback(
    async (payload: RegisterPayload, redirectTo = "/") => {
      setLoading(true);
      try {
        const res = await axios.post<{
          data: { user: Parameters<typeof setUser>[0] & { profileComplete?: boolean } };
        }>("/api/auth/register", payload);
        const newUser = res.data.data.user;
        setUser(newUser);

        await runMerge();

        toast.success(`Account created! Welcome to LotusMart 🌸`);
        const needsProfile = newUser && newUser.profileComplete === false;
        if (needsProfile) {
          router.push(`/complete-profile?callbackUrl=${encodeURIComponent(redirectTo)}`);
        } else {
          router.push(redirectTo);
        }
      } catch (err) {
        const msg =
          axios.isAxiosError(err)
            ? err.response?.data?.message ?? "Registration failed"
            : "Registration failed";
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, runMerge, router],
  );

  const logout = useCallback(async () => {
    await storeLogout();
    toast.success("Logged out successfully");
    router.push("/");
  }, [storeLogout, router]);

  return { user, isLoading, isAuthenticated: !!user, login, register, logout };
}
