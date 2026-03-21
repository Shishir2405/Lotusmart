"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  RiLeafLine, RiTruckLine, RiShieldCheckLine,
  RiCustomerService2Line, RiAwardLine, RiHeartLine,
  RiArrowRightLine,
} from "react-icons/ri";

const features = [
  {
    icon: RiLeafLine,
    index: "01",
    title: "100% Natural",
    desc: "No artificial colours, flavours or preservatives. Every ingredient is exactly what the label says — nothing more.",
    iconColor: "#16A34A",
    accentColor: "#16A34A",
    accentLight: "#F0FDF4",
    accentBorder: "#BBF7D0",
  },
  {
    icon: RiShieldCheckLine,
    index: "02",
    title: "FSSAI Certified",
    desc: "All products meet India's highest food safety standards. Each batch is lab-tested before it reaches your kitchen.",
    iconColor: "#2563EB",
    accentColor: "#2563EB",
    accentLight: "#EFF6FF",
    accentBorder: "#BFDBFE",
  },
  {
    icon: RiTruckLine,
    index: "03",
    title: "Fast Delivery",
    desc: "Delivered in 2–5 business days anywhere in India. Orders above ₹500 ship free — no minimum, no fine print.",
    iconColor: "#D97706",
    accentColor: "#D97706",
    accentLight: "#FFFBEB",
    accentBorder: "#FDE68A",
  },
  {
    icon: RiAwardLine,
    index: "04",
    title: "Premium Grade",
    desc: "We stock only extra bold, AA-grade selections. If it doesn't meet our standard, it doesn't ship. Simple.",
    iconColor: "#7C3AED",
    accentColor: "#7C3AED",
    accentLight: "#F5F3FF",
    accentBorder: "#DDD6FE",
  },
  {
    icon: RiCustomerService2Line,
    index: "05",
    title: "Expert Support",
    desc: "Real humans, Mon–Sat 9AM–7PM. Product advice, bulk quotes, or order help — we always pick up.",
    iconColor: "#E84672",
    accentColor: "#E84672",
    accentLight: "#FFF1F3",
    accentBorder: "#FECDD3",
  },
  {
    icon: RiHeartLine,
    index: "06",
    title: "Easy Returns",
    desc: "Return anything within 7 days for a full refund. No forms, no interrogation, no shipping cost. We trust you.",
    iconColor: "#7A6E42",
    accentColor: "#7A6E42",
    accentLight: "#F7F6F0",
    accentBorder: "#D4CFB3",
  },
];

const stats = [
  { value: "50K+", label: "Orders Delivered", sub: "and counting" },
  { value: "4.9★", label: "Customer Rating", sub: "out of 5.0" },
  { value: "200+", label: "Products", sub: "across 6 categories" },
  { value: "7 yr", label: "In Business", sub: "since 2017" },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function WhyChooseUs() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden py-16 lg:py-24" style={{ backgroundColor: "#FAFAF8" }}>

      {/* Faint dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: "radial-gradient(circle, #7A6E42 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-10" style={{ backgroundColor: "#E84672" }} />
              <span className="text-[0.58rem] font-black tracking-[0.28em] uppercase" style={{ color: "#B8AE86" }}>
                Our Promise
              </span>
            </div>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black leading-[0.96] tracking-[-0.04em] text-neutral-900">
              Why{" "}
              <span className="relative inline-block" style={{ color: "#E84672" }}>
                LotusMart
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.45, duration: 0.45, ease }}
                  className="absolute -bottom-0.5 left-0 right-0 h-[2px] origin-left rounded-full opacity-25"
                  style={{ backgroundColor: "#E84672" }}
                />
              </span>
              {" "}is Different.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.55, ease }}
            className="max-w-xs text-[0.82rem] leading-[1.85] text-neutral-400 font-medium"
          >
            We are obsessive about quality, transparency, and the belief that what you eat shapes who you are.
          </motion.p>
        </div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="grid grid-cols-2 lg:grid-cols-4 mb-14 rounded-2xl overflow-hidden"
          style={{ border: "1px solid #EBE8D8" }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ backgroundColor: "#FFF1F3" }}
              className="flex flex-col justify-between px-5 py-5 bg-white transition-colors"
              style={{ borderRight: i < 3 ? "1px solid #EBE8D8" : "none" }}
            >
              <span className="text-[0.55rem] font-black tracking-[0.22em] uppercase mb-3" style={{ color: "#C8BF9A" }}>
                {s.label}
              </span>
              <div>
                <span className="block text-[2rem] font-black leading-none tracking-tight" style={{ color: "#E84672" }}>
                  {s.value}
                </span>
                <span className="text-[0.62rem] font-semibold mt-1 block" style={{ color: "#B8AE86" }}>
                  {s.sub}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Feature rows ── */}
        <div style={{ borderTop: "1px solid #EBE8D8" }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.055, duration: 0.45, ease }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              className="relative cursor-default group"
              style={{ borderBottom: "1px solid #EBE8D8" }}
            >
              {/* Hover tint */}
              <motion.div
                animate={{ opacity: hovered === i ? 1 : 0 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: `${f.accentColor}06` }}
              />

              {/* Left accent bar */}
              <motion.div
                animate={{ scaleY: hovered === i ? 1 : 0, opacity: hovered === i ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full origin-bottom"
                style={{ backgroundColor: f.accentColor }}
              />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 py-4 px-3">

                {/* Index number */}
                <span
                  className="text-[0.52rem] font-black tracking-[0.22em] w-10 flex-shrink-0 transition-colors duration-200"
                  style={{ color: hovered === i ? f.accentColor : "#D4CFB3" }}
                >
                  {f.index}
                </span>

                {/* Icon */}
                <motion.div
                  animate={{
                    backgroundColor: hovered === i ? f.accentLight : "#F7F6F0",
                    scale: hovered === i ? 1.06 : 1,
                  }}
                  transition={{ duration: 0.18 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 sm:mr-5"
                  style={{ border: `1px solid ${hovered === i ? f.accentBorder : "#EBE8D8"}` }}
                >
                  <f.icon size={16} style={{ color: hovered === i ? f.iconColor : "#C8BF9A" }} />
                </motion.div>

                {/* Title */}
                <motion.span
                  animate={{ color: hovered === i ? f.accentColor : "#292524" }}
                  transition={{ duration: 0.18 }}
                  className="text-[0.88rem] font-black tracking-tight flex-shrink-0 sm:w-44"
                >
                  {f.title}
                </motion.span>

                {/* Desc */}
                <p className="flex-1 text-[0.78rem] leading-relaxed sm:pl-5 font-medium" style={{ color: "#a8a29e" }}>
                  {f.desc}
                </p>

                {/* Arrow */}
                <motion.span
                  animate={{ opacity: hovered === i ? 1 : 0, x: hovered === i ? 0 : -6 }}
                  transition={{ duration: 0.18 }}
                  className="hidden sm:flex flex-shrink-0 pl-5"
                  style={{ color: f.accentColor }}
                >
                  <RiArrowRightLine size={15} />
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}