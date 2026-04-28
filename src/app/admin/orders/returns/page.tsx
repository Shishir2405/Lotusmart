"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiArrowGoBackLine,
  RiSearchLine,
  RiRefreshLine,
  RiCloseLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge, Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/helpers";
import toast from "@/components/ui/toast";

type Tab = "eligible" | "in_progress";

interface AdminOrder {
  _id: string;
  orderNumber: string;
  user?: { name: string; phone?: string };
  total: number;
  orderStatus: string;
  paymentStatus: string;
  awbNumber?: string;
  trackingNumber?: string;
  courierCompany?: string;
  shippingAddress?: { city?: string; state?: string };
  createdAt: string;
  deliveredAt?: string;
  returnedAt?: string;
  returnReason?: string;
  shipmozoReturnOrderId?: string;
  shipmozoReturnReferenceId?: string;
}

interface ReturnReason {
  id: number;
  title: string;
}

export default function AdminReturnsPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("eligible");
  const [search, setSearch] = useState("");
  const [reasons, setReasons] = useState<ReturnReason[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);

  const [target, setTarget] = useState<AdminOrder | null>(null);
  const [reasonId, setReasonId] = useState<string>("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    Promise.all([
      axios.get<{ data: AdminOrder[] }>("/api/admin/orders?limit=200&status=delivered"),
      axios.get<{ data: AdminOrder[] }>("/api/admin/orders?limit=200&status=returned"),
    ])
      .then(([del, ret]) => {
        const merged = [...(del.data.data ?? []), ...(ret.data.data ?? [])];
        // Dedup by _id (order can't be in both lists, but be safe).
        const seen = new Set<string>();
        const unique = merged.filter((o) => (seen.has(o._id) ? false : (seen.add(o._id), true)));
        setOrders(unique);
      })
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const eligible = useMemo(
    () => orders.filter((o) => o.orderStatus === "delivered" && !o.shipmozoReturnOrderId),
    [orders],
  );
  const inProgress = useMemo(
    () =>
      orders.filter(
        (o) => o.orderStatus === "returned" || !!o.shipmozoReturnOrderId,
      ),
    [orders],
  );

  const list = tab === "eligible" ? eligible : inProgress;
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.user?.name ?? "").toLowerCase().includes(q) ||
        (o.awbNumber ?? "").toLowerCase().includes(q),
    );
  }, [list, search]);

  function openReturn(order: AdminOrder) {
    setTarget(order);
    setReasonId("");
    setComment("");
    if (reasons.length === 0 && !reasonsLoading) {
      setReasonsLoading(true);
      axios
        .get<{ data: ReturnReason[] }>("/api/shipping/return-reasons")
        .then((r) => setReasons(r.data.data ?? []))
        .catch(() => toast.error("Failed to load return reasons"))
        .finally(() => setReasonsLoading(false));
    }
  }

  async function submitReturn() {
    if (!target) return;
    if (!reasonId) {
      toast.error("Pick a reason");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/shipping/return-order", {
        orderId: target._id,
        return_reason_id: Number(reasonId),
        customer_request: "RETURN",
        reason_comment: comment.trim(),
      });
      toast.success("Return initiated");
      setTarget(null);
      fetchOrders();
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Failed to initiate return"
          : "Failed to initiate return",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Returns</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Initiate reverse pickups via Shipmozo for delivered orders
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RiRefreshLine size={14} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setTab("eligible")}
          className={`text-left rounded-2xl border p-4 transition-all ${
            tab === "eligible"
              ? "border-[#E84672] bg-[#FFF1F3]"
              : "border-neutral-100 bg-white hover:border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <RiArrowGoBackLine
              size={18}
              className={tab === "eligible" ? "text-[#E84672]" : "text-neutral-500"}
            />
            <span
              className={`text-2xl font-bold ${tab === "eligible" ? "text-[#E84672]" : "text-neutral-800"}`}
            >
              {eligible.length}
            </span>
          </div>
          <p className="text-sm font-semibold text-neutral-800">Eligible</p>
          <p className="text-xs text-neutral-400 mt-0.5">Delivered orders without an active return</p>
        </button>

        <button
          onClick={() => setTab("in_progress")}
          className={`text-left rounded-2xl border p-4 transition-all ${
            tab === "in_progress"
              ? "border-[#E84672] bg-[#FFF1F3]"
              : "border-neutral-100 bg-white hover:border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <RiArrowGoBackLine
              size={18}
              className={tab === "in_progress" ? "text-[#E84672]" : "text-neutral-500"}
            />
            <span
              className={`text-2xl font-bold ${tab === "in_progress" ? "text-[#E84672]" : "text-neutral-800"}`}
            >
              {inProgress.length}
            </span>
          </div>
          <p className="text-sm font-semibold text-neutral-800">In Progress</p>
          <p className="text-xs text-neutral-400 mt-0.5">Returns already pushed to Shipmozo</p>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <div className="relative">
            <RiSearchLine
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, AWB, or customer"
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#E84672]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" rounded="xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center">
            <RiArrowGoBackLine size={36} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-sm font-semibold text-neutral-700">
              {tab === "eligible" ? "No eligible orders" : "No active returns"}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {tab === "eligible"
                ? "Orders must be delivered to be returnable."
                : "Returns initiated from this page will appear here."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">
                  {tab === "eligible" ? "Delivered" : "Return"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {visible.map((o) => (
                <motion.tr
                  key={o._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-[#FAFAF9]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="text-sm font-semibold text-neutral-800 hover:text-[#E84672]"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-neutral-400">{formatDate(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="text-neutral-700">{o.user?.name ?? "—"}</p>
                    {o.user?.phone && <p className="text-xs text-neutral-400">{o.user.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {o.shippingAddress?.city ?? "—"}
                    {o.shippingAddress?.state ? `, ${o.shippingAddress.state}` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tab === "eligible" ? (
                      o.deliveredAt ? (
                        <span className="text-neutral-600">{formatDate(o.deliveredAt)}</span>
                      ) : (
                        <OrderStatusBadge status={o.orderStatus} />
                      )
                    ) : (
                      <div className="space-y-1">
                        <OrderStatusBadge status={o.orderStatus} />
                        {o.shipmozoReturnOrderId && (
                          <p className="text-[0.68rem] font-mono text-neutral-400">
                            Ret: {o.shipmozoReturnOrderId}
                          </p>
                        )}
                        {o.returnReason && (
                          <Badge variant="neutral">{o.returnReason}</Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-neutral-800">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tab === "eligible" ? (
                      <Button size="sm" onClick={() => openReturn(o)}>
                        Initiate Return
                      </Button>
                    ) : (
                      <Link
                        href={`/admin/orders/${o._id}`}
                        className="text-sm text-[#E84672] hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {target && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && setTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <div>
                  <h3 className="font-semibold text-neutral-900">Initiate Return</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{target.orderNumber}</p>
                </div>
                <button
                  onClick={() => !submitting && setTarget(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    Reason
                  </label>
                  <select
                    value={reasonId}
                    onChange={(e) => setReasonId(e.target.value)}
                    disabled={reasonsLoading}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
                  >
                    <option value="">
                      {reasonsLoading ? "Loading reasons…" : "Select a reason"}
                    </option>
                    {reasons.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                    Comment <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Add any context the warehouse should see"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E84672] resize-none"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                  This pushes a reverse-pickup to Shipmozo using the customer&apos;s
                  delivery address. The order status will be set to
                  &quot;returned&quot;.
                </div>
              </div>
              <div className="flex gap-2 justify-end px-5 py-4 border-t border-neutral-100 bg-neutral-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTarget(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={submitReturn} isLoading={submitting} disabled={!reasonId}>
                  Confirm Return
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
