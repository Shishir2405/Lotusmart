"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiArrowRightLine,
  RiTimeLine,
  RiGiftLine,
  RiLeafLine,
  RiFlashlightLine,
} from "react-icons/ri";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const primary = {
  id: "spice-bundle",
  eyebrow: "Limited Time",
  tag: "This Week Only",
  headline: "Spice\nBundle",
  highlight: "20% Off",
  body: "Any 5-spice combo box. Handpicked, freshly packed, zero additives.",
  cta: { label: "Shop the Deal", href: "/products?category=spices" },
  image: "/images/hero/spices-hero.jpg",
  accentColor: "#FFE08A",
  textDark: "#2a2518",
  bg: "linear-gradient(145deg, #1c1610 0%, #3a2e10 100%)",
  stat: "Save ₹120 avg",
};

const secondaries = [
  {
    id: "gift-boxes",
    eyebrow: "Gifting",
    headline: "Custom\nHampers",
    body: "From ₹799. Same-day dispatch. Built to impress.",
    cta: { label: "Explore", href: "/categories/gift-boxes" },
    image: "/images/hero/gifts-hero.jpg",
    accentColor: "#FFD6E0",
    bg: "linear-gradient(145deg, #4a0f1e 0%, #8b1e3e 100%)",
    icon: RiGiftLine,
  },
  {
    id: "organic",
    eyebrow: "New In",
    headline: "Organic\nRange",
    body: "FSSAI-certified. No pesticides. Just honest food.",
    cta: { label: "Discover", href: "/categories/organic" },
    image: "/images/spices/organic-spices.jpg",
    accentColor: "#BBF7D0",
    bg: "linear-gradient(145deg, #052e16 0%, #14532d 100%)",
    icon: RiLeafLine,
  },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
interface BannerStripProps {
  settings?: {
    image?: string;
    title?: string;
    subtitle?: string;
    link?: string;
    [key: string]: unknown;
  };
}

export function BannerStrip({ settings }: BannerStripProps = {}) {
  // If admin provided custom banner settings, override the primary card data
  const activePrimary = settings?.image
    ? {
        ...primary,
        image: settings.image,
        headline: settings.title || primary.headline,
        body: settings.subtitle || primary.body,
        cta: {
          label: primary.cta.label,
          href: settings.link || primary.cta.href,
        },
      }
    : primary;
  return (
    <section className="py-16 lg:py-24" style={{ backgroundColor: "#FAFAF9" }}>
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
              <span
                className="text-[0.62rem] font-black tracking-[0.22em] uppercase"
                style={{ color: "#B8AE86" }}
              >
                This Season
              </span>
            </div>
            <h2 className="text-[clamp(1.9rem,3.5vw,2.8rem)] leading-tight font-black tracking-[-0.03em] text-neutral-900">
              Deals & <span style={{ color: "#E84672" }}>Collections</span>
            </h2>
          </div>
          <Link href="/offers">
            <motion.span
              whileHover={{ x: 4 }}
              transition={{ duration: 0.15 }}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold"
              style={{ color: "#E84672" }}
            >
              See all offers <RiArrowRightLine size={15} />
            </motion.span>
          </Link>
        </motion.div>

        {/* ── Asymmetric grid ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
          {/* ── PRIMARY — tall left card ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease }}
          >
            <Link href={activePrimary.cta.href} className="group block h-full">
              <motion.div
                whileHover={{ boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.3, ease }}
                className="relative h-[420px] cursor-pointer overflow-hidden rounded-3xl lg:h-[560px]"
              >
                {/* Image */}
                <Image
                  src={activePrimary.image}
                  alt={activePrimary.headline}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />

                {/* Rich gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${activePrimary.bg.match(/#[a-f0-9]+/gi)?.[0]}F0 0%, transparent 55%, rgba(0,0,0,0.6) 100%)`,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: activePrimary.bg, opacity: 0.75 }}
                />

                {/* Content */}
                <div className="absolute inset-0 z-10 flex flex-col justify-between p-8">
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <motion.span
                      initial={{ opacity: 0, y: -8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.62rem] font-black tracking-[0.15em] uppercase"
                      style={{
                        backgroundColor: "rgba(255,224,138,0.15)",
                        border: "1px solid rgba(255,224,138,0.25)",
                        color: activePrimary.accentColor,
                      }}
                    >
                      <RiTimeLine size={10} />
                      {activePrimary.eyebrow}
                    </motion.span>

                    {/* Big discount badge */}
                    <motion.div
                      initial={{ scale: 0, rotate: -12 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 18 }}
                      className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl"
                      style={{ backgroundColor: activePrimary.accentColor }}
                    >
                      <span
                        className="text-[1.1rem] leading-none font-black"
                        style={{ color: activePrimary.textDark }}
                      >
                        20%
                      </span>
                      <span
                        className="text-[0.55rem] font-black tracking-wider uppercase"
                        style={{ color: activePrimary.textDark }}
                      >
                        OFF
                      </span>
                    </motion.div>
                  </div>

                  {/* Bottom */}
                  <div>
                    {/* Micro label */}
                    <p
                      className="mb-2 text-[0.62rem] font-black tracking-[0.2em] uppercase"
                      style={{ color: `${activePrimary.accentColor}80` }}
                    >
                      {activePrimary.tag}
                    </p>

                    {/* Headline */}
                    <h3
                      className="mb-4 leading-[0.92] font-black tracking-[-0.04em] whitespace-pre-line"
                      style={{
                        fontSize: "clamp(3rem, 6vw, 4.5rem)",
                        color: activePrimary.accentColor,
                      }}
                    >
                      {activePrimary.headline}
                    </h3>

                    <p
                      className="mb-6 max-w-xs text-[0.85rem] leading-relaxed"
                      style={{ color: "rgba(255,224,138,0.6)" }}
                    >
                      {activePrimary.body}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-4">
                      <motion.span
                        whileHover={{ x: 4 }}
                        className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl px-5 py-3 text-[0.85rem] font-black"
                        style={{ backgroundColor: activePrimary.accentColor, color: activePrimary.textDark }}
                      >
                        {activePrimary.cta.label}
                        <RiArrowRightLine size={15} />
                      </motion.span>
                      <span
                        className="text-[0.7rem] font-bold"
                        style={{ color: `${activePrimary.accentColor}60` }}
                      >
                        {activePrimary.stat}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shine */}
                <motion.div
                  initial={{ x: "-100%", opacity: 0 }}
                  whileHover={{ x: "200%", opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 skew-x-12 bg-gradient-to-r from-transparent via-white/6 to-transparent"
                />
              </motion.div>
            </Link>
          </motion.div>

          {/* ── SECONDARY — two stacked cards ── */}
          <div className="flex flex-col gap-4">
            {secondaries.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease }}
                className="flex-1"
              >
                <Link href={b.cta.href} className="group block h-full">
                  <motion.div
                    whileHover={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.3, ease }}
                    className="relative h-[200px] min-h-[200px] cursor-pointer overflow-hidden rounded-3xl lg:h-full"
                  >
                    <Image
                      src={b.image}
                      alt={b.headline}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0" style={{ background: b.bg, opacity: 0.82 }} />

                    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
                      {/* Top */}
                      <div className="flex items-center justify-between">
                        <span
                          className="inline-flex items-center gap-1.5 text-[0.6rem] font-black tracking-[0.18em] uppercase"
                          style={{ color: `${b.accentColor}80` }}
                        >
                          <b.icon size={10} style={{ color: b.accentColor }} />
                          {b.eyebrow}
                        </span>
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-xl"
                          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        >
                          <RiArrowRightLine size={13} style={{ color: b.accentColor }} />
                        </motion.span>
                      </div>

                      {/* Bottom */}
                      <div>
                        <h3
                          className="mb-2 leading-[0.9] font-black tracking-[-0.03em] whitespace-pre-line"
                          style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", color: b.accentColor }}
                        >
                          {b.headline}
                        </h3>
                        <p
                          className="text-[0.75rem] leading-relaxed"
                          style={{ color: `${b.accentColor}70` }}
                        >
                          {b.body}
                        </p>
                      </div>
                    </div>

                    {/* Shine */}
                    <motion.div
                      initial={{ x: "-100%", opacity: 0 }}
                      whileHover={{ x: "200%", opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-0 skew-x-12 bg-gradient-to-r from-transparent via-white/6 to-transparent"
                    />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Bottom micro strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-4"
        >
          {[
            "Free shipping ₹500+",
            "Pan-India delivery",
            "Bulk order discounts",
            "Same-day dispatch",
          ].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-wide"
              style={{ color: "#B8AE86" }}
            >
              <RiFlashlightLine size={10} style={{ color: "#E84672" }} />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
