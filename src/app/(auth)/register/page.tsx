"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiUserLine,
  RiMailLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiLeafLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiGiftLine,
  RiHeartLine,
  RiPercentLine,
} from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const perks = [
  { icon: RiGiftLine, title: "Exclusive Offers", desc: "Members-only deals and early access" },
  { icon: RiTruckLine, title: "Free Shipping", desc: "On orders above 499" },
  { icon: RiLeafLine, title: "100% Natural", desc: "Handpicked premium quality" },
  { icon: RiShieldCheckLine, title: "Easy Returns", desc: "Hassle-free 7-day returns" },
];

const memberBenefits = [
  { icon: RiPercentLine, text: "10% off your first order", emoji: "\u{1F336}\u{FE0F}" },
  { icon: RiHeartLine, text: "Save favourites to your wishlist", emoji: "\u{2764}\u{FE0F}" },
  { icon: RiGiftLine, text: "Birthday rewards and surprises", emoji: "\u{1F381}" },
];


const floatingSpices = [
  { emoji: "\u{1FAD0}", top: "6%", left: "80%", size: "1.4rem", delay: 0, opacity: 0.11 },
  { emoji: "\u{1F33F}", top: "20%", left: "90%", size: "1.1rem", delay: 0.6, opacity: 0.09 },
  { emoji: "\u{1F336}\u{FE0F}", top: "40%", left: "85%", size: "1.2rem", delay: 1.1, opacity: 0.1 },
  { emoji: "\u{1F95C}", top: "58%", left: "88%", size: "1rem", delay: 1.6, opacity: 0.08 },
  { emoji: "\u{1F33E}", top: "75%", left: "78%", size: "1.3rem", delay: 2.1, opacity: 0.09 },
  { emoji: "\u{1F33F}", top: "28%", left: "6%", size: "1rem", delay: 0.9, opacity: 0.07 },
  { emoji: "\u{1F336}\u{FE0F}", top: "68%", left: "12%", size: "1.2rem", delay: 1.4, opacity: 0.1 },
  { emoji: "\u{1FAD0}", top: "10%", left: "18%", size: "1.1rem", delay: 1.9, opacity: 0.08 },
];


