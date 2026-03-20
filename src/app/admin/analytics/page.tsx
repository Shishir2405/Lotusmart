"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RiMoneyDollarCircleLine,
  RiShoppingCartLine,
  RiUserLine,
  RiShoppingBag3Line,
  RiArrowUpLine,
  RiArrowDownLine,
} from "react-icons/ri";
import { formatCurrency } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/ui/Badge";
import axios from "axios";

interface AnalyticsData {
  summary: { revenue: number; orders: number; users: number; products: number };
  revenueByDay: Array<{ _id: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ _id: string; count: number }>;
  topProducts: Array<{ _id: string; name: string; revenue: number; units: number }>;
}

const RANGES = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "1 year", value: "365" },
];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    setLoading(true);
    axios
      .get<{ data: AnalyticsData }>(`/api/admin/analytics?range=${range}`)
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [range]);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(data?.summary.revenue ?? 0),
      icon: RiMoneyDollarCircleLine,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Orders",
      value: String(data?.summary.orders ?? 0),
      icon: RiShoppingCartLine,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Customers",
      value: String(data?.summary.users ?? 0),
      icon: RiUserLine,
      color: "text-rose-500 bg-rose-50",
    },
    {
      label: "Active Products",
      value: String(data?.summary.products ?? 0),
      icon: RiShoppingBag3Line,
      color: "text-olive-500 bg-olive-50",
    },
  ];

  // Build simple bar chart from revenueByDay
  const maxRevenue = Math.max(...(data?.revenueByDay.map((d) => d.revenue) ?? [1]));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Sales and performance overview</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === r.value
                  ? "bg-rose-500 text-white"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
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

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-semibold text-neutral-900 mb-5">Revenue by Day</h2>
          {loading ? (
            <div className="flex items-end gap-1 h-40">
              {Array.from({ length: 14 }).map((_, i) => (
                <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
              ))}
            </div>
          ) : data?.revenueByDay.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-neutral-400 text-sm">
              No revenue data for this period
            </div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {data?.revenueByDay.slice(-30).map((day) => {
                const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={day._id}
                    className="flex-1 group relative"
                    style={{ height: "100%", display: "flex", alignItems: "flex-end" }}
                  >
                    <div
                      className="w-full bg-rose-100 hover:bg-rose-400 rounded-t transition-colors cursor-pointer"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {day._id}<br />{formatCurrency(day.revenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-semibold text-neutral-900 mb-5">Orders by Status</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" rounded="full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.ordersByStatus.map((s) => (
                <div key={s._id} className="flex items-center justify-between">
                  <OrderStatusBadge status={s._id} />
                  <span className="text-sm font-semibold text-neutral-700">{s.count}</span>
                </div>
              ))}
              {(data?.ordersByStatus.length ?? 0) === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">No orders yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Top Products by Revenue</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Units Sold</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              : data?.topProducts.map((p, i) => (
                  <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-6 h-6 rounded-md bg-olive-50 flex items-center justify-center text-xs font-bold text-olive-500">
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-neutral-800">{p.name}</td>
                    <td className="px-4 py-4 text-sm text-neutral-500">{p.units} units</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-neutral-800">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
