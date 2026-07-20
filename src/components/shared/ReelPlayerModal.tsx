"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowRightLine,
  RiCloseLine,
  RiEyeLine,
  RiHeartFill,
  RiHeartLine,
  RiShareForwardLine,
  RiShoppingBag3Line,
} from "react-icons/ri";
import { calculateDiscount, formatCurrency, normalizeImageUrl } from "@/utils/helpers";

/* Shared Watch & Buy types — mirrors the `GET /api/reels` contract. */
export interface ReelProduct {
  _id: string;
  name: string;
  slug: string;
  /** Current selling price — always the one shown prominently. */
  price: number;
  /** Higher "MRP" / was-price; rendered struck through when above `price`. */
  compareAtPrice?: number;
  images: string[];
  stock: number;
}

export interface Reel {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  order: number;
  isActive: boolean;
  views: number;
  /** Total like count. Legacy rows may omit it — treat as 0. */
  likes?: number;
  products: ReelProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface ReelsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReelsResponse {
  success: boolean;
  data: Reel[];
  pagination: ReelsPagination;
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Per-device liked reel ids live here — the like endpoint has no auth. */
const LIKES_STORAGE_KEY = "lotus_reel_likes";

/** 1234 -> "1.2k". No compact formatter exists in utils, so keep a tiny one. */
function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  const m = n / 1_000_000;
  return `${m >= 100 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
}

interface ReelPlayerModalProps {
  reels: Reel[];
  /** Index of the reel to show. `null` keeps the modal closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function ReelPlayerModal({
  reels,
  index,
  onIndexChange,
  onClose,
}: ReelPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  /* Per-device like state (persisted to localStorage) and any server-reconciled
     counts that override the reel's base `likes` after a toggle. */
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const inFlightLikes = useRef<Set<string>>(new Set());
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = index !== null && index >= 0 && index < reels.length;
  const reel = isOpen ? reels[index] : null;

  const goPrev = useCallback(() => {
    if (index === null || reels.length === 0) return;
    onIndexChange((index - 1 + reels.length) % reels.length);
  }, [index, reels.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (index === null || reels.length === 0) return;
    onIndexChange((index + 1) % reels.length);
  }, [index, reels.length, onIndexChange]);

  /* Esc closes, arrows navigate. */
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, goPrev, goNext]);

  /* Lock body scroll while the lightbox is open. */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  /* Play with sound on open. Browsers block unmuted autoplay in some cases
     even after a gesture, so fall back to a muted play rather than a blank
     frame. Reduced-motion users get the poster + native controls instead. */
  useEffect(() => {
    if (!isOpen || prefersReducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    const played = video.play();
    if (played) {
      played.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, [isOpen, index, prefersReducedMotion]);

  /* Hydrate the liked set from localStorage once on mount. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIKES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLikedIds(new Set(parsed.filter((x): x is string => typeof x === "string")));
      }
    } catch {
      /* storage unavailable or corrupt — start with an empty set */
    }
  }, []);

  /* Clear any pending "Copied" reset if the modal unmounts. */
  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  /* Reset the share label when switching between reels. */
  useEffect(() => {
    setShareStatus("idle");
  }, [index]);

  const persistLikes = useCallback((ids: Set<string>) => {
    try {
      window.localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      /* storage full or unavailable — non-fatal, in-memory state still holds */
    }
  }, []);

  const handleLike = useCallback(async () => {
    if (!reel) return;
    const id = reel._id;
    // Guard against a double-fire while a request for this reel is in flight.
    if (inFlightLikes.current.has(id)) return;

    const willLike = !likedIds.has(id);
    const base = likeCounts[id] ?? (reel.likes ?? 0);
    const optimistic = Math.max(0, base + (willLike ? 1 : -1));

    inFlightLikes.current.add(id);

    // Optimistic: flip the heart + adjust the count, and persist immediately.
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (willLike) next.add(id);
      else next.delete(id);
      persistLikes(next);
      return next;
    });
    setLikeCounts((prev) => ({ ...prev, [id]: optimistic }));

    try {
      const res = await fetch(`/api/reels/${id}/like`, {
        method: "POST",
        // X-Requested-With is required by the API middleware, else 403.
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "LotusApp",
        },
        body: JSON.stringify({ liked: willLike }),
      });
      if (!res.ok) throw new Error(`Like failed: ${res.status}`);
      const json = await res.json();
      const serverLikes = json?.data?.likes;
      if (typeof serverLikes === "number") {
        setLikeCounts((prev) => ({ ...prev, [id]: Math.max(0, serverLikes) }));
      }
    } catch {
      // Revert the optimistic toggle + count on failure.
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (willLike) next.delete(id);
        else next.add(id);
        persistLikes(next);
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [id]: base }));
    } finally {
      inFlightLikes.current.delete(id);
    }
  }, [reel, likedIds, likeCounts, persistLikes]);

  const handleShare = useCallback(async () => {
    if (!reel) return;
    const url = `${window.location.origin}/reels`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: reel.title,
          text: reel.caption || reel.title,
          url,
        });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareStatus("copied");
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setShareStatus("idle"), 1800);
      }
    } catch {
      /* user dismissed the share sheet or the API rejected — swallow silently */
    }
  }, [reel]);

  // The lightbox only ever opens from a click, so there is nothing to render
  // (and no portal target) during SSR.
  if (typeof document === "undefined") return null;

  const products = reel?.products ?? [];
  const hasSiblings = reels.length > 1;
  const position = index === null ? 0 : index + 1;

  // Floating tag = the first product; the rest stay reachable in the list below.
  const primaryProduct = products[0];
  const extraProducts = Math.max(0, products.length - 1);
  const primaryImage = normalizeImageUrl(primaryProduct?.images?.[0]);
  const primaryHasDeal =
    !!primaryProduct &&
    typeof primaryProduct.compareAtPrice === "number" &&
    primaryProduct.compareAtPrice > primaryProduct.price;

  const liked = reel ? likedIds.has(reel._id) : false;
  const likeCount = reel ? (likeCounts[reel._id] ?? (reel.likes ?? 0)) : 0;

  const navButton =
    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25";

  return createPortal(
    <AnimatePresence>
      {isOpen && reel && (
      <motion.div
        key="reel-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={reel.title || "Reel player"}
        onClick={onClose}
      >
        {/* Close — moved to top-LEFT so the floating product tag owns the
            top-right corner of the video without overlapping it. */}
        <button
          onClick={onClose}
          aria-label="Close reel"
          className={`absolute top-4 left-4 z-20 ${navButton}`}
        >
          <RiCloseLine size={20} />
        </button>

        {/* Desktop prev / next, overhanging the card */}
        {hasSiblings && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous reel"
              className={`absolute top-1/2 left-4 z-20 hidden -translate-y-1/2 sm:flex ${navButton}`}
            >
              <RiArrowLeftSLine size={22} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next reel"
              className={`absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 sm:flex ${navButton}`}
            >
              <RiArrowRightSLine size={22} />
            </button>
          </>
        )}

        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 16, scale: 0.98 }
          }
          animate={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 12, scale: 0.98 }
          }
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.28, ease }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-[min(86vh,780px)] sm:w-auto sm:flex-row sm:rounded-3xl"
        >
          {/* Video pane */}
          <div className="relative h-[52vh] w-full shrink-0 bg-black sm:h-full sm:w-auto sm:aspect-[9/16]">
            <video
              key={reel._id}
              ref={videoRef}
              src={reel.videoUrl}
              poster={normalizeImageUrl(reel.thumbnailUrl) || undefined}
              controls
              playsInline
              loop
              preload="metadata"
              className="h-full w-full object-contain"
            />

            {/* Floating product tag — pinned to the top-right of the video.
                Renders nothing when the reel has no products. */}
            {primaryProduct && (
              <Link
                href={`/products/${primaryProduct._id}`}
                onClick={onClose}
                aria-label={`Shop ${primaryProduct.name}`}
                className="absolute top-3 right-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-2xl border border-black/5 bg-white/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md transition-transform duration-200 hover:scale-[1.02]"
              >
                {extraProducts > 0 && (
                  <span
                    className="absolute -top-2 -left-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.58rem] font-black text-white shadow-md"
                    style={{ backgroundColor: "#E84672" }}
                  >
                    +{extraProducts}
                  </span>
                )}
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#F7F6F0]">
                  {primaryImage ? (
                    // Reel product images can come from any configured CDN host;
                    // a plain <img> stays resilient to unoptimised sources.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryImage}
                      alt={primaryProduct.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-300">
                      <RiShoppingBag3Line size={16} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-0.5">
                  <p className="truncate text-[0.7rem] leading-tight font-bold text-neutral-900">
                    {primaryProduct.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[0.74rem] font-black text-neutral-900">
                      {formatCurrency(primaryProduct.price)}
                    </span>
                    {primaryHasDeal && (
                      <span className="text-[0.6rem] font-medium text-neutral-400 line-through">
                        {formatCurrency(primaryProduct.compareAtPrice as number)}
                      </span>
                    )}
                  </div>
                </div>
                <RiArrowRightLine size={13} className="shrink-0" style={{ color: "#E84672" }} />
              </Link>
            )}

            {/* Action rail — like + share, kept clear of the native controls. */}
            <div className="absolute right-2.5 bottom-16 z-10 flex flex-col items-center gap-4 sm:bottom-20">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLike}
                  aria-pressed={liked}
                  aria-label={liked ? "Unlike this reel" : "Like this reel"}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/50"
                >
                  <motion.span
                    key={liked ? "liked" : "unliked"}
                    initial={prefersReducedMotion ? false : { scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 520, damping: 16 }}
                    className="flex items-center justify-center"
                  >
                    {liked ? (
                      <RiHeartFill size={20} style={{ color: "#E84672" }} />
                    ) : (
                      <RiHeartLine size={20} />
                    )}
                  </motion.span>
                </button>
                <span
                  className="text-[0.68rem] font-bold text-white tabular-nums"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.65)" }}
                >
                  {formatCount(likeCount)}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share this reel"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/50"
                >
                  <RiShareForwardLine size={19} />
                </button>
                <span
                  className="text-[0.68rem] font-bold text-white"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.65)" }}
                >
                  {shareStatus === "copied" ? "Copied" : "Share"}
                </span>
              </div>
            </div>
          </div>

          {/* Details pane */}
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-5 sm:w-[340px] sm:flex-none sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
              <span
                className="text-[0.58rem] font-black tracking-[0.22em] uppercase"
                style={{ color: "#B8AE86" }}
              >
                Watch &amp; Buy
              </span>
            </div>

            <h2 className="text-[1.15rem] leading-tight font-black tracking-[-0.02em] text-neutral-900">
              {reel.title}
            </h2>

            {reel.caption && (
              <p
                className="mt-2 text-[0.82rem] leading-relaxed font-medium"
                style={{ color: "#a8a29e" }}
              >
                {reel.caption}
              </p>
            )}

            <div className="mt-3 flex items-center gap-4">
              <span
                className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold"
                style={{ color: "#B8AE86" }}
              >
                <RiEyeLine size={12} />
                {(reel.views ?? 0).toLocaleString("en-IN")} views
              </span>
              {hasSiblings && (
                <span
                  className="text-[0.7rem] font-bold tabular-nums"
                  style={{ color: "#C8BF9A" }}
                >
                  {position} / {reels.length}
                </span>
              )}
            </div>

            {/* Mobile prev / next */}
            {hasSiblings && (
              <div className="mt-4 flex items-center gap-2 sm:hidden">
                <button
                  onClick={goPrev}
                  aria-label="Previous reel"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-neutral-500"
                  style={{ border: "1px solid #EBE8D8", backgroundColor: "#FAFAF8" }}
                >
                  <RiArrowLeftSLine size={18} />
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next reel"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-neutral-500"
                  style={{ border: "1px solid #EBE8D8", backgroundColor: "#FAFAF8" }}
                >
                  <RiArrowRightSLine size={18} />
                </button>
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <RiShoppingBag3Line size={13} style={{ color: "#E84672" }} />
                  <span
                    className="text-[0.58rem] font-black tracking-[0.22em] uppercase"
                    style={{ color: "#B8AE86" }}
                  >
                    Shop this reel
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {products.map((product) => {
                    // Same convention as ProductCard: `price` is the live
                    // price, `compareAtPrice` is the struck-through MRP.
                    const hasDeal =
                      typeof product.compareAtPrice === "number" &&
                      product.compareAtPrice > product.price;
                    const discount = calculateDiscount(
                      product.price,
                      product.compareAtPrice,
                    );
                    const image = normalizeImageUrl(product.images?.[0]);
                    const outOfStock = product.stock <= 0;

                    return (
                      <Link
                        key={product._id}
                        href={`/products/${product._id}`}
                        onClick={onClose}
                        className="group flex items-center gap-3 rounded-2xl bg-white p-2.5 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                        style={{ border: "1px solid #EBE8D8" }}
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F7F6F0]">
                          {image ? (
                            // Reel product images can come from any configured CDN host;
                            // a plain <img> keeps this resilient to unoptimised sources.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image}
                              alt={product.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[0.55rem] font-bold text-neutral-300">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[0.78rem] leading-snug font-bold text-neutral-800">
                            {product.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[0.85rem] font-black text-neutral-900">
                              {formatCurrency(product.price)}
                            </span>
                            {hasDeal && (
                              <>
                                <span className="text-[0.7rem] font-medium text-neutral-400 line-through">
                                  {formatCurrency(product.compareAtPrice as number)}
                                </span>
                                {discount > 0 && (
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[0.58rem] font-black text-white"
                                    style={{ backgroundColor: "#E84672" }}
                                  >
                                    -{discount}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {outOfStock && (
                            <span className="mt-1 inline-block text-[0.62rem] font-bold text-neutral-400">
                              Out of stock
                            </span>
                          )}
                        </div>

                        <RiArrowRightLine
                          size={14}
                          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ color: "#E84672" }}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