function SpiceScatterDecoration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      
      <ellipse cx="20" cy="30" rx="6" ry="3" transform="rotate(30 20 30)" fill="currentColor" opacity="0.12" />
      <ellipse cx="65" cy="20" rx="5" ry="2.5" transform="rotate(-20 65 20)" fill="currentColor" opacity="0.1" />
      <ellipse cx="80" cy="60" rx="7" ry="3" transform="rotate(45 80 60)" fill="currentColor" opacity="0.08" />
      <ellipse cx="35" cy="75" rx="5" ry="2.5" transform="rotate(-15 35 75)" fill="currentColor" opacity="0.1" />
      <ellipse cx="50" cy="50" rx="4" ry="2" transform="rotate(60 50 50)" fill="currentColor" opacity="0.12" />
      
      <circle cx="15" cy="60" r="2" fill="currentColor" opacity="0.08" />
      <circle cx="45" cy="25" r="1.5" fill="currentColor" opacity="0.1" />
      <circle cx="75" cy="40" r="2.5" fill="currentColor" opacity="0.07" />
      <circle cx="55" cy="80" r="1.8" fill="currentColor" opacity="0.09" />
      <circle cx="90" cy="85" r="2" fill="currentColor" opacity="0.06" />
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
            "linear-gradient(150deg, #1f150a 0%, #2a180c 20%, #351c0a 45%, #241610 65%, #1a1208 100%)",
        }}
      />

      
      <div className="absolute right-0 top-0 text-[#D4A31E]">
        <SpiceScatterDecoration className="h-48 w-48" />
      </div>
      <div className="absolute -left-6 bottom-20 text-[#E8891C]">
        <SpiceScatterDecoration className="h-40 w-40" />
      </div>

      
      <div
        className="absolute right-0 top-1/3 h-56 w-56 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #D4A31E 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 h-40 w-40 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #8B4513 0%, transparent 70%)" }}
      />

      
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 40%, #F4A623 1px, transparent 1px), radial-gradient(circle at 70% 60%, #D4A31E 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      
      <div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-25"
        style={{
          background: "linear-gradient(to top, #D4A31E, transparent)",
        }}
      />

      
      <svg
        className="absolute bottom-0 left-0 right-0 h-24 w-full text-[#F4A623]/[0.06]"
        viewBox="0 0 400 80"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 55 Q60 25 120 50 T240 35 T360 50 T400 25" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M0 65 Q90 35 180 60 T360 45 T400 55" stroke="currentColor" strokeWidth="1" fill="none" />
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
          <span className="text-xl font-extrabold tracking-tight text-white">Lotus</span>
          <span className="text-xl font-extrabold tracking-tight text-[#E84672]">Mart</span>
        </Link>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
        >
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#D4A31E]/60">
            Join Us
          </p>
          <h2 className="text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-white italic">
            Start your
            <br />
            <span className="not-italic text-[#F4A623]/90">premium journey.</span>
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
            Create an account to enjoy exclusive offers, track your orders, and
            discover India&apos;s finest spices.
          </p>

          
          <div className="mt-5 space-y-2.5">
            {memberBenefits.map(({ icon: Icon, text, emoji }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F4A623]/10">
                  <span className="text-[0.65rem]">{emoji}</span>
                </div>
                <span className="text-[0.75rem] text-white/45">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
          className="grid grid-cols-2 gap-3"
        >
          {perks.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-[#F4A623]/[0.06] bg-[#F4A623]/[0.03] p-3.5 backdrop-blur-sm"
            >
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4A31E]/10">
                <Icon size={13} className="text-[#D4A31E]/70" />
              </div>
              <p className="text-[0.72rem] font-semibold text-white/70">{title}</p>
              <p className="mt-0.5 text-[0.62rem] text-white/30">{desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { register, isLoading } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [focused, setFocused] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (form.password.length < 8) errs.password = "Minimum 8 characters required";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form, callbackUrl);
    } catch {
      
    }
  };

  const inputCls = (field: string, hasError?: string) =>
    `w-full rounded-xl border bg-white/60 py-3 pl-10 pr-4 text-sm font-medium text-neutral-800
     placeholder:text-neutral-400 outline-none transition-all duration-200
     ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-neutral-200 focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/10"}
     ${focused === field && !hasError ? "border-[#E84672] ring-2 ring-[#E84672]/10" : ""}`;

  return (
    <div className="flex h-full w-full flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
      
      <div className="mb-8 flex items-center justify-between lg:hidden">
        <Link href="/" className="inline-flex items-center gap-0.5">
          <span className="text-xl font-extrabold tracking-tight text-neutral-800">Lotus</span>
          <span className="text-xl font-extrabold tracking-tight text-[#E84672]">Mart</span>
        </Link>
        <Link href="/" className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600">
          Back to store
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="mx-auto w-full max-w-[380px]"
      >
        
        <div className="mb-7">
          <h1 className="text-[1.75rem] font-bold tracking-tight text-neutral-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Join LotusMart for a premium shopping experience.
          </p>
        </div>

        
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Full Name
            </label>
            <div className="relative">
              <RiUserLine
                size={15}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused === "name" ? "text-[#E84672]" : "text-neutral-300"}`}
              />
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                placeholder="Priya Sharma"
                autoComplete="name"
                className={inputCls("name", errors.name)}
              />
            </div>
            <AnimatePresence>
              {errors.name && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs font-medium text-red-500">
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          
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
                value={form.email}
                onChange={set("email")}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputCls("email", errors.email)}
              />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs font-medium text-red-500">
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Password
            </label>
            <div className="relative">
              <RiLockLine
                size={15}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused === "password" ? "text-[#E84672]" : "text-neutral-300"}`}
              />
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder="Minimum 8 characters"
                className={`${inputCls("password", errors.password)} !pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-300 transition-colors hover:text-neutral-500"
                tabIndex={-1}
              >
                {showPwd ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs font-medium text-red-500">
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Confirm Password
            </label>
            <div className="relative">
              <RiLockLine
                size={15}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused === "confirmPassword" ? "text-[#E84672]" : "text-neutral-300"}`}
              />
              <input
                type={showPwd ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                onFocus={() => setFocused("confirmPassword")}
                onBlur={() => setFocused(null)}
                placeholder="Repeat your password"
                className={inputCls("confirmPassword", errors.confirmPassword)}
              />
            </div>
            <AnimatePresence>
              {errors.confirmPassword && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs font-medium text-red-500">
                  {errors.confirmPassword}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          
          <p className="pt-1 text-xs text-neutral-400">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-neutral-500 underline underline-offset-2 hover:text-neutral-600">
              Terms
            </Link>
            {" "}and{" "}
            <Link href="/privacy-policy" className="text-neutral-500 underline underline-offset-2 hover:text-neutral-600">
              Privacy Policy
            </Link>.
          </p>

          
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { y: -1 } : {}}
            whileTap={!isLoading ? { scale: 0.985 } : {}}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E84672] py-3 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <RiArrowRightLine size={15} />
              </>
            )}
          </motion.button>
        </form>

        
        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#E84672] transition-colors hover:text-[#C9305A]">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-col overflow-y-auto bg-[#FAFAF9]">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
