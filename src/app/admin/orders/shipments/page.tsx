"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import {
  RiTruckLine,
  RiSendPlaneLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiRefreshLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge, OrderStatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/helpers";
import toast from "@/components/ui/toast";

type Stage = "needs_push" | "needs_courier" | "needs_pickup";

interface AdminOrder {
  _id: string;
  orderNumber: string;
  user?: { name: string; email: string; phone?: string };
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  shipmozoOrderId?: string;
  shipmozoReferenceId?: string;
  awbNumber?: string;
  trackingNumber?: string;
  courierCompany?: string;
  shippingAddress?: { city?: string; state?: string; pincode?: string };
  createdAt: string;
}

const STAGE_META: Record<
  Stage,
  { label: string; helper: string; actionLabel: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  needs_push: {
    label: "Needs Push",
    helper: "Paid orders not yet pushed to Shipmozo",
    actionLabel: "Push to Shipmozo",
    icon: RiSendPlaneLine,
  },
  needs_courier: {
    label: "Needs Courier",
    helper: "Pushed to Shipmozo, awaiting courier assignment",
    actionLabel: "Auto-assign Courier",
    icon: RiTruckLine,
  },
  needs_pickup: {
    label: "Needs Pickup",
    helper: "Courier assigned, awaiting pickup",
    actionLabel: "Schedule Pickup",
    icon: RiTimeLine,
  },
};

function classifyStage(o: AdminOrder): Stage | null {
  if (o.paymentStatus !== "paid") return null;
  if (!o.shipmozoOrderId) return "needs_push";
  if (!o.awbNumber && !o.trackingNumber) return "needs_courier";
  if (o.orderStatus !== "shipped" && o.orderStatus !== "delivered" && o.orderStatus !== "cancelled") {
    return "needs_pickup";
  }
  return null;
}

export default function AdminShipmentsPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("needs_courier");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});

  const fetchOrders = () => {
    setLoading(true);
    axios
      .get<{ data: AdminOrder[] }>(`/api/admin/orders?limit=200&paymentStatus=paid`)
      .then((r) => setOrders(r.data.data ?? []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setSelected(new Set());
  }, [stage]);

  const counts = useMemo(() => {
    const c: Record<Stage, number> = { needs_push: 0, needs_courier: 0, needs_pickup: 0 };
    for (const o of orders) {
      const s = classifyStage(o);
      if (s) c[s]++;
    }
    return c;
  }, [orders]);

  const visibleOrders = useMemo(
    () => orders.filter((o) => classifyStage(o) === stage),
    [orders, stage],
  );

  const allSelected = visibleOrders.length > 0 && visibleOrders.every((o) => selected.has(o._id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleOrders.map((o) => o._id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runStageAction(orderId: string): Promise<{ ok: boolean; message?: string }> {
    try {
      if (stage === "needs_push") {
        await axios.post("/api/shipping/push-order", { orderId });
      } else if (stage === "needs_courier") {
        await axios.post("/api/shipping/assign-courier", { orderId, auto: true });
      } else if (stage === "needs_pickup") {
        await axios.post("/api/shipping/schedule-pickup", { orderId });
      }
      return { ok: true };
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Failed"
        : "Failed";
      return { ok: false, message };
    }
  }

  async function handleRowAction(orderId: string) {
    setRowBusy((p) => ({ ...p, [orderId]: true }));
    const res = await runStageAction(orderId);
    setRowBusy((p) => ({ ...p, [orderId]: false }));
    if (res.ok) {
      toast.success(STAGE_META[stage].actionLabel + " ✓");
      fetchOrders();
    } else {
      toast.error(res.message ?? "Failed");
    }
  }

  async function handleBulk() {
    if (selected.size === 0) return;
    setBulkRunning(true);
    const ids = Array.from(selected);
    let success = 0;
    let failed = 0;
    // Sequential — Shipmozo doesn't document a bulk endpoint and parallel
    // calls risk rate-limit/race conditions on warehouse selection.
    for (const id of ids) {
      const res = await runStageAction(id);
      if (res.ok) success++;
      else failed++;
    }
    setBulkRunning(false);
    setSelected(new Set());
    fetchOrders();
    if (failed === 0) toast.success(`${success} order(s) processed`);
    else toast.error(`${success} succeeded, ${failed} failed`);
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Shipments</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Move paid orders through the Shipmozo shipping pipeline
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RiRefreshLine size={14} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {(Object.keys(STAGE_META) as Stage[]).map((s) => {
          const meta = STAGE_META[s];
          const Icon = meta.icon;
          const active = stage === s;
          return (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                active
                  ? "border-[#E84672] bg-[#FFF1F3]"
                  : "border-neutral-100 bg-white hover:border-neutral-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon size={18} className={active ? "text-[#E84672]" : "text-neutral-500"} />
                <span
                  className={`text-2xl font-bold ${active ? "text-[#E84672]" : "text-neutral-800"}`}
                >
                  {counts[s]}
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-800">{meta.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{meta.helper}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={visibleOrders.length === 0}
              className="w-4 h-4 accent-[#E84672]"
            />
            <span className="text-sm text-neutral-500">
              {selected.size > 0
                ? `${selected.size} selected`
                : `${visibleOrders.length} order(s)`}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleBulk}
            isLoading={bulkRunning}
            disabled={selected.size === 0}
          >
            {STAGE_META[stage].actionLabel} ({selected.size})
          </Button>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" rounded="xl" />
            ))}
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-12 text-center">
            <RiCheckboxCircleLine size={36} className="mx-auto text-green-400 mb-2" />
            <p className="text-sm font-semibold text-neutral-700">All caught up</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              No orders in &quot;{STAGE_META[stage].label}&quot; right now.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Shipping</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {visibleOrders.map((o) => (
                <motion.tr
                  key={o._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-[#FAFAF9]"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o._id)}
                      onChange={() => toggleOne(o._id)}
                      className="w-4 h-4 accent-[#E84672]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="text-sm font-semibold text-neutral-800 hover:text-[#E84672]"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-neutral-400">{formatDate(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-neutral-700">{o.user?.name ?? "—"}</p>
                    {o.user?.phone && <p className="text-xs text-neutral-400">{o.user.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {o.shippingAddress?.city ?? "—"}
                    {o.shippingAddress?.state ? `, ${o.shippingAddress.state}` : ""}
                    {o.shippingAddress?.pincode ? ` · ${o.shippingAddress.pincode}` : ""}
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <OrderStatusBadge status={o.orderStatus} />
                    {o.shipmozoOrderId && (
                      <p className="text-[0.68rem] font-mono text-neutral-400">
                        SM: {o.shipmozoOrderId}
                      </p>
                    )}
                    {o.awbNumber && (
                      <Badge variant="info" dot>AWB: {o.awbNumber}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-neutral-800">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      onClick={() => handleRowAction(o._id)}
                      isLoading={!!rowBusy[o._id]}
                    >
                      {STAGE_META[stage].actionLabel}
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
