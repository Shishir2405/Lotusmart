"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RiArrowRightLine, RiLeafLine, RiShieldCheckLine, RiTruckLine } from "react-icons/ri";

const slides = [
  {
    headline: "Pure Spices,\nAuthentic Flavours",
    subtext: "Handpicked from the finest farms across India. No additives, no compromises.",
    cta: { label: "Shop Spices", href: "/categories/spices" },
    accent: "#E84672",
    bgFrom: "#FFF9E8",
    bgTo: "#FFE8C8",
    tag: "Farm to Kitchen",
    emoji: "🌶️",
  },
  {
    headline: "Premium Dry\nFruits & Nuts",
    subtext: "Rich in nutrients, rich in taste. Sourced from Afghanistan, Kashmir, and California.",
    cta: { label: "Explore Nuts", href: "/categories/dry-fruits" },
    accent: "#7A6E42",
    bgFrom: "#F7F6F0",
    bgTo: "#EBE8D8",
    tag: "Premium Grade",
    emoji: "🥜",
  },
  {
    headline: "Thoughtful Gift\nBoxes",
    subtext: "Curated hampers for every occasion — weddings, festivals, corporates, and more.",
    cta: { label: "Shop Gift Boxes", href: "/categories/gift-boxes" },
    accent: "#E84672",
    bgFrom: "#FFF1F3",
    bgTo: "#FFE0E6",
    tag: "Gifting Collection",
    emoji: "🎁",
  },
];

const trustItems = [
  { icon: RiLeafLine, label: "100% Natural" },
  { icon: RiShieldCheckLine, label: "FSSAI Certified" },
  { icon: RiTruckLine, label: "Free Shipping ₹500+" },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slide = slides[current];

  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`,
            minHeight: "600px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="container-wide" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "3rem",
                alignItems: "center",
              }}
              className="lg-hero-grid"
            >
              {/* Text side */}
              <div>
                {/* Tag pill */}
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: "#57534e",
                    marginBottom: "1.25rem",
                  }}
                >
                  <span
                    style={{
                      width: "0.375rem",
                      height: "0.375rem",
                      borderRadius: "9999px",
                      backgroundColor: "#E84672",
                      display: "inline-block",
                    }}
                  />
                  {slide.tag}
                </motion.span>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{
                    fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                    fontWeight: 700,
                    color: "#1c1917",
                    lineHeight: 1.15,
                    marginBottom: "1.25rem",
                    whiteSpace: "pre-line",
                  }}
                >
                  {slide.headline}
                </motion.h1>

                {/* Subtext */}
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{
                    fontSize: "1.125rem",
                    color: "#57534e",
                    lineHeight: 1.7,
                    marginBottom: "2rem",
                    maxWidth: "28rem",
                  }}
                >
                  {slide.subtext}
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
                >
                  <Link
                    href={slide.cta.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.875rem 1.75rem",
                      borderRadius: "1rem",
                      backgroundColor: slide.accent,
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: "1rem",
                      textDecoration: "none",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {slide.cta.label}
                    <RiArrowRightLine size={18} />
                  </Link>
                  <Link
                    href="/products"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.875rem 1.75rem",
                      borderRadius: "1rem",
                      border: "2px solid #e7e5e1",
                      color: "#44403c",
                      fontWeight: 600,
                      fontSize: "1rem",
                      backgroundColor: "rgba(255,255,255,0.6)",
                      textDecoration: "none",
                      transition: "background-color 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.borderColor = "#d6d3cd";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.6)";
                      e.currentTarget.style.borderColor = "#e7e5e1";
                    }}
                  >
                    Browse All
                  </Link>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginTop: "2.5rem" }}
                >
                  {trustItems.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        fontSize: "0.875rem",
                        color: "#78716c",
                        fontWeight: 500,
                      }}
                    >
                      <Icon size={16} style={{ color: "#7A6E42" }} />
                      {label}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Visual side — hidden on mobile, shown on lg+ via CSS in globals */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="hero-visual"
                style={{ display: "none", alignItems: "center", justifyContent: "center" }}
              >
                <div style={{ position: "relative", width: "24rem", height: "24rem" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "9999px",
                      backgroundColor: "rgba(255,255,255,0.4)",
                      backdropFilter: "blur(8px)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: "2rem",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(255,255,255,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "6rem",
                    }}
                  >
                    {slide.emoji}
                  </div>
                  {[
                    { label: "4.9 ★ Rating", top: "1rem", right: "1rem" },
                    { label: "50K+ Orders", bottom: "3rem", left: 0 },
                    { label: "Fresh Daily", bottom: "1rem", right: "2rem" },
                  ].map(({ label, ...pos }) => (
                    <motion.div
                      key={label}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3, delay: Math.random() * 2 }}
                      style={{
                        position: "absolute",
                        ...pos,
                        backgroundColor: "#ffffff",
                        borderRadius: "0.75rem",
                        padding: "0.375rem 0.75rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#292524",
                        border: "1px solid rgba(255,255,255,0.8)",
                      }}
                    >
                      {label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide dots */}
      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              height: "0.375rem",
              width: i === current ? "2rem" : "0.375rem",
              borderRadius: "9999px",
              backgroundColor: i === current ? "#E84672" : "#D1D5DB",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  );
}
