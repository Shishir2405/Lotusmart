"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RiArrowLeftLine,
  RiMapPinLine,
  RiTruckLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
} from "react-icons/ri";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/utils/helpers";
import axios from "axios";
import toast from "react-hot-toast";

interface TrackingEvent {
  date: string;
  activity: string;
  location: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  user?: { _id: string; name: string; email: string; phone?: string };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
    variant?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  trackingNumber?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const ORDER_STATUSES = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
const ORDER_STEPS = ["placed", "confirmed", "processing", "shipped", "delivered"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingEvent[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    axios
      .get<{ data: OrderDetail }>(`/api/orders/${id}`)
      .then((r) => {
        setOrder(r.data.data);
        setNewStatus(r.data.data.orderStatus);
      })
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchTracking = async () => {
    if (!order?.shiprocketShipmentId && !order?.trackingNumber) {
      toast.error("No shipment ID or tracking number available");
      return;
    }
    setTrackingLoading(true);
    try {
      const params = order.shiprocketShipmentId
        ? `?shipmentId=${order.shiprocketShipmentId}`
        : `?awb=${order.trackingNumber}`;
      const res = await axios.get<{ data: { tracking_data?: { shipment_track_activities?: TrackingEvent[] } } }>(
        `/api/shipping/track${params}`
      );
      const activities = res.data.data?.tracking_data?.shipment_track_activities ?? [];
      setTracking(activities);
    } catch {
      toast.error("Could not fetch tracking info");
    } finally {
      setTrackingLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!newStatus || newStatus === order?.orderStatus) return;
    setUpdatingStatus(true);
    try {
      await axios.patch(`/api/orders/${id}`, { orderStatus: newStatus });
      setOrder((prev) => prev ? { ...prev, orderStatus: newStatus } : prev);
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" rounded="2xl" />
            <Skeleton className="h-64 w-full" rounded="2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" rounded="2xl" />
            <Skeleton className="h-32 w-full" rounded="2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center py-24">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Order not found</h2>
        <Link href="/admin/orders"><Button variant="outline">Back to Orders</Button></Link>
      </div>
    );
  }

  const stepIndex = ORDER_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled" || order.orderStatus === "returned";

  return (
    <div className="p-8">
      {/* Header */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-5"
      >
        <RiArrowLeftLine size={15} />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{order.orderNumber}</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.orderStatus} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Progress tracker */}
          {!isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-neutral-100"
            >
              <h2 className="font-semibold text-neutral-900 mb-5">Order Progress</h2>
              <div className="flex items-center justify-between">
                {ORDER_STEPS.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center relative">
                    {i < ORDER_STEPS.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 ${i < stepIndex ? "bg-[#E84672]" : "bg-neutral-200"}`}
                      />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                        i <= stepIndex ? "bg-[#E84672] text-white" : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {i < stepIndex ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs mt-2 capitalize text-center ${i <= stepIndex ? "text-[#E84672] font-medium" : "text-neutral-400"}`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              {order.trackingNumber && (
                <div className="mt-5 pt-4 border-t border-[#EBE8D8] flex items-center gap-2 text-sm">
                  <RiTruckLine className="text-[#E84672] shrink-0" size={16} />
                  <span className="text-neutral-600">
                    AWB: <strong className="text-neutral-800">{order.trackingNumber}</strong>
                  </span>
                  {order.estimatedDelivery && (
                    <span className="ml-auto text-xs text-neutral-400 shrink-0">
                      Est. delivery: {formatDate(order.estimatedDelivery)}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Items */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 border border-neutral-100"
          >
            <h2 className="font-semibold text-neutral-900 mb-4">Items ({order.items.length})</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-2.5 border-b border-[#F5F4ED] last:border-0">
                  <div>
                    <p className="font-medium text-neutral-800">{item.name}</p>
                    {item.variant && <p className="text-xs text-neutral-400 mt-0.5">{item.variant}</p>}
                    <p className="text-xs text-neutral-400 mt-0.5">× {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-neutral-800">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#EBE8D8] space-y-1.5">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? <span className="text-green-600">FREE</span> : formatCurrency(order.shippingCost)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Tax</span><span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-neutral-900 pt-1.5 border-t border-[#EBE8D8]">
                <span>Total</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </motion.div>

          {/* Shipment tracking */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-neutral-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                <RiTruckLine className="text-[#E84672]" size={18} />
                Shipment Tracking
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchTracking}
                isLoading={trackingLoading}
              >
                {tracking ? "Refresh" : "Fetch Tracking"}
              </Button>
            </div>

            {order.shiprocketOrderId && (
              <div className="text-xs text-neutral-400 mb-3 space-y-0.5">
                {order.shiprocketOrderId && <p>Shiprocket Order: <span className="font-mono text-neutral-600">{order.shiprocketOrderId}</span></p>}
                {order.shiprocketShipmentId && <p>Shipment ID: <span className="font-mono text-neutral-600">{order.shiprocketShipmentId}</span></p>}
              </div>
            )}

            {tracking === null && !trackingLoading && (
              <p className="text-sm text-neutral-400 text-center py-6">
                Click &quot;Fetch Tracking&quot; to load live shipment updates.
              </p>
            )}

            {tracking !== null && tracking.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-6">No tracking events yet.</p>
            )}

            {tracking && tracking.length > 0 && (
              <div className="space-y-3">
                {tracking.map((event, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${i === 0 ? "bg-[#E84672]" : "bg-neutral-300"}`} />
                      {i < tracking.length - 1 && <div className="w-px flex-1 bg-neutral-200 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="font-medium text-neutral-800">{event.activity}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{event.location} · {event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Update status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-neutral-100"
          >
            <h2 className="font-semibold text-neutral-900 text-sm mb-3">Update Status</h2>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white mb-3"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <Button
              fullWidth
              onClick={updateStatus}
              isLoading={updatingStatus}
              disabled={newStatus === order.orderStatus}
            >
              Update Status
            </Button>
            {order.cancelReason && (
              <p className="text-xs text-red-500 mt-2">Cancel reason: {order.cancelReason}</p>
            )}
          </motion.div>

          {/* Customer info */}
          {order.user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-5 border border-neutral-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <RiUserLine className="text-[#E84672]" size={16} />
                <h2 className="font-semibold text-neutral-900 text-sm">Customer</h2>
              </div>
              <p className="text-sm font-medium text-neutral-800">{order.user.name}</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <RiMailLine size={12} />
                  {order.user.email}
                </div>
                {order.user.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <RiPhoneLine size={12} />
                    {order.user.phone}
                  </div>
                )}
              </div>
              <Link href={`/admin/users`} className="text-xs text-[#E84672] hover:underline mt-2 inline-block">
                View customer →
              </Link>
            </motion.div>
          )}

          {/* Shipping address */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-neutral-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <RiMapPinLine className="text-[#E84672]" size={16} />
              <h2 className="font-semibold text-neutral-900 text-sm">Shipping Address</h2>
            </div>
            <p className="text-sm font-medium text-neutral-800">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
            <p className="text-xs text-neutral-400 mt-1">📞 {order.shippingAddress.phone}</p>
          </motion.div>

          {/* Payment info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border border-neutral-100"
          >
            <h2 className="font-semibold text-neutral-900 text-sm mb-3">Payment</h2>
            <div className="text-sm text-neutral-600 space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium text-neutral-800 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              {order.razorpayOrderId && (
                <div className="pt-2 border-t border-[#EBE8D8]">
                  <p className="text-xs text-neutral-400">
                    Razorpay ID: <span className="font-mono text-neutral-600">{order.razorpayOrderId}</span>
                  </p>
                  {order.razorpayPaymentId && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Payment ID: <span className="font-mono text-neutral-600">{order.razorpayPaymentId}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {order.notes && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-50 rounded-2xl p-4 border border-amber-100"
            >
              <p className="text-xs font-semibold text-amber-700 mb-1">Order Notes</p>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
