"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { usePostLoginMerge } from "@/hooks/usePostLoginMerge";
import toast from "@/components/ui/toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
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
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptLoadPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
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
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          itp_support: true,
        });
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
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
    <div className="relative w-full">
      <div ref={containerRef} className="w-full" />
      {loadError && (
        <p className="mt-1 text-xs text-red-500">{loadError}</p>
      )}
      {signingIn && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
        </div>
      )}
    </div>
  );
}
