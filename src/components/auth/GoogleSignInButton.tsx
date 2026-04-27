"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { usePostLoginMerge } from "@/hooks/usePostLoginMerge";
import toast from "@/components/ui/toast";

interface GsiId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: string | number;
    },
  ) => void;
  prompt: () => void;
  cancel: () => void;
  disableAutoSelect: () => void;
}

// window.google is declared globally (typed as any) in LocationPicker.tsx —
// we use a narrow helper instead of redeclaring to avoid TS merge conflicts.
function getGisId(): GsiId | undefined {
  const g = (window as { google?: { accounts?: { id?: GsiId } } }).google;
  return g?.accounts?.id;
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptLoadPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getGisId()) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google script failed to load"));
    document.head.appendChild(s);
  });
  return scriptLoadPromise;
}

interface Props {
  callbackUrl?: string;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export default function GoogleSignInButton({
  callbackUrl = "/",
  text = "continue_with",
}: Props) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { runMerge } = usePostLoginMerge();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      setSigningIn(true);
      try {
        const res = await axios.post<{
          data: {
            user: Parameters<typeof setUser>[0];
            profileComplete: boolean;
            isNew: boolean;
          };
        }>("/api/auth/google", { idToken: response.credential });
        const { user, profileComplete, isNew } = res.data.data;
        setUser(user);
        await runMerge();
        toast.success(
          isNew ? "Welcome to LotusMart!" : `Welcome back, ${user?.name?.split(" ")[0]}!`,
        );
        if (!profileComplete) {
          router.push(`/complete-profile?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else {
          router.push(callbackUrl);
        }
      } catch (err) {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Google sign-in failed"
          : "Google sign-in failed";
        toast.error(msg);
      } finally {
        setSigningIn(false);
      }
    },
    [setUser, runMerge, router, callbackUrl],
  );

  useEffect(() => {
    if (!clientId) {
      setLoadError("Google Sign-In is not configured");
      return;
    }

    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        const gis = getGisId();
        if (cancelled || !gis || !containerRef.current) return;
        gis.initialize({
          client_id: clientId,
          callback: handleCredential,
          itp_support: true,
        });
        containerRef.current.innerHTML = "";
        gis.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "left",
          width: containerRef.current.clientWidth || 360,
        });
      })
      .catch(() => setLoadError("Failed to load Google Sign-In"));

    return () => {
      cancelled = true;
    };
  }, [clientId, handleCredential, text]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Google Sign-In is unavailable. Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
      </div>
    );
  }

  return (
    <div className="group relative w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[1.5px] rounded-2xl opacity-50 blur-[6px] transition-all duration-500 group-hover:opacity-90 group-hover:blur-[8px]"
        style={{
          background:
            "conic-gradient(from 140deg at 50% 50%, #E84672 0deg, #F4A623 110deg, #4285F4 220deg, #34A853 320deg, #E84672 360deg)",
        }}
      />
      <div className="relative rounded-2xl bg-white p-[1.5px] shadow-[0_4px_18px_-6px_rgba(232,70,114,0.25)] transition-shadow duration-300 group-hover:shadow-[0_8px_24px_-6px_rgba(232,70,114,0.35)]">
        <div className="relative overflow-hidden rounded-[14px] bg-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
          <div ref={containerRef} className="relative w-full" />
        </div>
      </div>
      {loadError && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{loadError}</p>
      )}
      {signingIn && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-[#E84672]" />
        </div>
      )}
    </div>
  );
}
