"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiMailLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiDashboardLine,
  RiSettings3Line,
  RiBarChartBoxLine,
  RiLockStarLine,
} from "react-icons/ri";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const features = [
  { icon: RiDashboardLine, title: "Dashboard", desc: "Real-time analytics" },
  { icon: RiBarChartBoxLine, title: "Reports", desc: "Revenue tracking" },
  { icon: RiSettings3Line, title: "Management", desc: "Products & orders" },
  { icon: RiShieldCheckLine, title: "Access Control", desc: "Role-based security" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [focused, setFocused] = useState<string | null>(null);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const res = await axios.post<{
        data: {
          user: {
            _id: string;
            id: string;
            name: string;
            email: string;
            role: string;
            avatar?: string;
            isVerified: boolean;
          };
        };
      }>("/api/auth/login", { email, password });
      const user = res.data.data.user;
      if (user.role !== "admin") {
        setErrors({ general: "Access denied. Admin credentials required." });
        toast.error("You are not authorized to access the admin panel.");
        return;
      }
      setUser({
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role as "admin" | "customer",
        avatar: user.avatar,
        isVerified: user.isVerified,
      });
      toast.success(`Welcome back, ${user.name?.split(" ")[0]}!`);
      router.push("/admin/dashboard");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Authentication failed"
        : "Authentication failed";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = (field: string, hasError?: string) =>
    `w-full rounded-xl border bg-white/60 py-3 pl-10 pr-4 text-sm font-medium text-neutral-800
     placeholder:text-neutral-400 outline-none transition-all duration-200
     ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-neutral-200 focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/10"}
     ${focused === field && !hasError ? "border-[#E84672] ring-2 ring-[#E84672]/10" : ""}`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #0f0f12 0%, #16141c 25%, #1a1520 50%, #141118 75%, #0f0f12 100%)",
        }}
      />

      
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(232,70,114,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(232,70,114,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      
      <div
        className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "radial-gradient(circle, #E84672 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
        style={{ background: "radial-gradient(circle, #B59F6B 0%, transparent 70%)" }}
      />

      
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #E84672, transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease }}
        className="relative z-10 w-full max-w-[900px]"
      >
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] shadow-2xl backdrop-blur-sm lg:grid-cols-2">
          
          <div className="relative hidden overflow-hidden border-r border-white/[0.06] p-10 lg:flex lg:flex-col lg:justify-between">
            
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(232,70,114,0.03) 0%, transparent 40%, rgba(181,159,107,0.03) 100%)",
              }}
            />

            
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/[0.03]" />
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/[0.02]" />
            <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full border border-[#E84672]/[0.04]" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              
              <div>
                <Link href="/" className="inline-flex items-center gap-0.5">
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    Lotus
                  </span>
                  <span className="text-xl font-extrabold tracking-tight text-[#E84672]">
                    Mart
                  </span>
                </Link>
                <div className="mt-2 flex items-center gap-1.5">
                  <RiLockStarLine size={11} className="text-[#E84672]" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-white/30">
                    Admin Console
                  </span>
                </div>
              </div>

              
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Manage your entire
                  <br />
                  <span className="text-[#E84672]">store in one place.</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/30">
                  Access real-time analytics, manage products, track orders,
                  and control your business.
                </p>
              </div>

              
              <div className="grid grid-cols-2 gap-2.5">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5"
                  >
                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#E84672]/10">
                      <Icon size={13} className="text-[#E84672]/80" />
                    </div>
                    <p className="text-xs font-semibold text-white/60">{title}</p>
                    <p className="mt-0.5 text-[0.62rem] text-white/25">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                <p className="text-[0.65rem] text-white/20">
                  Secure 256-bit encrypted connection
                </p>
              </div>
            </div>
          </div>

          
          <div className="flex flex-col justify-center bg-white p-8 sm:p-10">
            
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-0.5">
                <span className="text-xl font-extrabold tracking-tight text-neutral-800">
                  Lotus
                </span>
                <span className="text-xl font-extrabold tracking-tight text-[#E84672]">
                  Mart
                </span>
              </Link>
              <Link href="/" className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600">
                Back to store
              </Link>
            </div>

            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease }}
              className="mb-7"
            >
              <div className="mb-3 flex items-center gap-1.5 lg:hidden">
                <RiShieldCheckLine size={11} className="text-[#E84672]" />
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Admin Access
                </span>
              </div>
              <h1 className="text-[1.75rem] font-bold tracking-tight text-neutral-900">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-neutral-400">
                Sign in with your admin credentials to continue
              </p>
            </motion.div>

            
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                >
                  <p className="text-sm font-medium text-red-600">{errors.general}</p>
                </motion.div>
              )}
            </AnimatePresence>

            
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4"
            >
              
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
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="admin@lotusmart.com"
                    autoComplete="email"
                    className={inputCls("email", errors.email)}
                  />
                </div>
                {errors.email && <p className="text-xs font-medium text-red-500">{errors.email}</p>}
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
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
                    {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-medium text-red-500">{errors.password}</p>}
              </div>

              
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { y: -1 } : {}}
                whileTap={!isLoading ? { scale: 0.985 } : {}}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E84672] py-3 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Access Dashboard
                    <RiArrowRightLine size={15} />
                  </>
                )}
              </motion.button>
            </motion.form>

            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-7 border-t border-neutral-100 pt-5 text-center"
            >
              <p className="text-sm text-neutral-400">
                Not an admin?{" "}
                <Link href="/login" className="font-semibold text-[#E84672] transition-colors hover:text-[#C9305A]">
                  Customer login
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
