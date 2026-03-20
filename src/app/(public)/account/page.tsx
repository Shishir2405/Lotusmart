"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RiUserLine, RiMailLine, RiPhoneLine, RiSaveLine } from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";
import toast from "react-hot-toast";

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.patch<{ data: typeof user }>("/api/auth/me", form);
      setUser(res.data.data);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-narrow py-10">
      <h1 className="text-2xl font-bold text-neutral-900 mb-8">My Account</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1"
        >
          <div className="bg-white rounded-2xl p-6 border border-neutral-100 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E84672] to-[#C9305A] flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-semibold text-neutral-900">{user.name}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{user.email}</p>
            <div className="mt-3">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-[#FFF1F3] text-[#E84672]" : "bg-[#F7F6F0] text-[#7A6E42]"}`}>
                {user.role === "admin" ? "Administrator" : "Customer"}
              </span>
            </div>
          </div>

          <nav className="bg-white rounded-2xl border border-neutral-100 mt-4 overflow-hidden">
            {[
              { href: "/account", label: "Profile" },
              { href: "/account/addresses", label: "Addresses" },
              { href: "/orders", label: "My Orders" },
              { href: "/wishlist", label: "Wishlist" },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="flex items-center px-5 py-3 text-sm font-medium text-neutral-600 hover:bg-[#F7F6F0] hover:text-[#E84672] border-b border-neutral-50 last:border-0 transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </motion.div>

        {/* Profile form */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2"
        >
          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <h3 className="font-semibold text-neutral-900 mb-5">Personal Information</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                leftIcon={<RiUserLine />}
                required
              />
              <Input
                label="Email Address"
                value={user.email}
                disabled
                leftIcon={<RiMailLine />}
                hint="Email cannot be changed"
              />
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                leftIcon={<RiPhoneLine />}
                placeholder="10-digit mobile number"
              />
              <Button type="submit" leftIcon={<RiSaveLine />} isLoading={saving}>
                Save Changes
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
