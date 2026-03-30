"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiArrowRightLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiStarFill,
  RiMailSendLine,
  RiCheckLine,
} from "react-icons/ri";

/* ─── Types ─── */

interface Product {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  ratings?: { average: number; count: number };
  unit?: string;
  weight?: number;
}

interface LandingSection {
  _id: string;
  type: string;
  title: string;
  subtitle?: string;
  products?: Product[];
  categories?: unknown[];
  settings?: Record<string, unknown>;
}

interface SectionProps {
  section: LandingSection;
}

/* ─── Product Card ─── */

function ProductCard({ product }: { product: Product }) {
  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100,
      )
    : 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group cursor-pointer overflow-hidden rounded-2xl border border-neutral-100 bg-white"
      >
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}
          {discount > 0 && (
            <span className="absolute top-2.5 left-2.5 rounded-lg bg-[#E84672] px-2 py-0.5 text-[0.65rem] font-bold text-white">
              {discount}% OFF
            </span>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="truncate text-sm font-semibold text-neutral-800 font-sans">
            {product.name}
          </h3>
          {product.ratings && product.ratings.count > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <RiStarFill size={11} className="text-amber-400" />
              <span className="text-xs text-neutral-500">
                {product.ratings.average.toFixed(1)} ({product.ratings.count})
              </span>
            </div>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-neutral-900">
              ₹{product.price}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-neutral-400 line-through">
                ₹{product.compareAtPrice}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── Section Header ─── */

function SectionHeader({
  title,
  subtitle,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-neutral-400">{subtitle}</p>
        )}
      </div>
      {viewAllHref && (
        <Link href={viewAllHref}>
          <motion.span
            whileHover={{ x: 3 }}
            className="hidden items-center gap-1 text-sm font-semibold text-[#E84672] sm:inline-flex"
          >
            View All <RiArrowRightLine size={14} />
          </motion.span>
        </Link>
      )}
    </div>
  );
}

/* ─── Renderer: Product Carousel ─── */

function ProductCarouselRenderer({ section }: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 260;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  if (!section.products || section.products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="mt-1.5 text-sm text-neutral-400">
              {section.subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-opacity disabled:cursor-default disabled:opacity-30"
          >
            <RiArrowLeftSLine size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-[#E84672] text-white transition-opacity disabled:cursor-default disabled:opacity-30"
          >
            <RiArrowRightSLine size={18} />
          </motion.button>
          <Link href="/products" className="ml-2 hidden sm:block">
            <motion.span
              whileHover={{ x: 3 }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#E84672]"
            >
              View All <RiArrowRightLine size={14} />
            </motion.span>
          </Link>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {section.products.map((product) => (
          <div
            key={product._id}
            className="w-55 shrink-0 snap-start sm:w-60 lg:w-65"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Renderer: Custom Products Grid ─── */

function CustomProductsRenderer({ section }: SectionProps) {
  if (!section.products || section.products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeader
        title={section.title}
        subtitle={section.subtitle}
        viewAllHref="/products"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {section.products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

/* ─── Renderer: Newsletter ─── */

function NewsletterRenderer({ section }: SectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const heading =
    (section.settings?.heading as string) || section.title || "Stay in the Loop";
  const subtext =
    (section.settings?.subtext as string) ||
    section.subtitle ||
    "Get exclusive deals, new product drops, and spice tips delivered to your inbox. No spam, ever.";
  const buttonText =
    (section.settings?.buttonText as string) || "Subscribe";
  const bgColor = (section.settings?.bgColor as string) || "#FFF1F3";
  const accentColor = (section.settings?.accentColor as string) || "#E84672";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section style={{ backgroundColor: bgColor }}>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          {/* Decorative line */}
          <div className="mb-5 flex items-center justify-center gap-3">
            <span
              className="h-px w-8"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="text-[0.58rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B8AE86" }}
            >
              Newsletter
            </span>
            <span
              className="h-px w-8"
              style={{ backgroundColor: accentColor }}
            />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-black leading-tight tracking-[-0.03em] text-neutral-900"
          >
            {heading}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mx-auto mt-4 max-w-md text-[0.88rem] leading-relaxed text-neutral-500"
          >
            {subtext}
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <RiMailSendLine
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error" || status === "success")
                    setStatus("idle");
                }}
                placeholder="Enter your email"
                required
                className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-neutral-800 outline-none transition-shadow placeholder:text-neutral-300 focus:border-transparent focus:ring-2"
                style={
                  {
                    "--tw-ring-color": accentColor,
                  } as React.CSSProperties
                }
              />
            </div>

            <motion.button
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white transition-opacity disabled:cursor-default disabled:opacity-60"
              style={{ backgroundColor: accentColor }}
            >
              {status === "success" ? (
                <>
                  <RiCheckLine size={16} /> Subscribed!
                </>
              ) : status === "loading" ? (
                "Subscribing..."
              ) : (
                <>
                  {buttonText} <RiArrowRightLine size={14} />
                </>
              )}
            </motion.button>
          </motion.form>

          {status === "error" && (
            <p className="mt-3 text-xs font-medium text-red-500">
              Something went wrong. Please try again.
            </p>
          )}

          {status === "success" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-xs font-medium"
              style={{ color: "#16A34A" }}
            >
              Thank you! Check your inbox for a welcome email.
            </motion.p>
          )}

          <p className="mt-5 text-[0.68rem] font-medium text-neutral-300">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Renderer: Custom HTML ─── */

function CustomHtmlRenderer({ section }: SectionProps) {
  const content = (section.settings?.html as string) || "";
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}

/* ─── Fallback Renderer ─── */

function FallbackRenderer({ section }: SectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeader title={section.title} subtitle={section.subtitle} />
      {section.products && section.products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {section.products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Main Component ─── */

export function DynamicLandingSections({ section }: SectionProps) {
  switch (section.type) {
    case "product_carousel":
      return <ProductCarouselRenderer section={section} />;
    case "custom_products":
      return <CustomProductsRenderer section={section} />;
    case "newsletter":
      return <NewsletterRenderer section={section} />;
    case "custom_html":
      return <CustomHtmlRenderer section={section} />;
    // These types are handled by dedicated components in page.tsx but
    // we provide a graceful fallback if they are ever routed here.
    case "hero_banners":
    case "category_grid":
    case "featured_products":
    case "banner_strip":
    case "why_choose_us":
    case "faq":
      return <FallbackRenderer section={section} />;
    default:
      return <FallbackRenderer section={section} />;
  }
}
