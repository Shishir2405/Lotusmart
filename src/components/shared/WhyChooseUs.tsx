"use client";

import { motion } from "framer-motion";
import {
  RiLeafLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiCustomerService2Line,
  RiAwardLine,
  RiHeartLine,
} from "react-icons/ri";

const features = [
  {
    icon: RiLeafLine,
    title: "100% Natural",
    desc: "No artificial colours, flavours or preservatives. Just pure, honest ingredients.",
    iconColor: "#16A34A",
    iconBg: "#F0FDF4",
  },
  {
    icon: RiShieldCheckLine,
    title: "FSSAI Certified",
    desc: "All products meet India's highest food safety standards. Tested before every batch.",
    iconColor: "#2563EB",
    iconBg: "#EFF6FF",
  },
  {
    icon: RiTruckLine,
    title: "Fast Delivery",
    desc: "Delivered in 2–5 business days. Free shipping on orders above ₹500.",
    iconColor: "#D97706",
    iconBg: "#FFFBEB",
  },
  {
    icon: RiAwardLine,
    title: "Premium Grade",
    desc: "We source only the top-grade produce — extra bold, AA, and supreme quality selections.",
    iconColor: "#7C3AED",
    iconBg: "#F5F3FF",
  },
  {
    icon: RiCustomerService2Line,
    title: "Expert Support",
    desc: "Our team is available Mon–Sat, 9AM–7PM to assist you with any query.",
    iconColor: "#E84672",
    iconBg: "#FFF1F3",
  },
  {
    icon: RiHeartLine,
    title: "Easy Returns",
    desc: "Not satisfied? Return within 7 days for a full refund — no questions asked.",
    iconColor: "#7A6E42",
    iconBg: "#F7F6F0",
  },
];

export function WhyChooseUs() {
  return (
    <section style={{ backgroundColor: "#F7F6F0", paddingTop: "5rem", paddingBottom: "5rem" }}>
      <div className="container-wide">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 700,
              color: "#1c1917",
              marginBottom: "0.75rem",
            }}
          >
            Why Choose LotusMart
          </h2>
          <p
            style={{
              color: "#78716c",
              fontSize: "1rem",
              maxWidth: "28rem",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            We&apos;re not just a store — we&apos;re your partner for a healthier, more flavourful
            kitchen.
          </p>
        </div>

        {/* Cards grid — CSS grid with inline styles so it ALWAYS renders */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "1rem",
                padding: "1.75rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                cursor: "default",
              }}
              whileHover={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10)", y: -2 }}
            >
              {/* Icon badge */}
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.75rem",
                  backgroundColor: f.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <f.icon size={22} style={{ color: f.iconColor }} />
              </div>

              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#1c1917",
                  marginBottom: "0.5rem",
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#78716c", lineHeight: 1.65, margin: 0 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
