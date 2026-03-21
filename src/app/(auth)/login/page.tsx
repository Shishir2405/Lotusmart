"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiMailLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiLeafLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiStarFill,
  RiArrowLeftLine,
} from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

/* ─────────────────────────────────────────────
   LEFT PANEL — image + brand story
───────────────────────────────────────────── */
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const testimonial = {
  text: "LotusMart has completely changed how I shop for spices. The quality is unlike anything I've found elsewhere.",
  author: "Priya Sharma",
  role: "Home Chef · Mumbai",
  avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&q=80",
  rating: 5,
};

const trustItems = [
  { icon: RiLeafLine, label: "100% Natural" },
  { icon: RiShieldCheckLine, label: "FSSAI Certified" },
  { icon: RiTruckLine, label: "Free Shipping ₹500+" },
];

function LeftPanel() {
  return (
    <div
      className="relative hidden h-full flex-col overflow-hidden lg:flex"
      style={{ background: "linear-gradient(160deg, #1c1610 0%, #2A2518 60%, #3a2408 100%)" }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&h=1200&fit=crop&q=80"
          alt="Spices"
          fill
          className="object-cover opacity-20"
          sizes="50vw"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(28,22,16,0.92) 0%, rgba(42,37,24,0.85) 50%, rgba(58,36,8,0.9) 100%)",
          }}
        />
      </div>

      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #FFE08A 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        {/* Top: Logo + back */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <motion.span
              whileHover={{ opacity: 0.85 }}
              className="inline-flex cursor-pointer items-center gap-0.5"
            >
              <span className="text-[1.35rem] leading-none font-black tracking-tight text-white">
                Lotus
              </span>
              <span
                className="text-[1.35rem] leading-none font-black tracking-tight"
                style={{ color: "#E84672" }}
              >
                Mart
              </span>
            </motion.span>
          </Link>
          <Link href="/">
            <motion.span
              whileHover={{ x: -3 }}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[0.72rem] font-bold"
              style={{ color: "#9C8F62" }}
            >
              <RiArrowLeftLine size={12} /> Back to store
            </motion.span>
          </Link>
        </div>

        {/* Center: headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
        >
          {/* Eyebrow */}
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.58rem] font-black tracking-[0.26em] uppercase"
              style={{ color: "#7A6E42" }}
            >
              Premium Grocery
            </span>
          </div>

          <h2 className="mb-5 text-[clamp(2rem,3.5vw,3rem)] leading-[0.95] font-black tracking-[-0.04em] text-white">
            The finest flavours,
            <br />
            <span style={{ color: "#FFE08A" }}>at your doorstep.</span>
          </h2>

          <p
            className="max-w-xs text-[0.82rem] leading-[1.85] font-medium"
            style={{ color: "#78716c" }}
          >
            Over 200 premium spices, dry fruits, and gift collections — handpicked and delivered
            fresh across India.
          </p>

          {/* Trust badges */}
          <div className="mt-7 flex flex-wrap gap-4">
            {trustItems.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[0.7rem] font-semibold"
                style={{ color: "#9C8F62" }}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(255,224,138,0.1)" }}
                >
                  <Icon size={11} style={{ color: "#FFE08A" }} />
                </span>
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Bottom: testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease }}
          className="rounded-2xl p-5"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Stars */}
          <div className="mb-3 flex gap-0.5">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <RiStarFill key={i} size={11} style={{ color: "#FFE08A" }} />
            ))}
          </div>
          <p
            className="mb-4 text-[0.78rem] leading-[1.75] font-medium"
            style={{ color: "#78716c" }}
          >
            &ldquo;{testimonial.text}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full"
              style={{ border: "1.5px solid rgba(255,224,138,0.2)" }}
            >
              <Image
                src={testimonial.avatar}
                alt={testimonial.author}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[0.72rem] leading-tight font-bold text-white">
                {testimonial.author}
              </p>
              <p className="text-[0.62rem] font-medium" style={{ color: "#615834" }}>
                {testimonial.role}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGIN FORM
