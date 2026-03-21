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
  RiFlashlightLine,
  RiVerifiedBadgeLine,
} from "react-icons/ri";

const slides = [
  {
    id: 0,
    eyebrow: "EST. 2017",
    tag: "Farm to Kitchen",
    headline: ["Pure Spices,", "Authentic Flavours"],
    subtext:
      "Handpicked from the finest farms across India. No additives, no compromises — just the real taste of nature.",
    cta: { label: "Shop Spices", href: "/categories/spices" },
    secondaryCta: { label: "Explore All", href: "/products" },
    image: "/images/hero/spices-hero.jpg",
    accentColor: "#E84672",
    badgeBg: "#FFF1F3",
    badgeText: "#C9305A",
    bgGradient: "linear-gradient(135deg, #FFF9E8 0%, #FFE8C8 100%)",
    pill: { value: "4.9★", label: "Avg Rating" },
    floatCards: [
      { label: "50K+ Orders", sub: "Delivered" },
      { label: "100% Natural", sub: "Certified" },
    ],
    stat: { value: "200+", label: "SKUs" },
  },
  {
    id: 1,
    eyebrow: "PREMIUM GRADE",
    tag: "Direct Sourced",
    headline: ["Premium Dry", "Fruits & Nuts"],
    subtext:
      "Rich in nutrients, rich in taste. Sourced directly from Afghanistan, Kashmir, and California.",
    cta: { label: "Explore Nuts", href: "/categories/dry-fruits" },
    secondaryCta: { label: "View Bundles", href: "/bundles" },
    image: "/images/hero/dryfruits-hero.jpg",
    accentColor: "#7A6E42",
    badgeBg: "#F7F6F0",
    badgeText: "#4D4529",
    bgGradient: "linear-gradient(135deg, #F7F6F0 0%, #EBE8D8 100%)",
    pill: { value: "200+", label: "Varieties" },
    floatCards: [
      { label: "Direct Source", sub: "Farm Fresh" },
      { label: "No Preservatives", sub: "Pure Quality" },
    ],
    stat: { value: "15+", label: "Countries" },
  },
  {
    id: 2,
    eyebrow: "GIFTING SPECIAL",
    tag: "Gifting Collection",
    headline: ["Thoughtful Gift", "Boxes & Hampers"],
    subtext:
      "Curated with love for every occasion — weddings, festivals, corporates, and heartfelt moments.",
    cta: { label: "Shop Gift Boxes", href: "/categories/gift-boxes" },
    secondaryCta: { label: "Customize Box", href: "/customize" },
    image: "/images/hero/gifts-hero.jpg",
    accentColor: "#E84672",
    badgeBg: "#FFF1F3",
    badgeText: "#C9305A",
    bgGradient: "linear-gradient(135deg, #FFF1F3 0%, #FFE0E6 100%)",
    pill: { value: "5K+", label: "Happy Gifters" },
    floatCards: [
      { label: "Custom Branding", sub: "Corporate Orders" },
      { label: "Same Day", sub: "Dispatch" },
    ],
    stat: { value: "₹799", label: "Starts From" },
  },
];

const trustItems = [
  { icon: RiLeafLine, label: "100% Natural" },
  { icon: RiShieldCheckLine, label: "FSSAI Certified" },
  { icon: RiTruckLine, label: "Free Shipping ₹500+" },
];

const tickerItems = [
  "FSSAI Certified",
  "50,000+ Happy Customers",
  "Free Shipping ₹500+",
  "100% Natural",
  "No Preservatives",
  "Premium Grade",
  "Direct Farm Sourced",
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const exitEase: [number, number, number, number] = [0.55, 0, 1, 0.45];

const textContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075 } },
};
const textItem: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(3px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.52, ease } },
};
const imageVariant: Variants = {
  hidden: { opacity: 0, scale: 1.05, x: 36 },
  show: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.72, ease } },
  exit: { opacity: 0, scale: 0.96, x: -36, transition: { duration: 0.38, ease: exitEase } },
};

function FloatCard({
  label,
  sub,
  delay = 0,
  className = "",
}: {
  label: string;
  sub: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease }}
      className={`absolute rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.10)] backdrop-blur-md ${className}`}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, delay, ease: "easeInOut" }}
      >
        <p className="text-[0.78rem] leading-tight font-bold text-neutral-800">{label}</p>
        <p className="mt-0.5 text-[0.67rem] font-medium text-neutral-400">{sub}</p>
      </motion.div>
    </motion.div>
  );
}

