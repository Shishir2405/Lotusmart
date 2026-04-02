"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RiSaveLine, RiShieldLine, RiMailLine, RiStore2Line, RiTruckLine } from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "@/components/ui/toast";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: SettingsSection[] = [
  { id: "store", label: "Store Info", icon: RiStore2Line },
  { id: "shipping", label: "Shipping", icon: RiTruckLine },
  { id: "email", label: "Email", icon: RiMailLine },
  { id: "security", label: "Security", icon: RiShieldLine },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("store");
  const [saving, setSaving] = useState(false);

  
  const [store, setStore] = useState({
    name: "LotusMart",
    tagline: "Premium Spices & Dry Fruits",
    email: "hello@lotusmart.com",
    phone: "+91 98765 43210",
    address: "Mumbai, Maharashtra, India",
    currency: "INR",
    gstNumber: "",
  });

  
  const [shipping, setShipping] = useState({
    freeShippingThreshold: "500",
    standardShippingCost: "60",
    expressShippingCost: "150",
    codEnabled: true,
    codCharges: "0",
  });

  const handleSave = async () => {
    setSaving(true);
    
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Configure your store preferences</p>
      </div>

      <div className="flex gap-6">
        
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === id
                    ? "bg-rose-500 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        
        <div className="flex-1 max-w-2xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-neutral-100"
          >
            {activeSection === "store" && (
              <>
                <h2 className="font-semibold text-neutral-800 mb-5">Store Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Store Name"
                      value={store.name}
                      onChange={(e) => setStore((s) => ({ ...s, name: e.target.value }))}
                    />
                    <Input
                      label="Tagline"
                      value={store.tagline}
                      onChange={(e) => setStore((s) => ({ ...s, tagline: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Support Email"
                      type="email"
                      value={store.email}
                      onChange={(e) => setStore((s) => ({ ...s, email: e.target.value }))}
                    />
                    <Input
                      label="Phone"
                      value={store.phone}
                      onChange={(e) => setStore((s) => ({ ...s, phone: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Address"
                    value={store.address}
                    onChange={(e) => setStore((s) => ({ ...s, address: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Currency</label>
                      <select
                        value={store.currency}
                        onChange={(e) => setStore((s) => ({ ...s, currency: e.target.value }))}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 bg-white"
                      >
                        <option value="INR">INR — Indian Rupee</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                      </select>
                    </div>
                    <Input
                      label="GST Number"
                      value={store.gstNumber}
                      onChange={(e) => setStore((s) => ({ ...s, gstNumber: e.target.value }))}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>
              </>
            )}

            {activeSection === "shipping" && (
              <>
                <h2 className="font-semibold text-neutral-800 mb-5">Shipping Configuration</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Free Shipping Threshold (₹)"
                      type="number"
                      value={shipping.freeShippingThreshold}
                      onChange={(e) => setShipping((s) => ({ ...s, freeShippingThreshold: e.target.value }))}
                    />
                    <Input
                      label="Standard Shipping Cost (₹)"
                      type="number"
                      value={shipping.standardShippingCost}
                      onChange={(e) => setShipping((s) => ({ ...s, standardShippingCost: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Express Shipping Cost (₹)"
                      type="number"
                      value={shipping.expressShippingCost}
                      onChange={(e) => setShipping((s) => ({ ...s, expressShippingCost: e.target.value }))}
                    />
                    <Input
                      label="COD Charges (₹)"
                      type="number"
                      value={shipping.codCharges}
                      onChange={(e) => setShipping((s) => ({ ...s, codCharges: e.target.value }))}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipping.codEnabled}
                      onChange={(e) => setShipping((s) => ({ ...s, codEnabled: e.target.checked }))}
                      className="rounded accent-rose-500"
                    />
                    <span className="text-sm text-neutral-700">Enable Cash on Delivery</span>
                  </label>
                </div>
              </>
            )}

            {activeSection === "email" && (
              <>
                <h2 className="font-semibold text-neutral-800 mb-2">Email Notifications</h2>
                <p className="text-sm text-neutral-400 mb-5">
                  Configure via environment variables: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs font-mono">SMTP_HOST</code>, <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs font-mono">SMTP_USER</code>, <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs font-mono">SMTP_PASS</code>
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Order confirmation emails", defaultChecked: true },
                    { label: "Shipping update emails", defaultChecked: true },
                    { label: "Admin new order alerts", defaultChecked: true },
                    { label: "Welcome emails on registration", defaultChecked: true },
                    { label: "Password reset emails", defaultChecked: true },
                  ].map(({ label, defaultChecked }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={defaultChecked}
                        className="rounded accent-rose-500"
                      />
                      <span className="text-sm text-neutral-700">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {activeSection === "security" && (
              <>
                <h2 className="font-semibold text-neutral-800 mb-2">Security</h2>
                <p className="text-sm text-neutral-400 mb-5">Security settings are managed via environment variables.</p>
                <div className="space-y-3 text-sm">
                  {[
                    { key: "JWT_SECRET", desc: "JWT signing secret" },
                    { key: "JWT_EXPIRES_IN", desc: "Token expiry (e.g. 7d)" },
                    { key: "MONGODB_URI", desc: "Database connection string" },
                    { key: "RAZORPAY_KEY_ID", desc: "Razorpay public key" },
                    { key: "RAZORPAY_KEY_SECRET", desc: "Razorpay secret key" },
                    { key: "CLOUDFLARE_R2_*", desc: "R2 storage credentials" },
                  ].map(({ key, desc }) => (
                    <div key={key} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                      <code className="font-mono text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded shrink-0">{key}</code>
                      <span className="text-neutral-600">{desc}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection !== "security" && (
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <Button onClick={handleSave} isLoading={saving} leftIcon={<RiSaveLine />}>
                  Save Changes
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
