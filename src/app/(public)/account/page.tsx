"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiSaveLine,
  RiArrowRightLine,
  RiShoppingBag3Line,
  RiTimeLine,
} from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency, formatDate } from "@/utils/helpers";
import axios from "axios";
import toast from "@/components/ui/toast";

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

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  
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
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-[#FFF1F3] text-[#E84672]" : "bg-[#F7F6F0] text-[#7A6E42]"}`}
              >
                {user.role === "admin" ? "Administrator" : "Customer"}
              </span>
            </div>
          </div>

          <nav className="bg-white rounded-2xl border border-neutral-100 mt-4 overflow-hidden">
            {[
              { href: "/account", label: "Profile", icon: RiUserLine },
              { href: "/account/addresses", label: "Addresses", icon: RiMailLine },
              { href: "/orders", label: "My Orders", icon: RiShoppingBag3Line },
              { href: "/wishlist", label: "Wishlist", icon: RiTimeLine },
            ].map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-5 py-3 text-sm font-medium text-neutral-600 hover:bg-[#F7F6F0] hover:text-[#E84672] border-b border-neutral-50 last:border-0 transition-colors"
              >
                <Icon size={16} />
                {label}
              </a>
            ))}
          </nav>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 space-y-6"
        >
          
          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <h3 className="font-semibold text-neutral-900 mb-5">
              Personal Information
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                leftIcon={<RiPhoneLine />}
                placeholder="10-digit mobile number"
              />
              <Button
                type="submit"
                leftIcon={<RiSaveLine />}
                isLoading={saving}
              >
                Save Changes
              </Button>
            </form>
          </div>

          
          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900">Recent Orders</h3>
              <Link
                href="/orders"
                className="text-sm text-[#E84672] hover:text-[#C9305A] flex items-center gap-1 transition-colors"
              >
                View All <RiArrowRightLine size={14} />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <RiShoppingBag3Line
                  size={32}
                  className="text-neutral-300 mx-auto mb-3"
                />
                <p className="text-sm text-neutral-500">No orders yet</p>
                <Link href="/products">
                  <Button variant="outline" size="sm" className="mt-3">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/orders/${order._id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50 transition-all">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-800">
                            {order.orderNumber}
                          </p>
                          <OrderStatusBadge status={order.orderStatus} />
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {formatDate(order.createdAt)} &middot;{" "}
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-neutral-900">
                          {formatCurrency(order.total)}
                        </p>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
