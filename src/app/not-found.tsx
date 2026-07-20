"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  RiArrowRightLine,
  RiHomeLine,
  RiSearchLine,
  RiCompassDiscoverLine,
  RiLeafLine,
} from "react-icons/ri";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];


const particles = [
  { x: "12%", y: "18%", size: 6, delay: 0, duration: 4.2 },
  { x: "82%", y: "14%", size: 4, delay: 0.5, duration: 3.8 },
  { x: "8%", y: "72%", size: 8, delay: 1, duration: 5 },
  { x: "88%", y: "65%", size: 5, delay: 0.3, duration: 4.5 },
  { x: "50%", y: "8%", size: 3, delay: 0.8, duration: 3.5 },
  { x: "72%", y: "82%", size: 6, delay: 1.2, duration: 4.8 },
  { x: "28%", y: "88%", size: 4, delay: 0.6, duration: 4.1 },
  { x: "92%", y: "38%", size: 5, delay: 0.2, duration: 3.9 },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-8 text-center"
      style={{ backgroundColor: "#FFFDF7" }}
    >
      
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: "radial-gradient(circle, #7A6E42 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,249,232,0.9) 0%, transparent 70%)",
        }}
      />

      
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: i % 2 === 0 ? "#E84672" : "#7A6E42",
            opacity: 0.18,
          }}
          animate={{ y: [0, -14, 0], opacity: [0.18, 0.32, 0.18] }}
          transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute top-8 left-8 flex items-center gap-2 text-[0.6rem] font-black tracking-[0.22em] uppercase"
        style={{ color: "#B8AE86" }}
      >
        <RiLeafLine size={11} style={{ color: "#E84672" }} />
        LotusMart
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="absolute top-8 right-8 text-[0.62rem] font-bold tracking-widest uppercase"
        style={{ color: "#D4CFB3" }}
      >
        Home / <span style={{ color: "#E84672" }}>404</span>
      </motion.div>

      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex max-w-lg flex-col items-center"
      >
        
        <div className="relative mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease }}
            className="pointer-events-none select-none"
            style={{
              fontSize: "clamp(7rem, 18vw, 11rem)",
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              background: "linear-gradient(135deg, #F7F6F0 0%, #EBE8D8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl"
              style={{ background: "linear-gradient(135deg, #2A2518, #4D4529)" }}
            >
              <RiCompassDiscoverLine size={40} color="#FFE08A" />
            </motion.div>
          </motion.div>
        </div>

        
        <motion.div variants={itemVariants} className="mb-2 flex items-center gap-3">
          <span className="h-px w-8" style={{ backgroundColor: "#D4CFB3" }} />
          <span
            className="text-[0.6rem] font-black tracking-[0.22em] uppercase"
            style={{ color: "#B8AE86" }}
          >
            Page Not Found
          </span>
          <span className="h-px w-8" style={{ backgroundColor: "#D4CFB3" }} />
        </motion.div>

        
        <motion.h1
          variants={itemVariants}
          className="mb-4 text-[2rem] leading-tight font-black tracking-tight text-neutral-900"
        >
          This page{" "}
          <span className="relative inline-block">
            <span className="relative z-10" style={{ color: "#E84672" }}>
              wandered off
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.45, ease }}
              className="absolute right-0 bottom-0.5 left-0 h-[3px] origin-left rounded-full"
              style={{ backgroundColor: "#E84672", opacity: 0.22 }}
            />
          </span>
        </motion.h1>

        
        <motion.p
          variants={itemVariants}
          className="mb-8 max-w-sm text-[0.92rem] leading-[1.78] text-neutral-500"
        >
          Looks like this page took a detour through the spice fields. Let's guide you back to our
          premium collection.
        </motion.p>

        {/* Suggestion chips */}
        <motion.div variants={itemVariants} className="mb-8 flex flex-wrap justify-center gap-2">
          {["Spices", "Dry Fruits", "Gift Boxes", "Organic"].map((tag, i) => (
            <Link key={tag} href={`/categories/${tag.toLowerCase().replace(" ", "-")}`}>
              <motion.span
                whileHover={{ y: -2, backgroundColor: "#FFF1F3", color: "#E84672" }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border px-3 py-1.5 text-[0.75rem] font-semibold transition-colors"
                style={{ borderColor: "#EBE8D8", color: "#57534e", backgroundColor: "#FAFAF9" }}
              >
                <RiLeafLine size={11} style={{ color: "#7A6E42" }} />
                {tag}
              </motion.span>
            </Link>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3">
          <Link href="/">
            <motion.span
              whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(42,37,24,0.22)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-3 text-[0.88rem] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2A2518, #4D4529)" }}
            >
              <RiHomeLine size={16} />
              Back to Home
            </motion.span>
          </Link>
          <Link href="/products">
            <motion.span
              whileHover={{ y: -3, boxShadow: "0 10px 24px rgba(232,70,114,0.18)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 px-6 py-3 text-[0.88rem] font-bold"
              style={{ borderColor: "#E84672", color: "#E84672", backgroundColor: "transparent" }}
            >
              <RiSearchLine size={16} />
              Browse Products
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                <RiArrowRightLine size={14} />
              </motion.span>
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom micro text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 flex items-center gap-3 text-[0.62rem] font-bold tracking-widest uppercase"
        style={{ color: "#D4CFB3" }}
      >
        <span>LotusMart</span>
        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: "#E84672" }} />
        <span>Premium Grocery</span>
        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: "#E84672" }} />
        <span>Est. 2000</span>
      </motion.div>
    </div>
  );
}
