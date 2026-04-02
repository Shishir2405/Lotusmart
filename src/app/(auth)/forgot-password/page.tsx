"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiMailLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiArrowRightLine,
} from "react-icons/ri";
import axios from "axios";
import toast from "@/components/ui/toast";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];


const floatingSpices = [
  { emoji: "\u{1F336}\u{FE0F}", top: "10%", left: "8%", size: "1.5rem", delay: 0, opacity: 0.08 },
  { emoji: "\u{1FAD0}", top: "15%", left: "85%", size: "1.2rem", delay: 0.5, opacity: 0.07 },
  { emoji: "\u{1F33F}", top: "70%", left: "10%", size: "1.3rem", delay: 1.0, opacity: 0.06 },
  { emoji: "\u{1F95C}", top: "75%", left: "88%", size: "1.1rem", delay: 1.5, opacity: 0.07 },
  { emoji: "\u{1F33E}", top: "40%", left: "5%", size: "1rem", delay: 2.0, opacity: 0.05 },
  { emoji: "\u{1F336}\u{FE0F}", top: "50%", left: "92%", size: "1.1rem", delay: 0.8, opacity: 0.06 },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Something went wrong";
      toast.error(msg ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden">
      
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #FAFAF9 0%, #FFF8F0 30%, #FEF3E2 60%, #FFF8F0 80%, #FAFAF9 100%)",
        }}
      />

      
      <div
        className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "radial-gradient(circle, #F4A623 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 h-48 w-48 rounded-full opacity-[0.05] blur-3xl"
        style={{ background: "radial-gradient(circle, #D4A31E 0%, transparent 70%)" }}
      />

      
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 45%, #8B4513 1px, transparent 1px), radial-gradient(circle at 75% 55%, #D4A31E 0.8px, transparent 0.8px)",
          backgroundSize: "32px 32px, 44px 44px",
        }}
      />

      
      <svg
        className="absolute top-0 left-0 h-40 w-40 text-[#F4A623]/[0.05]"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 0 Q40 30 20 60 T40 120" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="30" r="4" fill="currentColor" opacity="0.3" />
        <circle cx="28" cy="60" r="3" fill="currentColor" opacity="0.2" />
        <circle cx="35" cy="90" r="3.5" fill="currentColor" opacity="0.15" />
      </svg>
      <svg
        className="absolute bottom-0 right-0 h-40 w-40 rotate-180 text-[#D4A31E]/[0.05]"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 0 Q40 30 20 60 T40 120" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="30" r="4" fill="currentColor" opacity="0.3" />
        <circle cx="28" cy="60" r="3" fill="currentColor" opacity="0.2" />
        <circle cx="35" cy="90" r="3.5" fill="currentColor" opacity="0.15" />
      </svg>

      
      {floatingSpices.map((spice, i) => (
        <motion.div
          key={i}
          className="absolute z-[1] select-none"
          style={{ top: spice.top, left: spice.left, fontSize: spice.size, opacity: spice.opacity }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: spice.opacity,
            scale: 1,
            y: [0, -6, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: spice.delay },
            scale: { duration: 0.8, delay: spice.delay },
            y: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: spice.delay },
          }}
        >
          {spice.emoji}
        </motion.div>
      ))}

      
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #F4A623, #E84672, #D4A31E)" }} />

      
      <Link href="/" className="relative z-10 mb-10 inline-flex items-center gap-0.5">
        <span className="text-xl font-extrabold tracking-tight text-neutral-800">Lotus</span>
        <span className="text-xl font-extrabold tracking-tight text-[#E84672]">Mart</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {sent ? (
              
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
                className="text-center"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <RiCheckLine className="text-emerald-500" size={28} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  If an account exists for{" "}
                  <strong className="font-medium text-neutral-600">{email}</strong>,
                  you&apos;ll receive a password reset link shortly.
                </p>
                <p className="mt-4 text-xs text-neutral-300">
                  Didn&apos;t receive the email? Check your spam folder.
                </p>

                <div className="mt-6 space-y-2.5">
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="w-full cursor-pointer rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                  >
                    Try a different email
                  </button>
                  <Link href="/login">
                    <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E84672] py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-md">
                      Back to Login
                      <RiArrowRightLine size={14} />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
              >
                <Link
                  href="/login"
                  className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
                >
                  <RiArrowLeftLine size={13} />
                  Back to login
                </Link>

                <div className="mb-6">
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                    Forgot password?
                  </h1>
                  <p className="mt-1.5 text-sm text-neutral-400">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Email
                    </label>
                    <div className="relative">
                      <RiMailLine
                        size={15}
                        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused ? "text-[#E84672]" : "text-neutral-300"}`}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`w-full rounded-xl border bg-white/60 py-3 pl-10 pr-4 text-sm font-medium text-neutral-800 placeholder:text-neutral-400 outline-none transition-all duration-200 ${
                          error
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-neutral-200 focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/10"
                        }`}
                      />
                    </div>
                    {error && (
                      <p className="text-xs font-medium text-red-500">{error}</p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { y: -1 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E84672] py-3 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <RiArrowRightLine size={14} />
                      </>
                    )}
                  </motion.button>
                </form>

                <p className="mt-6 text-center text-sm text-neutral-400">
                  Remember your password?{" "}
                  <Link href="/login" className="font-semibold text-[#E84672] transition-colors hover:text-[#C9305A]">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        
        <p className="mt-6 text-center text-[0.65rem] text-neutral-300">
          &copy; {new Date().getFullYear()} LotusMart. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
