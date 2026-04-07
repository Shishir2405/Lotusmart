"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RiArrowRightLine, RiLeafLine } from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";


const categories = [
  {
    name: "Whole\nSpices",
    slug: "whole-spices",
    image: "/images/spices/whole-spices.jpg",
    count: "40+ items",
    label: "Bestseller",
    accentColor: "#E84672",
    accentLight: "rgba(232,70,114,0.18)",
    desc: "Sun-dried & handpicked from Kerala, Rajasthan, and the Nilgiris.",
  },
  {
    name: "Ground\nSpices",
    slug: "ground-spices",
    image: "/images/spices/ground-spices.jpg",
    count: "30+ items",
    label: "Popular",
    accentColor: "#D97706",
    accentLight: "rgba(217,119,6,0.18)",
    desc: "Stone-ground in small batches to preserve aroma and potency.",
  },
  {
    name: "Dry\nFruits",
    slug: "dry-fruits",
    image: "/images/hero/dryfruits-hero.jpg",
    count: "25+ items",
    label: "Premium",
    accentColor: "#7A6E42",
    accentLight: "rgba(122,110,66,0.18)",
    desc: "Sourced from Afghanistan, Kashmir & California for the finest grade.",
  },
  {
    name: "Nuts &\nSeeds",
    slug: "nuts-seeds",
    image: "/images/categories/nuts-seeds.jpg",
    count: "20+ items",
    label: "Organic",
    accentColor: "#615834",
    accentLight: "rgba(97,88,52,0.18)",
    desc: "Raw, roasted & trail mixes — all without additives or preservatives.",
  },
  {
    name: "Gift\nBoxes",
    slug: "gift-boxes",
    image: "/images/gifts/gift-box-1.jpg",
    count: "15+ sets",
    label: "Trending",
    accentColor: "#E84672",
    accentLight: "rgba(232,70,114,0.18)",
    desc: "Thoughtfully curated for weddings, festivals & corporate gifting.",
  },
  {
    name: "Organic\nRange",
    slug: "organic",
    image: "/images/spices/organic-spices.jpg",
    count: "10+ items",
    label: "Certified",
    accentColor: "#16A34A",
    accentLight: "rgba(22,163,74,0.18)",
    desc: "FSSAI-certified organic produce, free from pesticides and chemicals.",
  },
];

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1];


export function CategoryGrid() {
  const [active, setActive] = useState<number>(0);

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
                key={cat.slug}
                animate={{
                  flex: isActive ? 5 : 1,
                }}
                transition={{ duration: 0.45, ease }}
                className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-3xl"
                onHoverStart={() => setActive(i)}
                onClick={() => setActive(i)}
                style={{ minWidth: "3.5rem" }}
              >
                
                <div className="absolute inset-0">
                  <Image
                    src={normalizeImageUrl(cat.image)}
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
                          {cat.name.replace("\n", " ")}
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

                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.22, type: "spring", stiffness: 300, damping: 20 }}
                          className="text-[0.65rem] font-bold tracking-widest text-white/60 uppercase"
                        >
                          {cat.count}
                        </motion.span>
                      </div>

                      
                      <div>
                        <motion.h3
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="mb-2 text-[1.7rem] leading-tight font-black tracking-tight whitespace-pre-line text-white"
                        >
                          {cat.name}
                        </motion.h3>

                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.22, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="mb-5 max-w-[240px] text-[0.8rem] leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.65)" }}
                        >
                          {cat.desc}
                        </motion.p>

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
                              Explore {cat.name.split("\n")[0]}
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
              key={cat.slug}
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
                    src={normalizeImageUrl(cat.image)}
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
                      {cat.name.replace("\n", " ")}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] font-semibold text-white/50">{cat.count}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
