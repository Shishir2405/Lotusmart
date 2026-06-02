"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  RiArrowRightLine,
  RiLeafLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";

const slides = [
  {
    id: 0,
    tag: "Farm to Kitchen",
    headline: ["Pure Spices,", "Authentic Flavours"],
    subtext:
      "Handpicked from trusted farms across India. No additives, no compromises, just authentic flavour.",
    cta: { label: "Shop Spices", href: "/categories/spices" },
    secondaryCta: { label: "Explore All", href: "/products" },
    image: "/images/hero/spices-hero.jpg",
    accentColor: "#E84672",
    bgFrom: "#FFF9E8",
    bgTo: "#FFE8C8",
    highlight: "4.9 Rating",
  },
  {
    id: 1,
    tag: "Direct Sourced",
    headline: ["Premium Dry", "Fruits & Nuts"],
    subtext:
      "Rich in nutrition and taste, sourced from leading regions including Afghanistan, Kashmir, and California.",
    cta: { label: "Explore Nuts", href: "/categories/dry-fruits" },
    secondaryCta: { label: "View Bundles", href: "/bundles" },
    image: "/images/hero/dryfruits-hero.jpg",
    accentColor: "#7A6E42",
    bgFrom: "#F7F6F0",
    bgTo: "#EBE8D8",
    highlight: "200+ Varieties",
  },
  {
    id: 2,
    tag: "Gifting Collection",
    headline: ["Thoughtful Gift", "Boxes & Hampers"],
    subtext:
      "Curated gift boxes for weddings, festivals, and corporate occasions, beautifully packed and ready to send.",
    cta: { label: "Shop Gift Boxes", href: "/categories/gift-boxes" },
    secondaryCta: { label: "Customize Box", href: "/customize" },
    image: "/images/hero/gifts-hero.jpg",
    accentColor: "#E84672",
    bgFrom: "#FFF1F3",
    bgTo: "#FFE0E6",
    highlight: "Starts at Rs 799",
  },
];

const trustItems = [
  { icon: RiLeafLine, label: "100% Natural" },
  { icon: RiShieldCheckLine, label: "FSSAI Certified" },
  { icon: RiTruckLine, label: "Free Shipping Rs 500+" },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const exitEase: [number, number, number, number] = [0.55, 0, 1, 0.45];

const textContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.075, delayChildren: 0.1 } } };
const textItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
// Full-banner slide: the image slides + subtly zooms between slides.
const imageVariant: Variants = {
  enter: { opacity: 0, x: 60, scale: 1.06 },
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.8, ease } },
  exit: { opacity: 0, x: -60, scale: 1.06, transition: { duration: 0.55, ease: exitEase } },
};

type ColorScheme = "amber" | "olive" | "rose" | "emerald" | "sky";

interface HeroBannerSlide {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  colorScheme?: ColorScheme;
}

interface HeroSectionProps {
  settings?: {
    slides?: HeroBannerSlide[];
    [key: string]: unknown;
  };
}

const COLOR_PALETTE: Record<
  ColorScheme,
  { accentColor: string; bgFrom: string; bgTo: string }
> = {
  amber:   { accentColor: "#E84672", bgFrom: "#FFF9E8", bgTo: "#FFE8C8" },
  olive:   { accentColor: "#7A6E42", bgFrom: "#F7F6F0", bgTo: "#EBE8D8" },
  rose:    { accentColor: "#E84672", bgFrom: "#FFF1F3", bgTo: "#FFE0E6" },
  emerald: { accentColor: "#16A34A", bgFrom: "#F0FDF4", bgTo: "#DCFCE7" },
  sky:     { accentColor: "#2563EB", bgFrom: "#EFF6FF", bgTo: "#DBEAFE" },
};

const SCHEME_ROTATION: ColorScheme[] = ["amber", "olive", "rose", "emerald", "sky"];

function mapAPISlides(apiSlides: HeroBannerSlide[]) {
  return apiSlides.map((s, i) => {
    const scheme = s.colorScheme ?? SCHEME_ROTATION[i % SCHEME_ROTATION.length];
    const colors = COLOR_PALETTE[scheme];
    const titleParts = s.title ? s.title.split("\n") : ["Welcome"];
    return {
      id: i,
      tag: "",
      headline: titleParts.length > 1 ? titleParts : [titleParts[0], ""],
      subtext: s.subtitle || "",
      cta: { label: s.ctaText || "Shop Now", href: s.ctaLink || "/products" },
      secondaryCta: { label: "Explore All", href: "/products" },
      image: normalizeImageUrl(s.image) || "/images/hero/spices-hero.jpg",
      accentColor: colors.accentColor,
      bgFrom: colors.bgFrom,
      bgTo: colors.bgTo,
      highlight: "",
    };
  });
}

