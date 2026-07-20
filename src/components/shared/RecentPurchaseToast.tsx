"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RiCloseLine, RiShoppingBag3Line } from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";

interface RecentPurchase {
  firstName: string;
  city: string;
  productName: string;
  productSlug: string;
  productId: string;
  productImage: string | null;
  minutesAgo: number;
}

const DISMISS_KEY = "lm:recent-purchase-toast:dismissed";

/** Wait before the very first toast so it doesn't fight the hero for attention. */
const FIRST_DELAY_MS = 8000;
/** How long a single toast stays on screen. */
const SHOW_MS = 5000;
/** Gap between toasts, randomised in this range so the cadence feels organic. */
const HIDE_MIN_MS = 15000;
const HIDE_MAX_MS = 25000;

// Routes where the toast is suppressed: the whole admin surface, and checkout —
// nobody needs a distraction mid-payment.
const BLOCKED_PREFIXES = ["/admin", "/admin-login", "/checkout"];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function formatAgo(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function RecentPurchaseToast() {
  const pathname = usePathname();

  const [entries, setEntries] = useState<RecentPurchase[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until sessionStorage is read
  const [reducedMotion, setReducedMotion] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blocked = useMemo(
    () => BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
    [pathname],
  );

  // Session-scoped dismissal + reduced-motion preference.
  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // Private mode / storage disabled — just show it.
      setDismissed(false);
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Fetch once on mount. Any failure leaves `entries` empty and the component
  // renders nothing at all — no skeleton, no placeholder.
  useEffect(() => {
    if (dismissed || blocked) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/orders/recent", {
          // Required by the API middleware for client-side requests, else 403.
          headers: { "X-Requested-With": "LotusApp" },
        });
        if (!res.ok) return;
        const json: unknown = await res.json();
        if (cancelled) return;

        if (
          typeof json === "object" &&
          json !== null &&
          (json as { success?: boolean }).success === true &&
          Array.isArray((json as { data?: unknown }).data)
        ) {
          const data = (json as { data: RecentPurchase[] }).data.filter(
            (e) => e && e.productName && e.productId,
          );
          setEntries(data);
        }
      } catch {
        // Silently give up — social proof is never worth an error surface.
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally fetch only once the gates are clear; `blocked` flipping
    // mid-session (e.g. navigating off /checkout) should trigger the fetch.
  }, [dismissed, blocked]);

  // Show / hide cycle, looping the list.
  useEffect(() => {
    if (dismissed || blocked || entries.length === 0) {
      setVisible(false);
      return;
    }

    let cancelled = false;

    const schedule = (fn: () => void, ms: number) => {
      timerRef.current = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const cycle = () => {
      setImgFailed(false);
      setVisible(true);
      schedule(() => {
        setVisible(false);
        const gap = HIDE_MIN_MS + Math.random() * (HIDE_MAX_MS - HIDE_MIN_MS);
        schedule(() => {
          setIndex((i) => (i + 1) % entries.length);
          cycle();
        }, gap);
      }, SHOW_MS);
    };

    schedule(cycle, FIRST_DELAY_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismissed, blocked, entries.length]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Non-fatal: dismissal just won't survive a reload.
    }
  }, []);

  if (dismissed || blocked || entries.length === 0) return null;

  const entry = entries[index];
  if (!entry) return null;

  const imageSrc = normalizeImageUrl(entry.productImage);
  const href = `/products/${entry.productId}`;

  // Reduced motion: appear/disappear on opacity only, no travel.
  const variants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
      }
    : {
        hidden: { opacity: 0, x: -24, y: 8 },
        show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.45, ease } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease } },
      };

  return (
    // Fixed + pointer-events-none: never shifts layout, never eats clicks on the
    // page behind it. z-40 keeps it above page content but below modals (z-50).
    // Bottom offset clears the mobile bottom nav.
    <div className="pointer-events-none fixed bottom-20 left-3 z-40 lg:bottom-6 lg:left-6">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={`${entry.productId}-${index}`}
            variants={variants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="pointer-events-auto relative w-[19rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            role="status"
            aria-live="polite"
          >
            <Link href={href} className="group flex items-center gap-3 p-3 pr-9">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F7F6F0]">
                {imageSrc && !imgFailed ? (
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-300">
                    <RiShoppingBag3Line size={20} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="mb-0.5 text-[0.58rem] font-black tracking-[0.16em] uppercase"
                  style={{ color: "#B8AE86" }}
                >
                  Recently Bought
                </p>
                <p className="truncate text-[0.82rem] leading-snug font-bold text-neutral-900">
                  {entry.productName}
                </p>
                <p className="mt-0.5 truncate text-[0.72rem] text-neutral-500">
                  <span className="font-semibold text-neutral-700">
                    {entry.firstName}
                  </span>{" "}
                  from {entry.city} &middot; {formatAgo(entry.minutesAgo)}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss recent purchase notification"
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <RiCloseLine size={15} />
            </button>

            <span
              className="absolute inset-x-0 bottom-0 h-[3px]"
              style={{ backgroundColor: "#E84672" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
