"use client";

import "@/lib/axios-globals";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

const PROFILE_COMPLETE_SKIP_PATTERNS: RegExp[] = [
  /^\/complete-profile(\/|$)/,
  /^\/login(\/|$)/,
  /^\/register(\/|$)/,
  /^\/forgot-password(\/|$)/,
  /^\/reset-password(\/|$)/,
  /^\/verify-email(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/admin-login(\/|$)/,
];

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchMe().finally(() => setHydrated(true));
  }, [fetchMe, setHydrated]);

  useEffect(() => {
    if (!isHydrated || !user || !pathname) return;
    if (user.profileComplete !== false) return;
    if (user.role === "admin") return;
    if (PROFILE_COMPLETE_SKIP_PATTERNS.some((re) => re.test(pathname))) return;
    router.replace(`/complete-profile?callbackUrl=${encodeURIComponent(pathname)}`);
  }, [isHydrated, user, pathname, router]);

  return <>{children}</>;
}
