"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    // Hydrate auth state from cookie on first load
    fetchMe().finally(() => setHydrated(true));
  }, [fetchMe, setHydrated]);

  return <>{children}</>;
}
