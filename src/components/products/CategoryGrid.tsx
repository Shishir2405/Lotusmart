"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
  { name: "Whole Spices", slug: "whole-spices", emoji: "🌶️", count: "40+ items", color: "from-orange-50 to-orange-100", border: "border-orange-200" },
  { name: "Ground Spices", slug: "ground-spices", emoji: "🧂", count: "30+ items", color: "from-amber-50 to-amber-100", border: "border-amber-200" },
  { name: "Dry Fruits", slug: "dry-fruits", emoji: "🥜", count: "25+ items", color: "from-yellow-50 to-yellow-100", border: "border-yellow-200" },
  { name: "Nuts & Seeds", slug: "nuts-seeds", emoji: "🌰", count: "20+ items", color: "from-stone-50 to-stone-100", border: "border-stone-200" },
  { name: "Gift Boxes", slug: "gift-boxes", emoji: "🎁", count: "15+ sets", color: "from-rose-50 to-rose-100", border: "border-rose-200" },
  { name: "Organic Range", slug: "organic", emoji: "🌿", count: "10+ items", color: "from-green-50 to-green-100", border: "border-green-200" },
];

export function CategoryGrid() {
  return (
    <section className="container-wide py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">Shop by Category</h2>
        <p className="text-neutral-500">Explore our curated collection</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <Link
              href={`/categories/${cat.slug}`}
              className={`group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-b ${cat.color} border ${cat.border} hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center`}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                {cat.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-800">{cat.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{cat.count}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
