"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RiArrowRightLine } from "react-icons/ri";

export function BannerStrip() {
  return (
    <section className="container-wide py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Banner 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4D4529] to-[#7A6E42] p-8 text-white min-h-[180px] flex items-center"
        >
          <div className="absolute right-6 top-0 bottom-0 flex items-center text-8xl opacity-20">🌶️</div>
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FFE8A1] mb-2">Limited Time</p>
            <h3 className="text-2xl font-bold mb-1">Spice Bundle Offer</h3>
            <p className="text-sm text-[#D4CFB3] mb-4">Get 20% off on any 5-spice combo box</p>
            <Link
              href="/products?category=spices"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFE8A1] hover:gap-2.5 transition-all"
            >
              Shop Now <RiArrowRightLine size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Banner 2 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#E84672] to-[#C9305A] p-8 text-white min-h-[180px] flex items-center"
        >
          <div className="absolute right-6 top-0 bottom-0 flex items-center text-8xl opacity-20">🎁</div>
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FFD6E0] mb-2">Corporate & Weddings</p>
            <h3 className="text-2xl font-bold mb-1">Custom Gift Boxes</h3>
            <p className="text-sm text-[#FFD6E0] mb-4">Personalised hampers from ₹799. Bulk discounts available.</p>
            <Link
              href="/categories/gift-boxes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFD6E0] hover:gap-2.5 transition-all"
            >
              Explore Gifts <RiArrowRightLine size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
