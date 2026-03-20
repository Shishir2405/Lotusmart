"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RiMoneyDollarCircleLine,
  RiShoppingCartLine,
  RiUserLine,
  RiShoppingBag3Line,
  RiArrowUpLine,
} from "react-icons/ri";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import axios from "axios";

interface AnalyticsData {
  summary: { revenue: number; orders: number; users: number; products: number };
  recentOrders: Array<{ _id: string; orderNumber: string; total: number; orderStatus: string; createdAt: string }>;
  revenueByDay: Array<{ _id: string; revenue: number; orders: number }>;
  topProducts: Array<{ _id: string; name: string; revenue: number; units: number }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<{ data: AnalyticsData }>("/api/admin/analytics?range=30")
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Total Revenue", value: formatCurrency(data?.summary.revenue ?? 0), icon: RiMoneyDollarCircleLine, color: "text-green-600 bg-green-50" },
    { label: "Orders (30d)", value: String(data?.summary.orders ?? 0), icon: RiShoppingCartLine, color: "text-blue-600 bg-blue-50" },
    { label: "Customers", value: String(data?.summary.users ?? 0), icon: RiUserLine, color: "text-[#E84672] bg-[#FFF1F3]" },
    { label: "Active Products", value: String(data?.summary.products ?? 0), icon: RiShoppingBag3Line, color: "text-[#7A6E42] bg-[#F7F6F0]" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Last 30 days performance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 border border-neutral-100"
          >
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-10" rounded="xl" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{stat.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-sm text-[#E84672] hover:underline">View all →</a>
          </div>
          <div className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" rounded="full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))
              : data?.recentOrders.map((order) => (
                  <a key={order._id} href={`/admin/orders/${order._id}`} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFAF9] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{order.orderNumber}</p>
                      <p className="text-xs text-neutral-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <OrderStatusBadge status={order.orderStatus} />
                    <span className="text-sm font-semibold text-neutral-800 shrink-0">{formatCurrency(order.total)}</span>
                  </a>
                ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-900">Top Products</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-3 flex items-center gap-3">
                    <Skeleton className="h-8 w-8" rounded="xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              : data?.topProducts.map((p, i) => (
                  <div key={p._id} className="px-6 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#F7F6F0] flex items-center justify-center text-sm font-bold text-[#7A6E42]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{p.name}</p>
                      <p className="text-xs text-neutral-400">{p.units} units</p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-800 shrink-0">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
