"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const categories = [
  {
    name: "Whole Spices",
    slug: "whole-spices",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop",
    count: "40+ items",
    bgFrom: "#FFF7ED",
    bgTo: "#FFEDD5",
    borderColor: "#FED7AA",
  },
  {
    name: "Ground Spices",
    slug: "ground-spices",
    image: "https://images.unsplash.com/photo-1567540673239-b0e5ae6bdfe0?w=200&h=200&fit=crop",
    count: "30+ items",
    bgFrom: "#FFFBEB",
    bgTo: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  {
    name: "Dry Fruits",
    slug: "dry-fruits",
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=200&h=200&fit=crop",
    count: "25+ items",
    bgFrom: "#FEFCE8",
    bgTo: "#FEF9C3",
    borderColor: "#FEF08A",
  },
  {
    name: "Nuts & Seeds",
    slug: "nuts-seeds",
    image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&h=200&fit=crop",
    count: "20+ items",
    bgFrom: "#FAFAF9",
    bgTo: "#F5F5F4",
    borderColor: "#E7E5E4",
  },
  {
    name: "Gift Boxes",
    slug: "gift-boxes",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop",
    count: "15+ sets",
    bgFrom: "#FFF1F2",
    bgTo: "#FFE4E6",
    borderColor: "#FECDD3",
  },
  {
    name: "Organic Range",
    slug: "organic",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=200&fit=crop",
    count: "10+ items",
    bgFrom: "#F0FDF4",
    bgTo: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
];

export function CategoryGrid() {
  return (
    <section style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="container-wide">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 700,
              color: "#1c1917",
              marginBottom: "0.625rem",
            }}
          >
            Shop by Category
          </h2>
          <p style={{ color: "#78716c", fontSize: "1rem", maxWidth: "24rem", margin: "0 auto" }}>
            Explore our curated collection of premium ingredients
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
          }}
          className="category-grid"
        >
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1.25rem 1rem",
                  borderRadius: "1rem",
                  background: `linear-gradient(160deg, ${cat.bgFrom}, ${cat.bgTo})`,
                  border: `1px solid ${cat.borderColor}`,
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Image */}
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    position: "relative",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* Text */}
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#292524",
                      marginBottom: "0.125rem",
                    }}
                  >
                    {cat.name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#78716c", margin: 0 }}>{cat.count}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
