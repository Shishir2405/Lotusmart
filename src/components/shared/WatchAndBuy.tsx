"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiPlayFill,
  RiShoppingBag3Line,
} from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import { PolicyEmptyState } from "./PolicyEmptyState";
import { ReelPlayerModal, type Reel, type ReelsResponse } from "./ReelPlayerModal";

const PAGE_SIZE = 12;

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

interface ReelCardProps {
  reel: Reel;
  onOpen: () => void;
  className?: string;
}

/**
 * A single 9:16 reel tile. The thumbnail is always painted underneath, so the
 * card is never blank while the video loads. The video source is only attached
 * once the tile becomes active (hover on pointer devices, in-view on touch),
 * which keeps a row of tiles from downloading every clip at once.
 */
export function ReelCard({ reel, onOpen, className }: ReelCardProps) {
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const thumbnail = normalizeImageUrl(reel.thumbnailUrl);
  const productCount = reel.products?.length ?? 0;

  const activate = useCallback(() => {
    if (prefersReducedMotion) return;
    setArmed(true);
    setActive(true);
  }, [prefersReducedMotion]);

  const deactivate = useCallback(() => setActive(false), []);

  /* Touch / coarse-pointer devices have no hover, so play whatever tile the
     user has scrolled into view instead. */
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (window.matchMedia("(hover: hover)").matches) return;

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          setArmed(true);
          setActive(true);
        } else {
          setActive(false);
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  /* Drive playback off `active`. Runs after the src has been committed.
     `playing` is tracked from the element's own events rather than from here,
     so the poster only uncovers once real frames are on screen. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active && !prefersReducedMotion) {
      video.muted = true;
      video.play().catch(() => {});
      return;
    }

    video.pause();
    if (video.currentTime > 0) video.currentTime = 0;
  }, [active, armed, prefersReducedMotion]);

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onOpen}
      onMouseEnter={activate}
      onMouseLeave={deactivate}
      onFocus={activate}
      onBlur={deactivate}
      aria-label={`Play reel: ${reel.title}`}
      className={`group relative block cursor-pointer overflow-hidden rounded-2xl bg-[#F7F6F0] text-left transition-shadow duration-300 hover:shadow-[0_18px_50px_rgba(0,0,0,0.16)] ${className ?? ""}`}
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        {/* Poster — always rendered so the tile is never empty */}
        {thumbnail ? (
          // Reel thumbnails may live on any configured CDN; a plain <img> keeps
          // this resilient to hosts not listed in next.config remotePatterns.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={reel.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[0.62rem] font-bold text-neutral-300">
            No Preview
          </div>
        )}

        {/* Video layer fades in only once it is actually playing */}
        <video
          ref={videoRef}
          src={armed ? reel.videoUrl : undefined}
          poster={thumbnail || undefined}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setPlaying(false)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Scrim */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.34) 42%, rgba(0,0,0,0) 72%)",
          }}
        />

        {/* Play affordance */}
        <span
          className="pointer-events-none absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)" }}
        >
          <RiPlayFill size={14} className="text-white" />
        </span>

        {/* Shoppable badge */}
        {productCount > 0 && (
          <span
            className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.55rem] font-black tracking-[0.08em] text-white uppercase"
            style={{ backgroundColor: "#E84672" }}
          >
            <RiShoppingBag3Line size={9} />
            {productCount}
          </span>
        )}

        {/* Title */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-2 text-[0.72rem] leading-snug font-bold text-white">
            {reel.title}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

/* 9:16 tiles sized so a full row shows ~2.2 on phones and 7 on wide desktops.
   Widths are percentages of the scroller so they stay exact inside the
   1400px container. Gap is 0.75rem below `sm` and 1rem from `sm` up. */
const CARD_WIDTH =
  "w-[calc((100%-0.9rem)/2.2)] sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-5rem)/6)] xl:w-[calc((100%-6rem)/7)]";

export function WatchAndBuy() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  /* Client fetch: the section is decorative, so a failed or empty response
     simply renders nothing rather than blocking the landing page. */
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/reels?page=1&limit=${PAGE_SIZE}`, {
          signal: controller.signal,
          // Required by the API middleware for client-side requests, else 403.
          headers: { "X-Requested-With": "LotusWeb" },
        });
        if (!res.ok) return;
        const json: ReelsResponse = await res.json();
        if (!json?.success || !Array.isArray(json.data)) return;
        setReels(json.data.filter((reel) => reel?.videoUrl));
      } catch {
        /* aborted or offline — stay hidden */
      }
    })();

    return () => controller.abort();
  }, []);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(maxScroll > 8 && el.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows, reels.length]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // Nothing to show — render no heading, no empty shell.
  if (reels.length === 0) return null;

  const arrowBase =
    "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-700 shadow-[0_10px_34px_rgba(0,0,0,0.14)] transition-all duration-200 hover:scale-105 hover:text-neutral-900 md:flex";

  return (
    <section className="py-16 lg:py-24" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease }}
          className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
              <span
                className="text-[0.62rem] font-black tracking-[0.22em] uppercase"
                style={{ color: "#B8AE86" }}
              >
                Shop the Look
              </span>
            </div>
            <h2 className="text-[clamp(1.9rem,3.5vw,2.8rem)] leading-tight font-black tracking-[-0.03em] text-neutral-900">
              Watch &amp; <span style={{ color: "#E84672" }}>Buy</span>
            </h2>
          </div>

          <Link href="/reels">
            <motion.span
              whileHover={prefersReducedMotion ? undefined : { x: 4 }}
              transition={{ duration: 0.15 }}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold"
              style={{ color: "#E84672" }}
            >
              View all <RiArrowRightLine size={15} />
            </motion.span>
          </Link>
        </motion.div>

        {/* Row */}
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous reels"
            className={`${arrowBase} left-0 -translate-x-1/2 ${
              canPrev ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ border: "1px solid #EBE8D8" }}
          >
            <RiArrowLeftSLine size={22} />
          </button>

          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next reels"
            className={`${arrowBase} right-0 translate-x-1/2 ${
              canNext ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ border: "1px solid #EBE8D8" }}
          >
            <RiArrowRightSLine size={22} />
          </button>

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 sm:gap-4 md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reels.map((reel, i) => (
              <ReelCard
                key={reel._id}
                reel={reel}
                onOpen={() => setOpenIndex(i)}
                className={`shrink-0 snap-start ${CARD_WIDTH}`}
              />
            ))}
          </div>
        </div>
      </div>

      <ReelPlayerModal
        reels={reels}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery — the dedicated /reels page body                            */
/* ------------------------------------------------------------------ */

/**
 * Paginated masonry gallery. Lives here (rather than in the route file) so
 * `app/(public)/reels/page.tsx` can stay a server component and export
 * Next.js metadata.
 */
export function ReelsGallery() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const loadPage = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/reels?page=${nextPage}&limit=${PAGE_SIZE}`, {
        // Required by the API middleware for client-side requests, else 403.
        headers: { "X-Requested-With": "LotusWeb" },
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json: ReelsResponse = await res.json();
      if (!json?.success || !Array.isArray(json.data)) throw new Error("Bad payload");

      const incoming = json.data.filter((reel) => reel?.videoUrl);
      setReels((prev) => {
        // Guard against duplicates if a page is re-requested.
        const seen = new Set(prev.map((r) => r._id));
        return [...prev, ...incoming.filter((r) => !seen.has(r._id))];
      });
      setPage(json.pagination?.page ?? nextPage);
      setTotalPages(json.pagination?.totalPages ?? nextPage);
    } catch {
      setTotalPages((prev) => Math.min(prev, nextPage));
      // Distinguish a network/server failure from a genuinely empty catalog so
      // we can offer a retry instead of a misleading "no reels" message.
      setError(true);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const hasMore = ready && page < totalPages;

  return (
    <section className="py-14 lg:py-20" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
              <span
                className="text-[0.62rem] font-black tracking-[0.22em] uppercase"
                style={{ color: "#B8AE86" }}
              >
                Shop the Look
              </span>
            </div>
            <h1 className="text-[clamp(1.9rem,3.5vw,2.8rem)] leading-tight font-black tracking-[-0.03em] text-neutral-900">
              Watch &amp; <span style={{ color: "#E84672" }}>Buy</span>
            </h1>
          </div>

          <p
            className="max-w-xs text-[0.82rem] leading-[1.85] font-medium"
            style={{ color: "#a8a29e" }}
          >
            Short recipes, unboxings and kitchen tips — tap any clip to shop the
            exact products used in it.
          </p>
        </div>

        {/* Initial skeleton */}
        {!ready && (
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="mb-3 break-inside-avoid sm:mb-4">
                {/* `.skeleton` is not defined in globals.css, so the tint and
                    pulse are set explicitly here. */}
                <Skeleton
                  className="aspect-[9/16] w-full animate-pulse bg-[#F0EEE6]"
                  rounded="xl"
                />
              </div>
            ))}
          </div>
        )}

        {/* Error — only when the fetch actually failed, distinct from empty */}
        {ready && reels.length === 0 && error && (
          <div
            className="flex flex-col items-center gap-4 rounded-3xl bg-white px-6 py-12 text-center"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <p className="text-[0.95rem] font-bold text-neutral-800">
              We couldn&apos;t load the reels
            </p>
            <p className="max-w-sm text-[0.82rem] font-medium" style={{ color: "#a8a29e" }}>
              Something went wrong while fetching. Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => loadPage(1)}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3 text-[0.85rem] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#E84672" }}
            >
              {loading ? "Retrying…" : "Try again"}
            </button>
          </div>
        )}

        {/* Empty — a successful response that genuinely returned no reels */}
        {ready && reels.length === 0 && !error && (
          <div
            className="rounded-3xl bg-white px-6 py-10"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <PolicyEmptyState pageLabel="Watch & Buy" />
          </div>
        )}

        {/* Masonry */}
        {reels.length > 0 && (
          <>
            <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5">
              {reels.map((reel, i) => (
                <div key={reel._id} className="mb-3 break-inside-avoid sm:mb-4">
                  <ReelCard
                    reel={reel}
                    onOpen={() => setOpenIndex(i)}
                    className="w-full"
                  />
                  <p className="mt-2 line-clamp-2 px-0.5 text-[0.74rem] leading-snug font-bold text-neutral-700">
                    {reel.title}
                  </p>
                  {reel.caption && (
                    <p
                      className="mt-0.5 line-clamp-2 px-0.5 text-[0.68rem] leading-relaxed font-medium"
                      style={{ color: "#a8a29e" }}
                    >
                      {reel.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => loadPage(page + 1)}
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3 text-[0.85rem] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "#E84672" }}
                >
                  {loading ? "Loading…" : "Load more reels"}
                  {!loading && <RiArrowRightLine size={15} />}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ReelPlayerModal
        reels={reels}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </section>
  );
}
