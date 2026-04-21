"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiArrowRightLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface BannerSlide {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface BannerStripProps {
  title?: string;
  subtitle?: string;
  settings?: {
    slides?: BannerSlide[];
    // legacy single-banner shape
    image?: string;
    title?: string;
    subtitle?: string;
    link?: string;
    [key: string]: unknown;
  };
}

function readSlides(settings: BannerStripProps["settings"]): BannerSlide[] {
  if (Array.isArray(settings?.slides) && settings!.slides!.length > 0) {
    return settings!.slides!.filter((s) => s && s.image);
  }
  if (settings?.image) {
    return [
      {
        image: settings.image,
        title: settings.title || "",
        subtitle: settings.subtitle || "",
        ctaText: "",
        ctaLink: settings.link || "",
      },
    ];
  }
  return [];
}

export function BannerStrip({ title, subtitle, settings }: BannerStripProps = {}) {
  const slides = readSlides(settings);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides.length, isPaused]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const goTo = (i: number) => setCurrent((i + slides.length) % slides.length);

  return (
    <section className="py-16 lg:py-24" style={{ backgroundColor: "#FAFAF9" }}>
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease }}
            className="mb-10"
          >
            {title && (
              <h2 className="text-[clamp(1.9rem,3.5vw,2.8rem)] leading-tight font-black tracking-[-0.03em] text-neutral-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
            )}
          </motion.div>
        )}

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative h-[320px] overflow-hidden rounded-3xl md:h-[420px] lg:h-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`slide-${current}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease }}
                className="absolute inset-0"
              >
                <Link
                  href={slide.ctaLink || "/products"}
                  className="group block h-full"
                >
                  <div className="relative h-full w-full overflow-hidden">
                    <Image
                      src={normalizeImageUrl(slide.image)}
                      alt={slide.title || "Promotional banner"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="100vw"
                      priority={current === 0}
                    />

                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(110deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, transparent 75%)",
                      }}
                    />

                    <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-10">
                      {slide.title && (
                        <h3
                          className="mb-2 max-w-2xl leading-[0.95] font-black tracking-[-0.03em] whitespace-pre-line text-white"
                          style={{ fontSize: "clamp(1.8rem, 3.6vw, 3rem)" }}
                        >
                          {slide.title}
                        </h3>
                      )}

                      {slide.subtitle && (
                        <p className="mb-5 max-w-xl text-[0.9rem] leading-relaxed text-white/75">
                          {slide.subtitle}
                        </p>
                      )}

                      {(slide.ctaText || slide.ctaLink) && (
                        <motion.span
                          whileHover={{ x: 4 }}
                          className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[0.85rem] font-black text-neutral-900"
                        >
                          {slide.ctaText || "Explore"}
                          <RiArrowRightLine size={15} />
                        </motion.span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {slides.length > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === current ? "2rem" : "0.5rem",
                      backgroundColor: i === current ? "#E84672" : "#D1D5DB",
                    }}
                  />
                ))}
                <span className="ml-2 text-[0.66rem] font-bold tabular-nums text-neutral-400">
                  {String(current + 1).padStart(2, "0")} /{" "}
                  {String(slides.length).padStart(2, "0")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goTo(current - 1)}
                  aria-label="Previous slide"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:text-[#E84672] transition-colors"
                >
                  <RiArrowLeftSLine size={18} />
                </button>
                <button
                  onClick={() => goTo(current + 1)}
                  aria-label="Next slide"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors"
                  style={{ backgroundColor: "#E84672" }}
                >
                  <RiArrowRightSLine size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
