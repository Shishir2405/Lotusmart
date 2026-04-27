"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
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
  RiPlantLine,
  RiGiftLine,
  RiSeedlingLine,
} from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";


const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const trustItems = [
  { icon: RiShieldCheckLine, label: "FSSAI Certified" },
  { icon: RiLeafLine, label: "100% Natural" },
  { icon: RiTruckLine, label: "Free Shipping 499+" },
];

const categories = [
  { icon: RiSeedlingLine, title: "Premium Spices", desc: "200+ varieties", emoji: "\u{1F336}\u{FE0F}" },
  { icon: RiPlantLine, title: "Dry Fruits & Nuts", desc: "Premium quality", emoji: "\u{1F95C}" },
  { icon: RiGiftLine, title: "Curated Gift Boxes", desc: "Handpicked hampers", emoji: "\u{1F381}" },
];


const floatingSpices = [
  { emoji: "\u{1F336}\u{FE0F}", top: "8%", left: "78%", size: "1.5rem", delay: 0, opacity: 0.12 },
  { emoji: "\u{1FAD0}", top: "18%", left: "88%", size: "1.1rem", delay: 0.5, opacity: 0.09 },
  { emoji: "\u{1F33F}", top: "45%", left: "82%", size: "1.3rem", delay: 1.0, opacity: 0.1 },
  { emoji: "\u{1F95C}", top: "65%", left: "90%", size: "1rem", delay: 1.5, opacity: 0.08 },
  { emoji: "\u{1F33E}", top: "80%", left: "75%", size: "1.2rem", delay: 2.0, opacity: 0.09 },
  { emoji: "\u{1F336}\u{FE0F}", top: "30%", left: "5%", size: "1rem", delay: 0.8, opacity: 0.07 },
  { emoji: "\u{1FAD0}", top: "72%", left: "10%", size: "1.3rem", delay: 1.3, opacity: 0.1 },
  { emoji: "\u{1F33F}", top: "12%", left: "15%", size: "1.1rem", delay: 1.8, opacity: 0.08 },
];


