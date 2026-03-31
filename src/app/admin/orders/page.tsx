"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import axios from "axios";
import toast from "react-hot-toast";

interface Order {
  _id: string;
  orderNumber: string;
  user?: { name: string; email: string };
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

const STATUS_OPTIONS = ["all", "placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", ...(filterStatus !== "all" && { status: filterStatus }) });
    axios.get<{ data: Order[]; pagination: { totalPages: number } }>(`/api/admin/orders?${params}`)
      .then((r) => { setOrders(r.data.data); setTotalPages(r.data.pagination.totalPages); })
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/orders/${id}`, { orderStatus: status });
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, orderStatus: status } : o));
      toast.success("Order updated");
    } catch { toast.error("Failed to update order"); }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Orders</h1>

      
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s ? "bg-[#E84672] text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Items</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Payment</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td></tr>
                ))
              : orders.map((order) => (
                  <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order._id}`} className="text-sm font-semibold text-neutral-800 hover:text-rose-500 transition-colors">
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-neutral-400">{formatDate(order.createdAt)}</p>
                      {order.user && <p className="text-xs text-neutral-400">{order.user.name}</p>}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600">
                      {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-neutral-800">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-4"><PaymentStatusBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-4"><OrderStatusBadge status={order.orderStatus} /></td>
                    <td className="px-4 py-4">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#E84672] bg-white cursor-pointer"
                      >
                        {["placed","confirmed","processing","shipped","delivered","cancelled","returned"].map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>

      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl border border-neutral-200 text-sm disabled:opacity-40 hover:border-neutral-300 transition-colors">Previous</button>
          <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border border-neutral-200 text-sm disabled:opacity-40 hover:border-neutral-300 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
