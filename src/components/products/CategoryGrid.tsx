"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { RiArrowRightLine, RiLeafLine } from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";

interface ApiCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  children?: ApiCategory[];
}

const palette = [
  { accentColor: "#E84672", accentLight: "rgba(232,70,114,0.18)", label: "Bestseller" },
  { accentColor: "#D97706", accentLight: "rgba(217,119,6,0.18)", label: "Popular" },
  { accentColor: "#7A6E42", accentLight: "rgba(122,110,66,0.18)", label: "Premium" },
  { accentColor: "#615834", accentLight: "rgba(97,88,52,0.18)", label: "Organic" },
  { accentColor: "#16A34A", accentLight: "rgba(22,163,74,0.18)", label: "Certified" },
  { accentColor: "#0891B2", accentLight: "rgba(8,145,178,0.18)", label: "Fresh" },
];

const FALLBACK_IMAGE = "/images/categories/nuts-seeds.jpg";

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1];

interface DecoratedCategory extends ApiCategory {
  accentColor: string;
  accentLight: string;
  label: string;
  displayImage: string;
  displayDesc: string;
  childCount: number;
}

function decorate(cats: ApiCategory[]): DecoratedCategory[] {
  return cats.map((c, i) => {
    const tone = palette[i % palette.length];
    return {
      ...c,
      accentColor: tone.accentColor,
      accentLight: tone.accentLight,
      label: tone.label,
      displayImage: c.image ? normalizeImageUrl(c.image) : FALLBACK_IMAGE,
      displayDesc: c.description?.trim() || "Explore our curated selection.",
      childCount: c.children?.length ?? 0,
    };
  });
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<DecoratedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ data: ApiCategory[] }>("/api/categories?includeSubcategories=true")
      .then((r) => {
        if (cancelled) return;
        setCategories(decorate(r.data.data ?? []));
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="overflow-hidden bg-white py-16 lg:py-24">
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
          <div className="mb-10 h-8 w-64 animate-pulse rounded bg-neutral-100" />
          <div className="hidden gap-2 lg:flex" style={{ height: "440px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse rounded-3xl bg-neutral-100"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="overflow-hidden bg-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <span
              className="mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.68rem] font-black tracking-[0.15em] uppercase"
              style={{ backgroundColor: "#FFF1F3", color: "#E84672", border: "1px solid #FECDD3" }}
            >
              <RiLeafLine size={10} /> Our Collections
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight font-black tracking-tight text-neutral-900">
              Shop by{" "}
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: "#E84672" }}>
                  Category
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 bottom-0.5 left-0 h-[3px] origin-left rounded-full opacity-20"
                  style={{ backgroundColor: "#E84672" }}
                />
              </span>
            </h2>
            <p className="mt-1.5 text-sm font-medium text-neutral-400">
              Hover to explore each collection
            </p>
          </div>

          <Link href="/categories">
            <motion.span
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 px-5 py-2.5 text-sm font-bold"
              style={{ borderColor: "#E84672", color: "#E84672" }}
            >
              All Categories
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                <RiArrowRightLine size={15} />
              </motion.span>
            </motion.span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="hidden w-full items-stretch gap-2 lg:flex"
          style={{ height: "440px" }}
        >
          {categories.map((cat, i) => {
            const isActive = active === i;

            return (
              <motion.div
                key={cat._id}
                animate={{ flex: isActive ? 5 : 1 }}
                transition={{ duration: 0.45, ease }}
                className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-3xl"
                onHoverStart={() => setActive(i)}
                onClick={() => setActive(i)}
                style={{ minWidth: "3.5rem" }}
              >
                <div className="absolute inset-0">
                  <Image
                    src={cat.displayImage}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700"
                    style={{ transform: isActive ? "scale(1.04)" : "scale(1.12)" }}
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>

                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
                    opacity: isActive ? 1 : 0.7,
                  }}
                />

                <AnimatePresence>
                  {!isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0"
                      style={{
                        backgroundColor: cat.accentColor,
                        opacity: 0.25,
                        mixBlendMode: "multiply",
                      }}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col items-center justify-end px-2 pb-5"
                    >
                      <div
                        className="mb-3"
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          transform: "rotate(180deg)",
                        }}
                      >
                        <span className="text-[0.72rem] font-black tracking-widest whitespace-nowrap text-white/90 uppercase">
                          {cat.name}
                        </span>
                      </div>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: cat.accentColor }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="absolute inset-0 flex flex-col justify-between p-6"
                    >
                      <div className="flex items-start justify-between">
                        <motion.span
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18, duration: 0.3 }}
                          className="inline-flex items-center rounded-xl px-2.5 py-1 text-[0.62rem] font-black tracking-widest uppercase"
                          style={{
                            backgroundColor: cat.accentLight,
                            color: "white",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                          }}
                        >
                          {cat.label}
                        </motion.span>

                        {cat.childCount > 0 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.22, type: "spring", stiffness: 300, damping: 20 }}
                            className="text-[0.65rem] font-bold tracking-widest text-white/60 uppercase"
                          >
                            {cat.childCount} sub{cat.childCount === 1 ? "" : "s"}
                          </motion.span>
                        )}
                      </div>

                      <div>
                        <motion.h3
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="mb-2 text-[1.7rem] leading-tight font-black tracking-tight text-white"
                        >
                          {cat.name}
                        </motion.h3>

                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.22, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="mb-4 max-w-[260px] text-[0.8rem] leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.7)" }}
                        >
                          {cat.displayDesc}
                        </motion.p>

                        {cat.children && cat.children.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.3 }}
                            className="mb-4 flex flex-wrap gap-1.5"
                          >
                            {cat.children.map((child) => (
                              <Link
                                key={child._id}
                                href={`/categories/${child.slug}`}
                                className="inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold text-white/85 transition-colors hover:bg-white/15"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.08)",
                                  borderColor: "rgba(255,255,255,0.18)",
                                  backdropFilter: "blur(6px)",
                                }}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Link href={`/categories/${cat.slug}`}>
                            <motion.span
                              whileHover={{ gap: "0.7rem", paddingRight: "1.4rem" }}
                              className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl px-5 py-2.5 text-[0.82rem] font-bold text-neutral-900 transition-all"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.92)",
                                backdropFilter: "blur(8px)",
                              }}
                            >
                              Explore {cat.name}
                              <motion.span
                                animate={{ x: [0, 3, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                              >
                                <RiArrowRightLine size={14} style={{ color: cat.accentColor }} />
                              </motion.span>
                            </motion.span>
                          </Link>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  className="absolute top-0 bottom-0 left-0 w-[3px] rounded-full"
                  animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ backgroundColor: cat.accentColor, transformOrigin: "bottom" }}
                />
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/categories/${cat.slug}`}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.12)" }}
                  whileTap={{ scale: 0.97 }}
                  className="relative h-40 cursor-pointer overflow-hidden rounded-2xl"
                >
                  <Image
                    src={cat.displayImage}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                  <div className="absolute right-3 bottom-3 left-3">
                    <p
                      className="mb-0.5 text-[0.6rem] font-black tracking-widest uppercase"
                      style={{ color: cat.accentColor }}
                    >
                      {cat.label}
                    </p>
                    <p className="text-[0.85rem] leading-tight font-black text-white">
                      {cat.name}
                    </p>
                    {cat.childCount > 0 && (
                      <p className="mt-0.5 text-[0.65rem] font-semibold text-white/50">
                        {cat.childCount} sub{cat.childCount === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
              {cat.children && cat.children.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cat.children.slice(0, 4).map((child) => (
                    <Link
                      key={child._id}
                      href={`/categories/${child.slug}`}
                      className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[0.65rem] font-semibold text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-white"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
