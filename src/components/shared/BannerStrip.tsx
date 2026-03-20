"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RiArrowRightLine } from "react-icons/ri";

export function BannerStrip() {
  return (
    <section style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
      <div className="container-wide">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Banner 1 — Spice Bundle */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              position: "relative",
              borderRadius: "1.5rem",
              overflow: "hidden",
              background: "linear-gradient(135deg, #4D4529 0%, #7A6E42 100%)",
              padding: "2.5rem",
              minHeight: "200px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Background emoji */}
            <div
              style={{
                position: "absolute",
                right: "1.5rem",
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                fontSize: "6rem",
                opacity: 0.2,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              🌶️
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#FFE8A1",
                  marginBottom: "0.5rem",
                }}
              >
                Limited Time
              </p>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  marginBottom: "0.5rem",
                }}
              >
                Spice Bundle Offer
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#D4CFB3",
                  marginBottom: "1.25rem",
                  lineHeight: 1.6,
                }}
              >
                Get 20% off on any 5-spice combo box
              </p>
              <Link
                href="/products?category=spices"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#FFE8A1",
                  textDecoration: "none",
                  transition: "gap 0.2s",
                }}
              >
                Shop Now <RiArrowRightLine size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Banner 2 — Gift Boxes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              position: "relative",
              borderRadius: "1.5rem",
              overflow: "hidden",
              background: "linear-gradient(135deg, #E84672 0%, #C9305A 100%)",
              padding: "2.5rem",
              minHeight: "200px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Background emoji */}
            <div
              style={{
                position: "absolute",
                right: "1.5rem",
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                fontSize: "6rem",
                opacity: 0.2,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              🎁
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#FFD6E0",
                  marginBottom: "0.5rem",
                }}
              >
                Corporate &amp; Weddings
              </p>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  marginBottom: "0.5rem",
                }}
              >
                Custom Gift Boxes
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#FFD6E0",
                  marginBottom: "1.25rem",
                  lineHeight: 1.6,
                }}
              >
                Personalised hampers from ₹799. Bulk discounts available.
              </p>
              <Link
                href="/categories/gift-boxes"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#FFD6E0",
                  textDecoration: "none",
                  transition: "gap 0.2s",
                }}
              >
                Explore Gifts <RiArrowRightLine size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
