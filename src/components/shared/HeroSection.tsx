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
    bg: "from-[#FFF9E8] to-[#FFE8C8]",
    tag: "Farm to Kitchen",
  },
  {
    headline: "Premium Dry\nFruits & Nuts",
    subtext: "Rich in nutrients, rich in taste. Sourced from Afghanistan, Kashmir, and California.",
    cta: { label: "Explore Nuts", href: "/categories/dry-fruits" },
    accent: "#7A6E42",
    bg: "from-[#F7F6F0] to-[#EBE8D8]",
    tag: "Premium Grade",
  },
  {
    headline: "Thoughtful Gift\nBoxes",
    subtext: "Curated hampers for every occasion — weddings, festivals, corporates, and more.",
    cta: { label: "Shop Gift Boxes", href: "/categories/gift-boxes" },
    accent: "#E84672",
    bg: "from-[#FFF1F3] to-[#FFE0E6]",
    tag: "Gifting Collection",
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
    <section className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`bg-gradient-to-br ${slide.bg} min-h-[560px] flex items-center`}
        >
          <div className="container-wide py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div>
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-white text-xs font-semibold tracking-wide text-neutral-600 mb-5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E84672] animate-pulse" />
                  {slide.tag}
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-5 whitespace-pre-line"
                >
                  {slide.headline}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-md"
                >
                  {slide.subtext}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-wrap gap-3"
                >
                  <Link
                    href={slide.cta.href}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    style={{ background: slide.accent }}
                  >
                    {slide.cta.label}
                    <RiArrowRightLine size={18} />
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-neutral-200 text-neutral-700 font-semibold text-base bg-white/60 hover:border-neutral-300 hover:bg-white transition-all duration-200"
                  >
                    Browse All
                  </Link>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="flex flex-wrap gap-5 mt-10"
                >
                  {trustItems.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-sm text-neutral-500 font-medium">
                      <Icon size={16} className="text-[#7A6E42]" />
                      {label}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Visual placeholder (replaced by hero image in production) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="hidden lg:flex items-center justify-center"
              >
                <div className="relative w-96 h-96">
                  <div className="absolute inset-0 rounded-full bg-white/40 backdrop-blur-sm" />
                  <div className="absolute inset-8 rounded-full bg-white/60 flex items-center justify-center">
                    <span className="text-9xl">🌸</span>
                  </div>
                  {/* Floating chips */}
                  {[
                    { label: "4.9 ★ Rating", pos: "top-4 right-4" },
                    { label: "50K+ Orders", pos: "bottom-12 left-0" },
                    { label: "Fresh Daily", pos: "bottom-4 right-8" },
                  ].map(({ label, pos }) => (
                    <motion.div
                      key={label}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3, delay: Math.random() * 2 }}
                      className={`absolute ${pos} bg-white rounded-xl px-3 py-1.5 shadow-md text-xs font-semibold text-neutral-800 border border-white`}
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-[#E84672]" : "w-1.5 bg-neutral-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
