"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  RiMapPinLine,
  RiPhoneLine,
  RiHomeLine,
  RiBriefcaseLine,
  RiMoreLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import toast from "@/components/ui/toast";
import LocationPicker, {
  type LocationPickerValue,
} from "@/components/shared/LocationPicker";

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-0.5">
          <span className="text-xl font-extrabold tracking-tight text-neutral-800">Lotus</span>
          <span className="text-xl font-extrabold tracking-tight text-[#E84672]">Mart</span>
        </Link>

        <div className="rounded-3xl border border-neutral-100 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-neutral-900">Complete your profile</h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            A couple more details so we can deliver to you and keep you updated.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Mobile Number
              </label>
              <div className="relative">
                <RiPhoneLine className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300" size={15} />
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  placeholder="10-digit mobile"
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition ${
                    errors.phone
                      ? "border-red-300 focus:border-red-400"
                      : "border-neutral-200 focus:border-[#E84672]"
                  }`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="rounded-2xl border border-neutral-150 bg-neutral-50 p-4">
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
              <div className="sm:col-span-2">
                <Input
                  label="Address Line 1"
                  value={form.addressLine1}
                  onChange={(e) => set("addressLine1")(e.target.value)}
                  error={errors.addressLine1}
                  placeholder="Flat/House No., Building, Street"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address Line 2"
                  value={form.addressLine2}
                  onChange={(e) => set("addressLine2")(e.target.value)}
                  placeholder="Locality, Landmark (optional)"
                />
              </div>
              <Input
                label="City"
                value={form.city}
                onChange={(e) => set("city")(e.target.value)}
                error={errors.city}
                required
              />
              <Input
                label="State"
                value={form.state}
                onChange={(e) => set("state")(e.target.value)}
                error={errors.state}
                required
              />
              <Input
                label="Pincode"
                value={form.pincode}
                onChange={(e) => set("pincode")(e.target.value)}
                error={errors.pincode}
                placeholder="6-digit pincode"
                maxLength={6}
                required
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
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
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm capitalize transition ${
                        form.label === v
                          ? "border-[#E84672] bg-[#FFF1F3] text-[#E84672]"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={saving}
              rightIcon={<RiArrowRightLine />}
            >
              Save and continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
