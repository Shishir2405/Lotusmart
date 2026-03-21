"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { RiArrowRightLine, RiShoppingCartLine, RiFireLine } from "react-icons/ri";
import { ProductCard, type ProductCardData } from "./ProductCard";

interface FeaturedProductsClientProps {
  products: ProductCardData[];
}

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: smoothEase },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: smoothEase } },
};

export function FeaturedProductsClient({ products }: FeaturedProductsClientProps) {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div>
            <motion.span
              variants={headingVariants}
              className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
              style={{ backgroundColor: "#FFF1F3", color: "#E84672", border: "1px solid #FECDD3" }}
            >
              <RiFireLine size={11} />
              Handpicked This Season
            </motion.span>

            <motion.h2
              variants={headingVariants}
              className="text-[clamp(1.9rem,3.5vw,2.75rem)] leading-tight font-bold tracking-tight text-neutral-900"
            >
              Featured{" "}
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: "#E84672" }}>
                  Products
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.5, ease: smoothEase }}
                  className="absolute right-0 bottom-0.5 left-0 h-[3px] origin-left rounded-full opacity-25"
                  style={{ backgroundColor: "#E84672" }}
                />
              </span>
            </motion.h2>
            <motion.p variants={headingVariants} className="mt-1.5 text-sm text-neutral-500">
              Our most loved picks - freshly stocked and ready to ship
            </motion.p>
          </div>

          <motion.div variants={headingVariants}>
            <Link href="/products?featured=true">
              <motion.span
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(232,70,114,0.18)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 px-5 py-2.5 text-sm font-semibold"
                style={{
                  borderColor: "#E84672",
                  color: "#E84672",
                  backgroundColor: "transparent",
                }}
              >
                View All
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                >
                  <RiArrowRightLine size={15} />
                </motion.span>
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"
        >
          {products.map((p) => (
            <motion.div key={p._id as string} variants={cardVariants}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.55, ease: smoothEase }}
          className="mt-12 flex flex-col items-center justify-between gap-5 rounded-3xl p-7 sm:flex-row"
          style={{
            background: "linear-gradient(135deg, #2a2518 0%, #4d4529 50%, #7A6E42 100%)",
          }}
        >
          <div>
            <p
              className="mb-1 text-xs font-bold tracking-widest uppercase"
              style={{ color: "#FFE08A" }}
            >
              Limited Stock
            </p>
            <h3 className="text-lg leading-tight font-bold text-white">
              Explore our full catalogue of 200+ products
            </h3>
            <p className="mt-1 text-sm" style={{ color: "#D4CFB3" }}>
              Spices, dry fruits, nuts, and gift hampers - all under one roof.
            </p>
          </div>
          <Link href="/products" className="flex-shrink-0">
            <motion.span
              whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(0,0,0,0.25)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl px-6 py-3 text-sm font-bold"
              style={{ backgroundColor: "#FFE08A", color: "#2a2518" }}
            >
              <RiShoppingCartLine size={16} />
              Shop All Products
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