───────────────────────────────────────────── */
function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focused, setFocused] = useState<string | null>(null);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login({ email, password }, callbackUrl);
    } catch {
      /* toast handled inside useAuth */
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-center px-6 py-12 sm:px-10 xl:px-16">
      {/* Mobile logo */}
      <div className="mb-10 flex items-center justify-between lg:hidden">
        <Link href="/">
          <span className="inline-flex items-center gap-0.5">
            <span className="text-[1.25rem] font-black tracking-tight" style={{ color: "#2A2518" }}>
              Lotus
            </span>
            <span className="text-[1.25rem] font-black tracking-tight" style={{ color: "#E84672" }}>
              Mart
            </span>
          </span>
        </Link>
        <Link href="/">
          <motion.span
            whileHover={{ x: -3 }}
            className="inline-flex cursor-pointer items-center gap-1 text-[0.72rem] font-bold"
            style={{ color: "#B8AE86" }}
          >
            <RiArrowLeftLine size={12} /> Back
          </motion.span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="mx-auto w-full max-w-sm"
      >
        {/* Header */}
        <div className="mb-9">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-px w-6" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.55rem] font-black tracking-[0.26em] uppercase"
              style={{ color: "#C8BF9A" }}
            >
              Welcome Back
            </span>
          </div>
          <h1 className="mb-1.5 text-[1.9rem] leading-tight font-black tracking-[-0.03em] text-neutral-900">
            Sign in to your
            <br />
            <span style={{ color: "#E84672" }}>account.</span>
          </h1>
          <p className="text-[0.78rem] font-medium" style={{ color: "#a8a29e" }}>
            Access your orders, wishlist, and exclusive offers.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label
              className="block text-[0.7rem] font-bold tracking-wide uppercase"
              style={{ color: "#9C8F62" }}
            >
              Email Address
            </label>
            <motion.div
              animate={{
                borderColor: errors.email ? "#ef4444" : focused === "email" ? "#E84672" : "#EBE8D8",
              }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-shadow"
              style={{
                backgroundColor: "#FAFAF8",
                border: "1.5px solid #EBE8D8",
                boxShadow: focused === "email" ? "0 0 0 3px rgba(232,70,114,0.08)" : "none",
              }}
            >
              <RiMailLine
                size={15}
                style={{ color: focused === "email" ? "#E84672" : "#C8BF9A", flexShrink: 0 }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                autoComplete="email"
                className="min-w-0 flex-1 border-none bg-transparent text-[0.84rem] font-medium outline-none"
                style={{ color: "#1c1917" }}
              />
            </motion.div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[0.68rem] font-semibold"
                  style={{ color: "#ef4444" }}
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="block text-[0.7rem] font-bold tracking-wide uppercase"
                style={{ color: "#9C8F62" }}
              >
                Password
              </label>
              <Link href="/forgot-password">
                <motion.span
                  whileHover={{ color: "#C9305A" }}
                  className="cursor-pointer text-[0.68rem] font-semibold transition-colors"
                  style={{ color: "#E84672" }}
                >
                  Forgot password?
                </motion.span>
              </Link>
            </div>
            <motion.div
              animate={{
                borderColor: errors.password
                  ? "#ef4444"
                  : focused === "password"
                    ? "#E84672"
                    : "#EBE8D8",
              }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                backgroundColor: "#FAFAF8",
                border: "1.5px solid #EBE8D8",
                boxShadow: focused === "password" ? "0 0 0 3px rgba(232,70,114,0.08)" : "none",
              }}
            >
              <RiLockLine
                size={15}
                style={{ color: focused === "password" ? "#E84672" : "#C8BF9A", flexShrink: 0 }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="min-w-0 flex-1 border-none bg-transparent text-[0.84rem] font-medium outline-none"
                style={{ color: "#1c1917" }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="flex-shrink-0 cursor-pointer"
                style={{ background: "none", border: "none", padding: 0, color: "#C8BF9A" }}
              >
                {showPassword ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
              </motion.button>
            </motion.div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[0.68rem] font-semibold"
                  style={{ color: "#ef4444" }}
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={
                !isLoading ? { y: -2, boxShadow: "0 12px 28px rgba(232,70,114,0.28)" } : {}
              }
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              transition={{ duration: 0.18 }}
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[0.88rem] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#E84672", border: "none" }}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <RiArrowRightLine size={16} />
                  </motion.span>
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-[0.76rem] font-medium" style={{ color: "#a8a29e" }}>
          Don't have an account?{" "}
          <Link href="/register">
            <motion.span
              whileHover={{ color: "#C9305A" }}
              className="cursor-pointer font-bold transition-colors"
              style={{ color: "#E84672" }}
            >
              Create one
            </motion.span>
          </Link>
        </p>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1" style={{ backgroundColor: "#F0EDE6" }} />
          <span
            className="text-[0.62rem] font-bold tracking-wider uppercase"
            style={{ color: "#D4CFB3" }}
          >
            or
          </span>
          <span className="h-px flex-1" style={{ backgroundColor: "#F0EDE6" }} />
        </div>

        {/* Guest */}
        <Link href="/checkout">
          <motion.div
            whileHover={{ borderColor: "#D4CFB3", backgroundColor: "#FAFAF8" }}
            transition={{ duration: 0.15 }}
            className="flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition-colors"
            style={{ border: "1.5px solid #EBE8D8", backgroundColor: "transparent" }}
          >
            <div>
              <p className="text-[0.76rem] font-bold" style={{ color: "#57534e" }}>
                Continue as guest
              </p>
              <p className="mt-0.5 text-[0.65rem] font-medium" style={{ color: "#C8BF9A" }}>
                No account needed — create one at checkout
              </p>
            </div>
            <RiArrowRightLine size={14} style={{ color: "#D4CFB3", flexShrink: 0 }} />
          </motion.div>
        </Link>

        {/* Bottom micro text */}
        <p className="mt-8 text-center text-[0.6rem] font-medium" style={{ color: "#D4CFB3" }}>
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2" style={{ color: "#B8AE86" }}>
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-2"
            style={{ color: "#B8AE86" }}
          >
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-2"
      style={{ backgroundColor: "#FFFDF7" }}
    >
      {/* Left — image panel */}
      <LeftPanel />

      {/* Right — form */}
      <div className="flex flex-col overflow-y-auto" style={{ backgroundColor: "#FFFDF7" }}>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
