"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  RiMapPinLine,
  RiPhoneLine,
  RiHomeLine,
  RiBriefcaseLine,
  RiMoreLine,
  RiArrowRightLine,
  RiUserLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiSparklingLine,
} from "react-icons/ri";
import { useAuthStore } from "@/store/auth.store";
import toast from "@/components/ui/toast";
import LocationPicker, {
  type LocationPickerValue,
} from "@/components/shared/LocationPicker";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface FormState {
  phone: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  label: "home" | "work" | "other";
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

const EMPTY: FormState = {
  phone: "",
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  label: "home",
};

const journeySteps = [
  { icon: RiUserLine, text: "Tell us about you", emoji: "\u{1F44B}" },
  { icon: RiMapPinLine, text: "Where to deliver", emoji: "\u{1F4CD}" },
  { icon: RiTruckLine, text: "Get fresh deliveries", emoji: "\u{1F69A}" },
];

const floatingSpices = [
  { emoji: "\u{1F336}\u{FE0F}", top: "10%", left: "82%", size: "1.4rem", delay: 0, opacity: 0.11 },
  { emoji: "\u{1FAD0}", top: "22%", left: "90%", size: "1.1rem", delay: 0.5, opacity: 0.09 },
  { emoji: "\u{1F33F}", top: "48%", left: "84%", size: "1.3rem", delay: 1.0, opacity: 0.1 },
  { emoji: "\u{1F95C}", top: "68%", left: "92%", size: "1rem", delay: 1.5, opacity: 0.08 },
  { emoji: "\u{1F33E}", top: "82%", left: "76%", size: "1.2rem", delay: 2.0, opacity: 0.09 },
  { emoji: "\u{1F336}\u{FE0F}", top: "32%", left: "6%", size: "1rem", delay: 0.8, opacity: 0.07 },
  { emoji: "\u{1FAD0}", top: "74%", left: "12%", size: "1.3rem", delay: 1.3, opacity: 0.1 },
  { emoji: "\u{1F33F}", top: "14%", left: "16%", size: "1.1rem", delay: 1.8, opacity: 0.08 },
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

function BrandPanel({ name }: { name?: string }) {
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
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#F4A623]/15 bg-[#F4A623]/5 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#F4A623]/70">
            <RiSparklingLine size={11} />
            Almost there
          </p>
          <h2 className="text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-white italic">
            {name ? `Welcome, ${name.split(" ")[0]}` : "One last step"}
            <br />
            <span className="not-italic text-[#F4A623]/90">to get you started.</span>
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
            A couple more details so we can deliver fresh spices and dry fruits straight to your doorstep.
          </p>

          <div className="mt-6 space-y-2.5">
            {journeySteps.map(({ text, emoji }, idx) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm">
                  <span>{emoji}</span>
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-white/30">
                    Step {idx + 1}
                  </p>
                  <p className="text-[0.85rem] font-medium text-white/70">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
          className="rounded-2xl border border-[#F4A623]/[0.08] bg-[#F4A623]/[0.04] p-4 backdrop-blur-sm"
        >
          <div className="mb-2 flex items-center gap-2">
            <RiShieldCheckLine size={14} className="text-[#F4A623]/80" />
            <p className="text-[0.72rem] font-semibold text-white/80">
              Your details stay private
            </p>
          </div>
          <p className="text-[0.7rem] leading-relaxed text-white/40">
            We use your address only to deliver orders and send relevant updates. You can edit or remove it any time.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function CompleteProfileForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? "/";
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/complete-profile")}`);
      return;
    }
    if (user.profileComplete) {
      router.replace(callbackUrl);
      return;
    }
    setForm((f) => ({
      ...f,
      fullName: user.name ?? "",
      phone: user.phone ?? "",
    }));
  }, [isHydrated, user, router, callbackUrl]);

  const set = <K extends keyof FormState>(k: K) => (value: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const onLocation = (value: LocationPickerValue) => {
    setForm((f) => ({
      ...f,
      addressLine1: value.addressLine1 || f.addressLine1,
      addressLine2: value.addressLine2 ?? f.addressLine2,
      city: value.city || f.city,
      state: value.state || f.state,
      pincode: value.pincode || f.pincode,
      coordinates: value.coordinates,
      formattedAddress: value.formattedAddress,
    }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.phone.match(/^[+]?[\d\s-]{10,15}$/)) e.phone = "Enter a valid mobile number";
    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 5)
      e.addressLine1 = "Address must be at least 5 characters";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.pincode.match(/^\d{6}$/)) e.pincode = "6-digit pincode";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await axios.post<{ data: { user: typeof user } }>(
        "/api/auth/complete-profile",
        {
          phone: form.phone,
          address: {
            fullName: form.fullName || user?.name,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || undefined,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            label: form.label,
            coordinates: form.coordinates,
            formattedAddress: form.formattedAddress,
          },
        },
      );
      if (res.data.data.user) setUser(res.data.data.user);
      toast.success("Profile saved");
      router.push(callbackUrl);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Failed to save profile"
        : "Failed to save profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-[#E84672]" />
      </div>
    );
  }

  const inputCls = (field: string, hasError?: string) =>
    `w-full rounded-xl border bg-white/60 py-3 pl-10 pr-4 text-sm font-medium text-neutral-800
     placeholder:text-neutral-400 outline-none transition-all duration-200
     ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-neutral-200 focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/10"}
     ${focused === field && !hasError ? "border-[#E84672] ring-2 ring-[#E84672]/10" : ""}`;

  const plainInputCls = (field: string, hasError?: string) =>
    `w-full rounded-xl border bg-white/60 px-4 py-3 text-sm font-medium text-neutral-800
     placeholder:text-neutral-400 outline-none transition-all duration-200
     ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-neutral-200 focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/10"}
     ${focused === field && !hasError ? "border-[#E84672] ring-2 ring-[#E84672]/10" : ""}`;

  return (
    <div className="flex h-full w-full flex-col px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
      <div className="mb-8 flex items-center justify-between lg:hidden">
        <Link href="/" className="inline-flex items-center gap-0.5">
          <span className="text-xl font-extrabold tracking-tight text-neutral-800">Lotus</span>
          <span className="text-xl font-extrabold tracking-tight text-[#E84672]">Mart</span>
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
        className="mx-auto w-full max-w-[460px]"
      >
        <div className="mb-6">
          <h1 className="text-[1.75rem] font-bold tracking-tight text-neutral-900">
            Complete your profile
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            A couple more details so we can deliver to you and keep you updated.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Mobile Number
            </label>
            <div className="relative">
              <RiPhoneLine
                size={15}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused === "phone" ? "text-[#E84672]" : "text-neutral-300"}`}
              />
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused(null)}
                placeholder="10-digit mobile"
                className={inputCls("phone", errors.phone)}
              />
            </div>
            <AnimatePresence>
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs font-medium text-red-500"
                >
                  {errors.phone}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <RiMapPinLine className="text-[#E84672]" size={16} />
              <h2 className="text-sm font-semibold text-neutral-800">Your delivery address</h2>
            </div>
            <LocationPicker
              initialValue={{
                addressLine1: form.addressLine1,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
                coordinates: form.coordinates,
              }}
              onChange={onLocation}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Address Line 1
              </label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => set("addressLine1")(e.target.value)}
                onFocus={() => setFocused("addressLine1")}
                onBlur={() => setFocused(null)}
                placeholder="Flat/House No., Building, Street"
                className={plainInputCls("addressLine1", errors.addressLine1)}
              />
              <AnimatePresence>
                {errors.addressLine1 && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-medium text-red-500"
                  >
                    {errors.addressLine1}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Address Line 2 <span className="font-normal normal-case text-neutral-300">(optional)</span>
              </label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => set("addressLine2")(e.target.value)}
                onFocus={() => setFocused("addressLine2")}
                onBlur={() => setFocused(null)}
                placeholder="Locality, Landmark"
                className={plainInputCls("addressLine2")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city")(e.target.value)}
                onFocus={() => setFocused("city")}
                onBlur={() => setFocused(null)}
                placeholder="Mumbai"
                className={plainInputCls("city", errors.city)}
              />
              <AnimatePresence>
                {errors.city && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-medium text-red-500"
                  >
                    {errors.city}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                State
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => set("state")(e.target.value)}
                onFocus={() => setFocused("state")}
                onBlur={() => setFocused(null)}
                placeholder="Maharashtra"
                className={plainInputCls("state", errors.state)}
              />
              <AnimatePresence>
                {errors.state && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-medium text-red-500"
                  >
                    {errors.state}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Pincode
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => set("pincode")(e.target.value)}
                onFocus={() => setFocused("pincode")}
                onBlur={() => setFocused(null)}
                placeholder="6-digit pincode"
                className={plainInputCls("pincode", errors.pincode)}
              />
              <AnimatePresence>
                {errors.pincode && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-medium text-red-500"
                  >
                    {errors.pincode}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Address Type
              </label>
              <div className="flex gap-2">
                {([
                  { v: "home", icon: RiHomeLine, label: "Home" },
                  { v: "work", icon: RiBriefcaseLine, label: "Work" },
                  { v: "other", icon: RiMoreLine, label: "Other" },
                ] as const).map(({ v, icon: Icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set("label")(v)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                      form.label === v
                        ? "border-[#E84672] bg-[#FFF1F3] text-[#E84672]"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={!saving ? { y: -1 } : {}}
            whileTap={!saving ? { scale: 0.985 } : {}}
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
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Saving...
                </>
              ) : (
                <>
                  Save and continue
                  <RiArrowRightLine size={15} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </>
              )}
            </span>
          </motion.button>
        </form>

        <p className="mt-6 text-center text-[0.65rem] text-neutral-300">
          Your details are encrypted and used only for deliveries and order updates.
        </p>
      </motion.div>
    </div>
  );
}

export default function CompleteProfilePage() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <BrandPanel name={user?.name} />
      <div className="flex flex-col overflow-y-auto bg-[#FAFAF9]">
        <Suspense>
          <CompleteProfileForm />
        </Suspense>
      </div>
    </div>
  );
}
