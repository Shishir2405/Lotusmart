"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { RiCheckLine, RiCloseLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import axios from "axios";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }

    axios
      .get(`/api/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      })
      .catch((err) => {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message
          : "Verification failed";
        setStatus("error");
        setMessage(msg ?? "Verification failed. The link may be expired or invalid.");
      });
  }, [token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-[#FFF1F3] rounded-full flex items-center justify-center mx-auto mb-5">
              <RiLoader4Line className="text-[#E84672] animate-spin" size={32} />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 mb-2">Verifying your email…</h1>
            <p className="text-sm text-neutral-500">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <RiCheckLine className="text-green-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Email verified!</h1>
            <p className="text-sm text-neutral-500 mb-8">{message}</p>
            <div className="space-y-3">
              <Link href="/login">
                <Button fullWidth size="lg">Sign In to Your Account</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" fullWidth>Continue Shopping</Button>
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <RiCloseLine className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Verification failed</h1>
            <p className="text-sm text-neutral-500 mb-8">{message}</p>
            <div className="space-y-3">
              <Link href="/login">
                <Button fullWidth>Go to Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" fullWidth>Create a New Account</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 text-center">
          <div className="w-16 h-16 bg-[#FFF1F3] rounded-full flex items-center justify-center mx-auto mb-5">
            <RiLoader4Line className="text-[#E84672] animate-spin" size={32} />
          </div>
          <p className="text-sm text-neutral-500">Verifying…</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
