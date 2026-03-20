"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { RiUserLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { register, isLoading } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
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
      // handled in useAuth
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
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Create an account</h1>
          <p className="text-sm text-neutral-500">Join LotusMart for a premium experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Full name"
            type="text"
            placeholder="Priya Sharma"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
            leftIcon={<RiUserLine />}
            required
            autoComplete="name"
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            leftIcon={<RiMailLine />}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type={showPwd ? "text" : "password"}
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            leftIcon={<RiLockLine />}
            rightIcon={showPwd ? <RiEyeOffLine /> : <RiEyeLine />}
            onRightIconClick={() => setShowPwd((v) => !v)}
            required
          />
          <Input
            label="Confirm password"
            type={showPwd ? "text" : "password"}
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            error={errors.confirmPassword}
            leftIcon={<RiLockLine />}
            required
          />

          <p className="text-xs text-neutral-400 pt-1">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-[#7A6E42] hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy-policy" className="text-[#7A6E42] hover:underline">Privacy Policy</Link>.
          </p>

          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E84672] font-semibold hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