function Ticker() {
  return (
    <div
      className="relative overflow-hidden border-b py-2"
      style={{
        borderColor: "rgba(0,0,0,0.07)",
        backgroundColor: "rgba(255,255,255,0.45)",
        backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="flex gap-10 whitespace-nowrap"
      >
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-[0.64rem] font-black tracking-[0.15em] uppercase"
            style={{ color: "#9C8F62" }}
          >
            <span
              className="h-1 w-1 flex-shrink-0 rounded-full"
              style={{ backgroundColor: "#E84672" }}
            />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const slide = slides[current];

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
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
    const raf = setInterval(
      () => setProgress(Math.min(((Date.now() - start) / 5500) * 100, 100)),
      16,
    );
    return () => clearInterval(raf);
  }, [current]);

  const goTo = (i: number) => {
    setCurrent(i);
    startInterval();
  };

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* BG */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="pointer-events-none absolute inset-0"
          style={{ background: slide.bgGradient }}
        />
      </AnimatePresence>
      <div className="pointer-events-none absolute -top-40 -right-40 h-[640px] w-[640px] rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[440px] w-[440px] rounded-full bg-white/15 blur-2xl" />

      {/* Ticker */}
      <div className="relative z-10">
        <Ticker />
      </div>

      {/* Main */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-14 pb-20 md:px-8 lg:px-12 lg:pt-20 lg:pb-28">
        <div className="grid min-h-[500px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ── LEFT ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              variants={textContainer}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              className="flex flex-col"
            >
              {/* Eyebrow micro line */}
              <motion.div variants={textItem} className="mb-3 flex items-center gap-3">
                <span
                  className="text-[0.6rem] font-black tracking-[0.22em] uppercase"
                  style={{ color: "#B8AE86" }}
                >
                  {slide.eyebrow}
                </span>
                <span className="h-px w-8 flex-shrink-0" style={{ backgroundColor: "#D4CFB3" }} />
                <RiVerifiedBadgeLine size={12} style={{ color: "#E84672" }} />
              </motion.div>

              {/* Tag pill */}
              <motion.div variants={textItem} className="mb-5">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-1.5 text-[0.7rem] font-bold tracking-[0.1em] uppercase shadow-sm backdrop-blur-sm"
                  style={{ backgroundColor: slide.badgeBg, color: slide.badgeText }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: slide.accentColor }}
                  />
                  {slide.tag}
                </span>
              </motion.div>

              {/* Headline */}
              <div className="mb-5">
                {slide.headline.map((line, i) => (
                  <motion.div key={i} variants={textItem} className="overflow-hidden">
                    <h1 className="block text-[clamp(2.8rem,5.5vw,4.4rem)] leading-[1.07] font-black tracking-[-0.03em] text-neutral-900">
                      {i === 1 ? (
                        <span className="relative inline-block">
                          <span className="relative z-10" style={{ color: slide.accentColor }}>
                            {line}
                          </span>
                          <motion.span
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.45, duration: 0.5, ease }}
                            className="absolute right-0 bottom-1 left-0 h-[3px] origin-left rounded-full"
                            style={{ backgroundColor: slide.accentColor, opacity: 0.2 }}
                          />
                        </span>
                      ) : (
                        line
                      )}
                    </h1>
                  </motion.div>
                ))}
              </div>

              {/* Subtext */}
              <motion.p
                variants={textItem}
                className="mb-7 max-w-[26rem] text-[0.95rem] leading-[1.78] text-neutral-500"
              >
                {slide.subtext}
              </motion.p>

              {/* CTAs */}
              <motion.div variants={textItem} className="mb-9 flex flex-wrap gap-3">
                <Link href={slide.cta.href}>
                  <motion.span
                    whileHover={{ y: -3, boxShadow: "0 14px 36px rgba(0,0,0,0.18)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl px-7 py-3.5 text-[0.9rem] font-bold text-white select-none"
                    style={{ backgroundColor: slide.accentColor }}
                  >
                    {slide.cta.label}
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <RiArrowRightLine size={17} />
                    </motion.span>
                  </motion.span>
                </Link>
                <Link href={slide.secondaryCta.href}>
                  <motion.span
                    whileHover={{ y: -3, backgroundColor: "#ffffff" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-neutral-200 bg-white/60 px-7 py-3.5 text-[0.9rem] font-bold text-neutral-700 backdrop-blur-sm transition-colors select-none"
                  >
                    {slide.secondaryCta.label}
                  </motion.span>
                </Link>
              </motion.div>

              {/* Trust items */}
              <motion.div variants={textItem} className="flex flex-wrap items-center gap-5">
                {trustItems.map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.09 }}
                    className="flex items-center gap-1.5 text-[0.76rem] font-semibold text-neutral-500"
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm">
                      <Icon size={11} style={{ color: slide.accentColor }} />
                    </span>
                    {label}
                  </motion.div>
                ))}
              </motion.div>

              {/* Micro stat */}
              <motion.div
                variants={textItem}
                className="mt-5 flex items-center gap-1.5 text-[0.62rem] font-black tracking-[0.15em] uppercase"
                style={{ color: "#B8AE86" }}
              >
                <RiFlashlightLine size={10} style={{ color: "#E84672" }} />
                {slide.stat.value} {slide.stat.label} &nbsp;·&nbsp; Updated Daily
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* ── RIGHT ── */}
          <div className="relative hidden items-center justify-center lg:flex">
            <AnimatePresence mode="wait">
              <motion.div
                key={`image-${current}`}
                variants={imageVariant}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative h-[500px] w-[470px]"
              >
                <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
                    className="pointer-events-none absolute inset-0 z-10 skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                  <Image
                    src={slide.image}
                    alt={slide.headline.join(" ")}
                    fill
                    className="object-cover"
                    priority
                    sizes="470px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                  {/* Slide number */}
                  <div
                    className="absolute top-4 left-4 z-20 rounded-xl px-2.5 py-1 text-[0.58rem] font-black tracking-[0.18em] uppercase"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.32)",
                      color: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {String(current + 1).padStart(2, "0")} /{" "}
                    {String(slides.length).padStart(2, "0")}
                  </div>

                  {/* Bottom pill */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute right-4 bottom-4 left-4 flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md"
                  >
                    <div>
                      <p
                        className="text-[0.62rem] font-black tracking-[0.16em] uppercase"
                        style={{ color: "#a8a29e" }}
                      >
                        Now Trending
                      </p>
                      <p className="mt-0.5 text-[0.84rem] leading-tight font-bold text-neutral-800">
                        {slide.headline.join(" ")}
                      </p>
                    </div>
                    <div
                      className="flex flex-col items-center rounded-xl px-3 py-1.5 text-white"
                      style={{ backgroundColor: slide.accentColor }}
                    >
                      <span className="text-[0.8rem] leading-tight font-black">
                        {slide.pill.value}
                      </span>
                      <span className="text-[0.58rem] leading-tight opacity-80">
                        {slide.pill.label}
                      </span>
                    </div>
                  </motion.div>
                </div>

                <FloatCard
                  label={slide.floatCards[0].label}
                  sub={slide.floatCards[0].sub}
                  delay={0.55}
                  className="-top-4 -right-8 z-20"
                />
                <FloatCard
                  label={slide.floatCards[1].label}
                  sub={slide.floatCards[1].sub}
                  delay={0.7}
                  className="top-1/2 -left-10 z-20 -translate-y-1/2"
                />

                <div
                  className="pointer-events-none absolute -inset-4 rounded-[3rem] border-2 border-dashed opacity-20"
                  style={{ borderColor: slide.accentColor }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="absolute right-0 bottom-6 left-0 z-20">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 md:px-8 lg:px-12">
          <div className="flex items-center gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative h-1 cursor-pointer overflow-hidden rounded-full p-0 transition-all duration-300"
                style={{
                  width: i === current ? "2.5rem" : "0.5rem",
                  backgroundColor: i === current ? "transparent" : "#D1D5DB",
                  border: "none",
                }}
              >
                {i === current && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-neutral-200" />
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: slide.accentColor, width: `${progress}%` }}
                    />
                  </>
                )}
              </button>
            ))}
            <span className="ml-1 text-[0.66rem] font-bold tracking-wider text-neutral-400 tabular-nums">
              {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => goTo((current - 1 + slides.length) % slides.length)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white/70 text-neutral-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
              style={{ border: "none" }}
            >
              <RiArrowLeftSLine size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => goTo((current + 1) % slides.length)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white shadow-md"
              style={{ backgroundColor: slide.accentColor, border: "none" }}
            >
              <RiArrowRightSLine size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 h-px bg-neutral-200/60" />
    </section>
  );
}
