"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
      // toast handled inside useAuth
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Welcome back</h1>
          <p className="text-sm text-neutral-500">Sign in to your LotusMart account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<RiMailLine />}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<RiLockLine />}
            rightIcon={showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            onRightIconClick={() => setShowPassword((v) => !v)}
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-[#E84672] hover:underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#E84672] font-semibold hover:underline underline-offset-2">
            Create one
          </Link>
        </p>

        {/* Guest checkout note */}
        <div className="mt-6 pt-5 border-t border-[#EBE8D8] text-center">
          <p className="text-xs text-neutral-400">
            Or{" "}
            <Link href="/checkout" className="text-[#7A6E42] font-medium hover:underline underline-offset-1">
              continue as guest
            </Link>
            {" "}— create an account at checkout
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