export function HeroSection({ settings }: HeroSectionProps = {}) {
  const activeSlides =
    settings?.slides && settings.slides.length > 0
      ? mapAPISlides(settings.slides)
      : slides;

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const slide = activeSlides[current];

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % activeSlides.length), 5500);
  };

  useEffect(() => {
    if (!isPaused) startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const raf = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / 5500) * 100, 100));
    }, 16);
    return () => clearInterval(raf);
  }, [current]);

  const goTo = (i: number) => {
    setCurrent(i);
    startInterval();
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-neutral-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 16:9 full-width banner stage — height capped so the section stays
          compact and the Categories grid below it shows above the fold. */}
      <div
        className="group relative w-full"
        style={{ aspectRatio: "16 / 9", maxHeight: "min(70vh, 600px)" }}
      >
        {/* Fallback tint while the image loads */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)` }}
        />

        {/* Sliding banner images (whole banner, uncropped 16:9), with hover zoom */}
        <AnimatePresence>
          <motion.div
            key={`img-${current}`}
            variants={imageVariant}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            <Image
              src={normalizeImageUrl(slide.image)}
              alt={slide.headline.join(" ")}
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Legibility scrims — stronger on the left where the copy sits */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 38%, rgba(0,0,0,0.06) 64%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.42), transparent)" }}
        />

        {/* Overlaid copy */}
        <div className="absolute inset-0 z-10">
          <div className="mx-auto flex h-full w-full max-w-[1400px] items-center px-6 md:px-8 lg:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${current}`}
                variants={textContainer}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="max-w-xl"
              >
                {slide.tag && (
                  <motion.div variants={textItem} className="mb-3 sm:mb-4">
                    <span
                      style={{ color: slide.accentColor }}
                      className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-[0.62rem] font-black tracking-[0.12em] uppercase backdrop-blur-md sm:text-[0.68rem]"
                    >
                      {slide.tag}
                    </span>
                  </motion.div>
                )}

                <div className="mb-4 sm:mb-5">
                  {slide.headline.map((line, i) =>
                    line ? (
                      <div key={i} className="overflow-hidden">
                        <motion.h1
                          variants={textItem}
                          className="font-black tracking-[-0.02em]"
                          style={{
                            fontSize: "clamp(1.7rem, 5vw, 4rem)",
                            lineHeight: 1.08,
                            color: i === 1 ? slide.accentColor : "#ffffff",
                            textShadow: "0 2px 18px rgba(0,0,0,0.35)",
                          }}
                        >
                          {line}
                        </motion.h1>
                      </div>
                    ) : null,
                  )}
                </div>

                {slide.subtext && (
                  <motion.p
                    variants={textItem}
                    className="mb-6 hidden max-w-md text-[0.95rem] leading-relaxed text-white/85 sm:block"
                    style={{ textShadow: "0 1px 10px rgba(0,0,0,0.35)" }}
                  >
                    {slide.subtext}
                  </motion.p>
                )}

                {slide.highlight && (
                  <motion.div variants={textItem} className="mb-6 hidden sm:block">
                    <span className="inline-flex rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[0.72rem] font-bold text-white backdrop-blur-md">
                      {slide.highlight}
                    </span>
                  </motion.div>
                )}

                <motion.div variants={textItem} className="flex flex-wrap items-center gap-3">
                  <Link href={slide.cta.href}>
                    <motion.span
                      whileHover={{ y: -2, boxShadow: "0 14px 30px rgba(0,0,0,0.28)" }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl px-5 py-3 text-[0.88rem] font-bold text-white select-none sm:px-6"
                      style={{ backgroundColor: slide.accentColor }}
                    >
                      {slide.cta.label}
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="inline-flex"
                      >
                        <RiArrowRightLine size={16} />
                      </motion.span>
                    </motion.span>
                  </Link>
                  <Link href={slide.secondaryCta.href}>
                    <motion.span
                      whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.28)" }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex cursor-pointer items-center rounded-xl border border-white/35 bg-white/15 px-5 py-3 text-[0.88rem] font-bold text-white backdrop-blur-md select-none sm:px-6"
                    >
                      {slide.secondaryCta.label}
                    </motion.span>
                  </Link>
                </motion.div>

                <motion.div
                  variants={textItem}
                  className="mt-7 hidden flex-wrap items-center gap-x-5 gap-y-2 sm:flex"
                >
                  {trustItems.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 text-[0.78rem] font-semibold text-white/90"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                        <Icon size={12} style={{ color: "#fff" }} />
                      </span>
                      {label}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute inset-x-0 bottom-4 z-20 lg:bottom-6">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 md:px-8 lg:px-12">
            <div className="flex items-center gap-2.5">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="relative h-1 cursor-pointer overflow-hidden rounded-full border-0 p-0 transition-all"
                  style={{
                    width: i === current ? "2.5rem" : "0.5rem",
                    backgroundColor: i === current ? "transparent" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {i === current && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-white/30" />
                      <motion.span
                        className="absolute top-0 bottom-0 left-0 rounded-full bg-white"
                        style={{ width: `${progress}%` }}
                      />
                    </>
                  )}
                </button>
              ))}
              <span className="ml-1 hidden text-[0.66rem] font-bold tracking-[0.05em] text-white/70 tabular-nums sm:inline">
                {String(current + 1).padStart(2, "0")} / {String(activeSlides.length).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goTo((current - 1 + activeSlides.length) % activeSlides.length)}
                aria-label="Previous slide"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md"
              >
                <RiArrowLeftSLine size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goTo((current + 1) % activeSlides.length)}
                aria-label="Next slide"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 text-white"
                style={{ backgroundColor: slide.accentColor }}
              >
                <RiArrowRightSLine size={18} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
