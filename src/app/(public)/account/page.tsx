"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiSaveLine,
  RiArrowRightLine,
  RiShoppingBag3Line,
  RiCameraLine,
  RiMapPinLine,
  RiHeartLine,
  RiLockLine,
  RiLogoutBoxRLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiDeleteBin6Line,
} from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, normalizeImageUrl } from "@/utils/helpers";
import axios from "axios";
import toast from "@/components/ui/toast";
import { useUpload } from "@/hooks/useUpload";

interface RecentOrder {
  _id: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

const NAV_ITEMS = [
  { href: "/account", label: "Profile", icon: RiUserLine },
  { href: "/account/addresses", label: "Addresses", icon: RiMapPinLine },
  { href: "/orders", label: "My Orders", icon: RiShoppingBag3Line },
  { href: "/wishlist", label: "Wishlist", icon: RiHeartLine },
];

export default function AccountPage() {
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const { logout } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const { upload, uploading } = useUpload({ target: "profiles" });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    axios
      .get<{ data: RecentOrder[] }>("/api/orders?limit=5")
      .then((r) => setRecentOrders(r.data.data ?? []))
      .catch(() => null)
      .finally(() => setOrdersLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.patch<{ data: typeof user }>("/api/auth/me", form);
      setUser(res.data.data);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const uploaded = await upload(file);
    if (!uploaded) return;
    try {
      const res = await axios.patch<{ data: typeof user }>("/api/auth/me", { avatar: uploaded.url });
      setUser(res.data.data);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(
        axios.isAxiosError(err) ? (err.response?.data?.message ?? "Failed to save avatar") : "Failed to save avatar",
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    setDeleting(true);
    try {
      await axios.delete("/api/auth/me", {
        data: { reason: deleteReason.trim() || undefined },
      });
      toast.success("Your account has been deleted");
      // Logout clears the auth store and redirects.
      await logout();
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to delete account")
          : "Failed to delete account",
      );
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-wide py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">My Account</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your profile, addresses, and orders</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* ─── LEFT SIDEBAR ─── */}
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            {/* Cover gradient */}
            <div className="h-20 bg-linear-to-br from-[#E84672] to-[#C9305A] relative">
              {user.role === "admin" && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold bg-white/20 text-white backdrop-blur-sm">
                  <RiShieldCheckLine size={10} /> Admin
                </span>
              )}
            </div>

            <div className="px-5 pb-5 -mt-10 text-center">
              {/* Avatar */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                {user.avatar ? (
                  <Image
                    src={normalizeImageUrl(user.avatar)}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#F9A8C0] to-[#E84672] flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="w-3 h-3 border-2 border-[#E84672] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RiCameraLine size={12} className="text-neutral-500" />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <h2 className="font-semibold text-neutral-900 text-sm">{user.name}</h2>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">{user.email}</p>
              {user.phone && (
                <p className="text-xs text-neutral-400 mt-0.5">{user.phone}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="bg-white rounded-2xl border border-neutral-100 p-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 last:mb-0 ${
                    isActive
                      ? "bg-[#FFF1F3] text-[#E84672]"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E84672]" />}
                </Link>
              );
            })}
            <div className="border-t border-neutral-100 mt-1 pt-1">
              <button
                onClick={logout}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
              >
                <RiLogoutBoxRLine size={16} />
                Sign Out
              </button>
            </div>
          </nav>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Orders", value: ordersLoading ? "—" : String(recentOrders.length), icon: RiShoppingBag3Line, color: "#E84672", bg: "#FFF1F3" },
              { label: "Addresses", value: "—", icon: RiMapPinLine, color: "#7A6E42", bg: "#F7F6F0", href: "/account/addresses" },
              { label: "Wishlist", value: "—", icon: RiHeartLine, color: "#D97706", bg: "#FFFBEB", href: "/wishlist" },
              { label: "Account", value: user.isVerified ? "Verified" : "Unverified", icon: RiLockLine, color: user.isVerified ? "#16A34A" : "#DC2626", bg: user.isVerified ? "#F0FDF4" : "#FEF2F2" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-neutral-100"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: stat.bg }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-neutral-100"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-[#FFF1F3] flex items-center justify-center">
                <RiUserLine size={16} className="text-[#E84672]" />
              </div>
              <h3 className="font-semibold text-neutral-900">Personal Information</h3>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  leftIcon={<RiUserLine />}
                  required
                />
                <Input
                  label="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  leftIcon={<RiPhoneLine />}
                  placeholder="10-digit mobile number"
                />
              </div>
              <Input
                label="Email Address"
                value={user.email}
                disabled
                leftIcon={<RiMailLine />}
                hint="Email cannot be changed"
              />
              <div className="pt-1">
                <Button type="submit" leftIcon={<RiSaveLine />} isLoading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-6 border border-neutral-100"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5F0E1] flex items-center justify-center">
                  <RiShoppingBag3Line size={16} className="text-[#7A6E42]" />
                </div>
                <h3 className="font-semibold text-neutral-900">Recent Orders</h3>
              </div>
              <Link
                href="/orders"
                className="text-sm text-[#E84672] hover:text-[#C9305A] flex items-center gap-1 transition-colors font-medium"
              >
                View All <RiArrowRightLine size={14} />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-neutral-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center mx-auto mb-3">
                  <RiShoppingBag3Line size={24} className="text-neutral-300" />
                </div>
                <p className="text-sm font-medium text-neutral-700 mb-1">No orders yet</p>
                <p className="text-xs text-neutral-400 mb-4">Your order history will appear here</p>
                <Link href="/products">
                  <Button variant="outline" size="sm">Browse Products</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentOrders.map((order, i) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/orders/${order._id}`} className="block">
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-100 hover:border-[#E84672]/30 hover:bg-[#FFFBFC] transition-all group">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-neutral-800 group-hover:text-[#E84672] transition-colors">
                              {order.orderNumber}
                            </p>
                            <OrderStatusBadge status={order.orderStatus} />
                          </div>
                          <p className="text-xs text-neutral-400 mt-1">
                            {formatDate(order.createdAt)} &middot; {order.items.length}{" "}
                            {order.items.length === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold text-neutral-900">{formatCurrency(order.total)}</p>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-red-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <RiAlertLine size={16} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-red-600">Danger zone</h3>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Deleting your account removes your profile and personal data from LotusMart.
              Past orders are kept for accounting and tax purposes only. You can ask us to
              restore your account by contacting support within 30 days.
            </p>
            <button
              onClick={() => {
                setDeleteOpen(true);
                setDeleteConfirm("");
                setDeleteReason("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <RiDeleteBin6Line size={16} />
              Delete my account
            </button>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !deleting && setDeleteOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <RiAlertLine size={18} className="text-red-500" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900">
                Delete your account?
              </h2>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              This is reversible only by emailing support within 30 days. After that,
              your data is permanently scrubbed.
            </p>

            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Help us improve — why are you leaving?"
              className="w-full text-sm rounded-xl border border-neutral-200 px-3 py-2 mb-4 outline-none focus:border-[#E84672]"
            />

            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full text-sm rounded-xl border border-neutral-200 px-3 py-2 mb-5 outline-none focus:border-red-500 uppercase"
              placeholder="DELETE"
            />

            <div className="flex gap-3 justify-end">
              <button
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
