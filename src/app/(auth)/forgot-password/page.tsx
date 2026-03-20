"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RiMailLine, RiArrowLeftLine, RiCheckLine } from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8">
        {sent ? (
          /* Success state */
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <RiCheckLine className="text-green-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Check your inbox</h1>
            <p className="text-sm text-neutral-500 mb-6">
              If an account exists for <strong className="text-neutral-700">{email}</strong>, you&apos;ll
              receive a password reset link shortly.
            </p>
            <p className="text-xs text-neutral-400 mb-6">
              Didn&apos;t receive the email? Check your spam folder or try again in a few minutes.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => { setSent(false); setEmail(""); }}
              >
                Try a different email
              </Button>
              <Link href="/login">
                <Button fullWidth>Back to Login</Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Form state */
          <>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors mb-6"
            >
              <RiArrowLeftLine size={15} />
              Back to login
            </Link>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-neutral-900 mb-1">Forgot password?</h1>
              <p className="text-sm text-neutral-500">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                error={error}
                leftIcon={<RiMailLine />}
                required
                autoComplete="email"
              />

              <Button type="submit" fullWidth size="lg" isLoading={loading}>
                Send Reset Link
              </Button>
            </form>

            <p className="text-center text-sm text-neutral-500 mt-6">
              Remember your password?{" "}
              <Link href="/login" className="text-[#E84672] font-semibold hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
