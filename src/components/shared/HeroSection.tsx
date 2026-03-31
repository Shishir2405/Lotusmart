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

const textContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.075 } } };
const textItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};
const imageVariant: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.3, ease: exitEase } },
};

interface HeroBannerSlide {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface HeroSectionProps {
  settings?: {
    slides?: HeroBannerSlide[];
    [key: string]: unknown;
  };
}

function mapAPISlides(apiSlides: HeroBannerSlide[]) {
  const colorRotation = [
    { accentColor: "#E84672", bgFrom: "#FFF9E8", bgTo: "#FFE8C8" },
    { accentColor: "#7A6E42", bgFrom: "#F7F6F0", bgTo: "#EBE8D8" },
    { accentColor: "#E84672", bgFrom: "#FFF1F3", bgTo: "#FFE0E6" },
    { accentColor: "#D97706", bgFrom: "#FFFBEB", bgTo: "#FFF3CD" },
    { accentColor: "#16A34A", bgFrom: "#F0FDF4", bgTo: "#DCFCE7" },
  ];

  return apiSlides.map((s, i) => {
    const colors = colorRotation[i % colorRotation.length];
    const titleParts = s.title ? s.title.split("\n") : ["Welcome"];
    return {
      id: i,
      tag: "",
      headline: titleParts.length > 1 ? titleParts : [titleParts[0], ""],
      subtext: s.subtitle || "",
      cta: { label: s.ctaText || "Shop Now", href: s.ctaLink || "/products" },
      secondaryCta: { label: "Explore All", href: "/products" },
      image: s.image || "/images/hero/spices-hero.jpg",
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
      style={{ position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`,
          }}
        />
      </AnimatePresence>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          padding: "3.5rem 1.5rem 5rem",
        }}
        className="md:px-8 lg:px-12 lg:pt-20 lg:pb-24"
      >
        <div
          style={{
            display: "grid",
            alignItems: "center",
            gap: "2.5rem",
          }}
          className="grid-cols-1 lg:grid-cols-2 lg:gap-14"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              variants={textContainer}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <motion.div variants={textItem} style={{ marginBottom: "1rem" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "9999px",
                    padding: "0.35rem 0.9rem",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: slide.accentColor,
                    backgroundColor: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.75)",
                  }}
                >
                  {slide.tag}
                </span>
              </motion.div>

              <div style={{ marginBottom: "1.25rem" }}>
                {slide.headline.map((line, i) => (
                  <motion.div key={i} variants={textItem} style={{ overflow: "hidden" }}>
                    <h1
                      style={{
                        display: "block",
                        fontSize: "clamp(2.5rem, 5.2vw, 4rem)",
                        lineHeight: 1.1,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        color: i === 1 ? slide.accentColor : "#171717",
                      }}
                    >
                      {line}
                    </h1>
                  </motion.div>
                ))}
              </div>
              <motion.p
                variants={textItem}
                style={{
                  marginBottom: "1.6rem",
                  maxWidth: "28rem",
                  fontSize: "0.95rem",
                  lineHeight: 1.75,
                  color: "#57534e",
                }}
              >
                {slide.subtext}
              </motion.p>

              <motion.div variants={textItem} style={{ marginBottom: "1.7rem" }}>
                <span
                  style={{
                    display: "inline-flex",
                    borderRadius: "0.75rem",
                    padding: "0.45rem 0.7rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#44403c",
                    backgroundColor: "rgba(255,255,255,0.75)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {slide.highlight}
                </span>
              </motion.div>

              <motion.div
                variants={textItem}
                style={{ marginBottom: "2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
              >
                <Link href={slide.cta.href}>
                  <motion.span
                    whileHover={{ y: -2, boxShadow: "0 10px 26px rgba(0,0,0,0.16)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex",
                      cursor: "pointer",
                      alignItems: "center",
                      gap: "0.55rem",
                      borderRadius: "0.9rem",
                      padding: "0.82rem 1.4rem",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "#fff",
                      backgroundColor: slide.accentColor,
                      userSelect: "none",
                    }}
                  >
                    {slide.cta.label}
                    <RiArrowRightLine size={16} />
                  </motion.span>
                </Link>
                <Link href={slide.secondaryCta.href}>
                  <motion.span
                    whileHover={{ y: -2, backgroundColor: "#ffffff" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex",
                      cursor: "pointer",
                      alignItems: "center",
                      borderRadius: "0.9rem",
                      border: "1.5px solid #E5E7EB",
                      backgroundColor: "rgba(255,255,255,0.65)",
                      padding: "0.82rem 1.4rem",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "#404040",
                      backdropFilter: "blur(3px)",
                      userSelect: "none",
                    }}
                  >
                    {slide.secondaryCta.label}
                  </motion.span>
                </Link>
              </motion.div>

              <motion.div
                variants={textItem}
                style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.25rem" }}
              >
                {trustItems.map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#57534e",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        width: "20px",
                        height: "20px",
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.8)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      <Icon size={11} style={{ color: slide.accentColor }} />
                    </span>
                    {label}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div
            className="hidden lg:flex"
            style={{ position: "relative", alignItems: "center", justifyContent: "center" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`image-${current}`}
                variants={imageVariant}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{ position: "relative", height: "500px", width: "470px" }}
              >
                <div
                  style={{
                    position: "relative",
                    height: "100%",
                    width: "100%",
                    overflow: "hidden",
                    borderRadius: "2rem",
                    boxShadow: "0 30px 70px rgba(0,0,0,0.14)",
                  }}
                >
                  <Image
                    src={slide.image}
                    alt={slide.headline.join(" ")}
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                    sizes="470px"
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.22), rgba(0,0,0,0.04) 45%, transparent)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      left: "1rem",
                      borderRadius: "0.7rem",
                      padding: "0.28rem 0.6rem",
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      backgroundColor: "rgba(255,255,255,0.86)",
                      color: "#44403c",
                    }}
                  >
                    {slide.tag}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", right: 0, bottom: "1.5rem", left: 0, zIndex: 20 }}>
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.5rem",
          }}
          className="md:px-8 lg:px-12"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  position: "relative",
                  height: "4px",
                  cursor: "pointer",
                  overflow: "hidden",
                  borderRadius: "9999px",
                  padding: 0,
                  border: "none",
                  width: i === current ? "2.5rem" : "0.5rem",
                  backgroundColor: i === current ? "transparent" : "#D1D5DB",
                  transition: "all 0.3s",
                }}
              >
                {i === current && (
                  <>
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "9999px",
                        backgroundColor: "#E5E7EB",
                      }}
                    />
                    <motion.span
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        borderRadius: "9999px",
                        backgroundColor: slide.accentColor,
                        width: `${progress}%`,
                      }}
                    />
                  </>
                )}
              </button>
            ))}
            <span
              style={{
                marginLeft: "0.25rem",
                fontSize: "0.66rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "#A3A3A3",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(current + 1).padStart(2, "0")} / {String(activeSlides.length).padStart(2, "0")}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goTo((current - 1 + activeSlides.length) % activeSlides.length)}
              style={{
                display: "flex",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "1px solid #E5E7EB",
                backgroundColor: "rgba(255,255,255,0.75)",
                color: "#525252",
              }}
            >
              <RiArrowLeftSLine size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goTo((current + 1) % activeSlides.length)}
              style={{
                display: "flex",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "none",
                color: "#fff",
                backgroundColor: slide.accentColor,
              }}
            >
              <RiArrowRightSLine size={18} />
            </motion.button>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          left: 0,
          height: "1px",
          backgroundColor: "rgba(229,231,235,0.6)",
        }}
      />
    </section>
  );
}
