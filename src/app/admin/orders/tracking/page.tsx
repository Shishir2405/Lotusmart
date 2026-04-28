"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import {
  RiMapPin2Line,
  RiTruckLine,
  RiSearchLine,
  RiRefreshLine,
  RiCalendarLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge, Badge } from "@/components/ui/Badge";
import { formatDate } from "@/utils/helpers";
import toast from "@/components/ui/toast";

interface AdminOrder {
  _id: string;
  orderNumber: string;
  user?: { name: string };
  orderStatus: string;
  awbNumber?: string;
  trackingNumber?: string;
  courierCompany?: string;
  shippingAddress?: { city?: string; state?: string };
  createdAt: string;
}

interface TrackingScan {
  date: string;
  activity: string;
  location: string;
}

interface TrackingResult {
  order_id: string;
  reference_id: string;
  awb_number: string;
  courier: string;
  expected_delivery_date: string | null;
  current_status: string;
  status_time: string | null;
  scan_detail: TrackingScan[];
}

export default function AdminTrackingPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [awbInput, setAwbInput] = useState("");
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedAwb, setTrackedAwb] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    axios
      .get<{ data: AdminOrder[] }>(`/api/admin/orders?limit=200&paymentStatus=paid`)
      .then((r) => {
        const withAwb = (r.data.data ?? []).filter((o) => !!(o.awbNumber || o.trackingNumber));
        setOrders(withAwb);
      })
      .catch(() => toast.error("Failed to load shipments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.awbNumber ?? o.trackingNumber ?? "").toLowerCase().includes(q) ||
        (o.user?.name ?? "").toLowerCase().includes(q),
    );
  }, [orders, search]);

  async function handleTrack(awb: string) {
    const value = awb.trim();
    if (!value) {
      toast.error("Enter an AWB number");
      return;
    }
    setTrackingLoading(true);
    setTracking(null);
    setTrackedAwb(value);
    try {
      const res = await axios.get<{ data: TrackingResult }>(`/api/shipping/track?awb=${value}`);
      setTracking(res.data.data);
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Tracking failed"
          : "Tracking failed",
      );
    } finally {
      setTrackingLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Track Shipments</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Look up live tracking for any AWB or pick a recent shipment below
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RiRefreshLine size={14} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* AWB lookup */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-5">
        <h2 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
          <RiMapPin2Line className="text-[#E84672]" size={18} />
          Track by AWB
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack(awbInput);
          }}
          className="flex gap-2 flex-wrap"
        >
          <input
            type="text"
            value={awbInput}
            onChange={(e) => setAwbInput(e.target.value)}
            placeholder="Enter AWB number"
            className="flex-1 min-w-[200px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
          />
          <Button type="submit" isLoading={trackingLoading} disabled={!awbInput.trim()}>
            Track <RiArrowRightLine size={14} className="ml-1" />
          </Button>
        </form>

        {trackedAwb && (
          <div className="mt-5 pt-5 border-t border-neutral-100">
            {trackingLoading && (
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
            {!trackingLoading && tracking && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <RiTruckLine className="text-[#E84672]" size={16} />
                      <span className="font-mono text-sm text-neutral-700">{tracking.awb_number}</span>
                      <Badge variant="primary">{tracking.courier}</Badge>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Order #{tracking.reference_id || tracking.order_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info" dot>{tracking.current_status || "Unknown"}</Badge>
                    {tracking.expected_delivery_date && (
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1 justify-end">
                        <RiCalendarLine size={12} />
                        ETA {formatDate(tracking.expected_delivery_date)}
                      </p>
                    )}
                  </div>
                </div>

                {tracking.scan_detail?.length ? (
                  <div className="space-y-3">
                    {tracking.scan_detail.map((event, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${
                              i === 0 ? "bg-[#E84672]" : "bg-neutral-300"
                            }`}
                          />
                          {i < tracking.scan_detail.length - 1 && (
                            <div className="w-px flex-1 bg-neutral-200 mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="font-medium text-neutral-800">{event.activity}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {event.location} · {event.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">No tracking events yet.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Recent shipments */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-neutral-800 text-sm">Recent Shipments</h3>
          <div className="relative flex-1 min-w-[200px]">
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
            <RiTruckLine size={36} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-sm font-semibold text-neutral-700">No shipments yet</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Orders with assigned AWB will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">AWB</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Courier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {visible.map((o) => {
                const awb = o.awbNumber ?? o.trackingNumber ?? "";
                return (
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
                    <td className="px-4 py-3 text-sm text-neutral-700">{o.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{awb}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{o.courierCompany ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {o.shippingAddress?.city ?? "—"}
                      {o.shippingAddress?.state ? `, ${o.shippingAddress.state}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAwbInput(awb);
                          handleTrack(awb);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Track
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