function SpiceBowlDecoration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <circle cx="60" cy="60" r="45" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      
      <circle cx="60" cy="45" r="4" fill="currentColor" opacity="0.2" />
      <circle cx="48" cy="55" r="3.5" fill="currentColor" opacity="0.15" />
      <circle cx="72" cy="55" r="3.5" fill="currentColor" opacity="0.15" />
      <circle cx="54" cy="66" r="3" fill="currentColor" opacity="0.12" />
      <circle cx="66" cy="66" r="3" fill="currentColor" opacity="0.12" />
      <circle cx="60" cy="58" r="5" fill="currentColor" opacity="0.18" />
      
      <path d="M30 75 Q60 95 90 75" stroke="currentColor" strokeWidth="1" opacity="0.1" />
    </svg>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden h-full flex-col overflow-hidden lg:flex">
      
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1a1208 0%, #2d1a0a 25%, #3a1f0e 40%, #1f1610 60%, #1a1208 100%)",
        }}
      />

      
      <div className="absolute -right-10 -top-10 text-amber-400">
        <SpiceBowlDecoration className="h-56 w-56" />
      </div>
      <div className="absolute -bottom-8 -left-8 text-orange-300">
        <SpiceBowlDecoration className="h-44 w-44" />
      </div>
      <div className="absolute right-16 bottom-32 text-yellow-500">
        <SpiceBowlDecoration className="h-28 w-28" />
      </div>

      
      <div
        className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #F4A623 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #E8891C 0%, transparent 70%)" }}
      />

      
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #D4A31E 1px, transparent 1px), radial-gradient(circle at 75% 75%, #8B4513 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      
      <div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-30"
        style={{
          background: "linear-gradient(to top, #F4A623, transparent)",
        }}
      />

      
      <svg
        className="absolute bottom-0 left-0 right-0 h-24 w-full text-[#D4A31E]/[0.06]"
        viewBox="0 0 400 80"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 60 Q50 20 100 50 T200 40 T300 55 T400 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M0 70 Q80 40 160 65 T320 50 T400 60" stroke="currentColor" strokeWidth="1" fill="none" />
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
            y: [0, -8, 0],
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

      
      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        
        <Link href="/" className="inline-flex w-fit items-center gap-0.5">
          <span className="text-xl font-extrabold tracking-tight text-white">
            Lotus
          </span>
          <span className="text-xl font-extrabold tracking-tight text-[#E84672]">
            Mart
          </span>
        </Link>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
        >
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#F4A623]/60">
            Premium Grocery
          </p>
          <h2 className="text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-white italic">
            The finest flavours,
            <br />
            <span className="not-italic text-[#F4A623]/90">at your doorstep.</span>
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
            Over 200 premium spices, dry fruits, and gift collections — handpicked and delivered fresh across India.
          </p>

          
          <div className="mt-6 flex gap-3">
            {categories.map(({ icon: Icon, title, desc, emoji }) => (
              <div
                key={title}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.04] px-3.5 py-3 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
              >
                <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4A623]/10">
                  <span className="text-xs">{emoji}</span>
                </div>
                <p className="text-[0.72rem] font-semibold text-white/70">{title}</p>
                <p className="mt-0.5 text-[0.6rem] text-white/30">{desc}</p>
              </div>
            ))}
          </div>

          
          <div className="mt-5 flex flex-wrap gap-4">
            {trustItems.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-[#D4A31E]/50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#D4A31E]/10">
                  <Icon size={11} className="text-[#D4A31E]/70" />
                </span>
                {label}
              </span>
            ))}
          </div>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: "200+", label: "Premium spices" },
            { value: "FSSAI", label: "Certified quality" },
            { value: "Free", label: "Delivery 499+" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#F4A623]/[0.08] bg-[#F4A623]/[0.04] p-4 backdrop-blur-sm"
            >
              <p className="text-lg font-bold tracking-tight text-[#F4A623]/90">
                {stat.value}
              </p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-wider text-white/40">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}


function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
    if (!validate()) return;
    try {
      await login({ email, password }, callbackUrl);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message ?? "Unable to sign in. Please try again."
        : err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";
      setFormError(msg);
    }
  };

  const inputCls = (field: string, hasError?: string) =>
    `w-full rounded-xl border bg-white/60 py-3 pl-10 pr-4 text-sm font-medium text-neutral-800
     placeholder:text-neutral-400 outline-none transition-all duration-200
     ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-neutral-200 focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/10"}
     ${focused === field && !hasError ? "border-[#E84672] ring-2 ring-[#E84672]/10" : ""}`;

  return (
    <div className="flex h-full w-full flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
      
      <div className="mb-10 flex items-center justify-between lg:hidden">
        <Link href="/" className="inline-flex items-center gap-0.5">
          <span className="text-xl font-extrabold tracking-tight text-neutral-800">
            Lotus
          </span>
          <span className="text-xl font-extrabold tracking-tight text-[#E84672]">
            Mart
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Back to store
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="mx-auto w-full max-w-[380px]"
      >
        
        <div className="mb-6">
          <h1 className="text-[1.75rem] font-bold tracking-tight text-neutral-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Sign in to access your orders, wishlist, and offers.
          </p>
        </div>

        <div className="mb-5">
          <GoogleSignInButton callbackUrl={callbackUrl} text="signin_with" />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-neutral-100" />
          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-neutral-300">
            or sign in with email
          </span>
          <span className="h-px flex-1 bg-neutral-100" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600"
              >
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Email
            </label>
            <div className="relative">
              <RiMailLine
                size={15}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused === "email" ? "text-[#E84672]" : "text-neutral-300"}`}
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
                className={inputCls("email", errors.email)}
              />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs font-medium text-red-500"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#E84672] transition-colors hover:text-[#C9305A]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <RiLockLine
                size={15}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused === "password" ? "text-[#E84672]" : "text-neutral-300"}`}
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
                className={`${inputCls("password", errors.password)} !pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-300 transition-colors hover:text-neutral-500"
                tabIndex={-1}
              >
                {showPassword ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs font-medium text-red-500"
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { y: -1 } : {}}
            whileTap={!isLoading ? { scale: 0.985 } : {}}
            className="group/btn relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(232,70,114,0.6)] transition-all duration-300 hover:shadow-[0_12px_28px_-6px_rgba(232,70,114,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background:
                "linear-gradient(120deg, #E84672 0%, #F25C82 35%, #F4A623 100%)",
              backgroundSize: "200% 100%",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full"
            />
            <span className="relative flex items-center gap-2">
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <RiArrowRightLine size={15} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </>
              )}
            </span>
          </motion.button>
        </form>

        
        <p className="mt-6 text-center text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#E84672] transition-colors hover:text-[#C9305A]"
          >
            Create one
          </Link>
        </p>

        
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-neutral-100" />
          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-neutral-300">
            or
          </span>
          <span className="h-px flex-1 bg-neutral-100" />
        </div>

        
        <Link href="/checkout">
          <div className="group flex cursor-pointer items-center justify-between rounded-xl border border-neutral-150 px-4 py-3 transition-all hover:border-neutral-200 hover:bg-neutral-50/50">
            <div>
              <p className="text-sm font-medium text-neutral-600">
                Continue as guest
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                No account needed
              </p>
            </div>
            <RiArrowRightLine
              size={14}
              className="text-neutral-300 transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </Link>

        
        <p className="mt-8 text-center text-[0.65rem] text-neutral-300">
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-neutral-400">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-neutral-400">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-col overflow-y-auto bg-[#FAFAF9]">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
