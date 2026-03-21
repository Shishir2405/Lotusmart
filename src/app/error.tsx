"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiRefreshLine, RiHomeLine, RiAlertLine, RiCodeLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Animated broken-glass shards */
const shards = [
  { x: -60, y: -40, rotate: -18, scale: 0.9, delay: 0 },
  { x: 30, y: -55, rotate: 12, scale: 0.75, delay: 0.05 },
  { x: -20, y: 30, rotate: -8, scale: 1.1, delay: 0.1 },
  { x: 55, y: 15, rotate: 24, scale: 0.85, delay: 0.08 },
  { x: -45, y: 55, rotate: -30, scale: 0.7, delay: 0.12 },
  { x: 40, y: 60, rotate: 15, scale: 0.95, delay: 0.06 },
];

function BrokenCircle({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Central icon circle */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl"
        style={{ background: "linear-gradient(135deg, #E84672, #C9305A)" }}
      >
        <RiAlertLine size={42} color="#fff" />
      </motion.div>

      {/* Orbiting broken fragments */}
      {shards.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0 }}
          animate={{ opacity: 0.18, x: s.x, y: s.y, rotate: s.rotate, scale: s.scale }}
          transition={{ duration: 0.7, delay: s.delay, ease }}
          className="absolute h-10 w-10 rounded-xl"
          style={{ background: "linear-gradient(135deg, #E84672, #C9305A)" }}
        />
      ))}

      {/* Pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.15, 0, 0.15] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="absolute h-32 w-32 rounded-full"
        style={{ border: `2px solid #E84672` }}
      />
    </div>
  );
}

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const [showCode, setShowCode] = useState(false);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-8 text-center"
      style={{ backgroundColor: "#FFFDF7" }}
    >
      {/* Background texture grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#E84672 1px, transparent 1px), linear-gradient(90deg, #E84672 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top-left micro label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute top-8 left-8 flex items-center gap-2 text-[0.62rem] font-black tracking-[0.2em] uppercase"
        style={{ color: "#B8AE86" }}
      >
        <span className="h-px w-4" style={{ backgroundColor: "#E84672" }} />
        LotusMart
      </motion.div>

      {/* Top-right status pill */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="absolute top-8 right-8 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.62rem] font-bold tracking-widest uppercase"
        style={{ backgroundColor: "#FFF1F3", border: "1px solid #FECDD3", color: "#E84672" }}
      >
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: "#E84672" }}
        />
        Error Detected
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="flex max-w-md flex-col items-center"
      >
        {/* Icon */}
        <div className="mb-10">
          <BrokenCircle color="#E84672" />
        </div>

        {/* Error code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
          className="mb-2"
        >
          <span
            className="text-[0.62rem] font-black tracking-[0.3em] uppercase"
            style={{ color: "#B8AE86" }}
          >
            Runtime Error · Code 500
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease }}
          className="mb-3 text-[2.2rem] leading-tight font-black tracking-tight text-neutral-900"
        >
          Something{" "}
          <span className="relative inline-block" style={{ color: "#E84672" }}>
            Broke
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.4, ease }}
              className="absolute right-0 bottom-0.5 left-0 h-[3px] origin-left rounded-full"
              style={{ backgroundColor: "#E84672", opacity: 0.25 }}
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease }}
          className="mb-2 max-w-sm text-[0.93rem] leading-relaxed text-neutral-500"
        >
          An unexpected error occurred. Our team has been notified and is working on a fix.
        </motion.p>

        {/* Live "fixing" indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8 text-[0.68rem] font-bold tracking-widest uppercase"
          style={{ color: "#D4CFB3" }}
        >
          Auto-diagnosing{dots}
        </motion.p>

        {/* Error message toggle */}
        <AnimatePresence>
          {error.message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mb-7 w-full"
            >
              <button
                onClick={() => setShowCode((v) => !v)}
                className="mb-2 flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-[0.7rem] font-bold tracking-wider uppercase"
                style={{ color: "#9C8F62" }}
              >
                <RiCodeLine size={12} />
                {showCode ? "Hide" : "Show"} error details
              </button>
              <AnimatePresence>
                {showCode && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl p-4 text-left font-mono text-[0.75rem] leading-relaxed"
                    style={{
                      backgroundColor: "#1c1914",
                      color: "#D4CFB3",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ color: "#E84672" }}>Error: </span>
                    {error.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease }}
          className="flex flex-wrap justify-center gap-3"
        >
          <motion.button
            whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(232,70,114,0.22)" }}
            whileTap={{ scale: 0.97 }}
            onClick={reset}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-3 text-[0.88rem] font-bold text-white"
            style={{ backgroundColor: "#E84672", border: "none" }}
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <RiRefreshLine size={16} />
            </motion.span>
            Try Again
          </motion.button>
          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => (window.location.href = "/")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 px-6 py-3 text-[0.88rem] font-bold"
            style={{ borderColor: "#EBE8D8", color: "#44403c", backgroundColor: "transparent" }}
          >
            <RiHomeLine size={16} />
            Go Home
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Bottom micro text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-[0.62rem] font-semibold tracking-widest uppercase"
        style={{ color: "#D4CFB3" }}
      >
        LotusMart · support@lotusmart.com
      </motion.p>
    </div>
  );
}
