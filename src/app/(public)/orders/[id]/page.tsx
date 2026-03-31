"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiArrowLeftLine,
  RiMapPinLine,
  RiTruckLine,
  RiBankCardLine,
  RiTimeLine,
  RiPhoneLine,
  RiRefreshLine,
  RiFileCopyLine,
} from "react-icons/ri";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/utils/helpers";
import axios from "axios";
import toast from "react-hot-toast";

interface OrderDetail {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: string;
    name: string;
    image?: string;
    quantity: number;
    price: number;
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
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  billingAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  notes?: string;
}

interface TrackingEvent {
  date: string;
  status: string;
  activity: string;
  location: string;
}

const ORDER_STEPS = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<TrackingEvent[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    axios
      .get<{ data: OrderDetail }>(`/api/orders/${id}`)
      .then((r) => setOrder(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch tracking data if shipment exists
  useEffect(() => {
    if (!order?.shiprocketShipmentId && !order?.trackingNumber) return;
    fetchTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.shiprocketShipmentId, order?.trackingNumber]);

  const fetchTracking = async () => {
    if (!order) return;
    setTrackingLoading(true);
    try {
      const params = order.shiprocketShipmentId
        ? `shipmentId=${order.shiprocketShipmentId}`
        : `awb=${order.trackingNumber}`;
      const res = await axios.get(`/api/shipping/track?${params}`);
      const data = res.data?.data;

      // Parse Shiprocket tracking response
      if (data?.tracking_data?.shipment_track_activities) {
        setTrackingData(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.tracking_data.shipment_track_activities.map((a: any) => ({
            date: a.date,
            status: a["sr-status-label"] ?? a.status,
            activity: a.activity,
            location: a.location ?? "",
          })),
        );
      }
    } catch {
      // Tracking not available yet
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order?"))
      return;
    setCancelling(true);
    try {
      await axios.post(`/api/orders/${order._id}/cancel`);
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: "cancelled",
              cancelledAt: new Date().toISOString(),
            }
          : null,
      );
      toast.success("Order cancelled successfully");
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to cancel")
          : "Failed to cancel",
      );
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="container-narrow py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" rounded="xl" />
        <Skeleton className="h-64 w-full" rounded="xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-narrow py-24 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Order not found
        </h2>
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const stepIndex = ORDER_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";
  const isReturned = order.orderStatus === "returned";
  const canCancel = ["placed", "confirmed"].includes(order.orderStatus);

  return (
    <div className="container-narrow py-10">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6"
      >
        <RiArrowLeftLine size={15} />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">
              {order.orderNumber}
            </h1>
            <button
              onClick={() => copyToClipboard(order.orderNumber)}
              className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Copy order number"
            >
              <RiFileCopyLine size={14} />
            </button>
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.orderStatus} />
        </div>
      </div>

      {/* Progress tracker */}
      {!isCancelled && !isReturned && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-neutral-100 mb-5"
        >
          <div className="flex items-center justify-between">
            {ORDER_STEPS.map((step, i) => (
              <div
                key={step}
                className="flex-1 flex flex-col items-center relative"
              >
                {i < ORDER_STEPS.length - 1 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-0.5 ${i < stepIndex ? "bg-[#E84672]" : "bg-neutral-200"}`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                    i <= stepIndex
                      ? "bg-[#E84672] text-white"
                      : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <p
                  className={`text-xs mt-2 capitalize text-center ${
                    i <= stepIndex
                      ? "text-[#E84672] font-medium"
                      : "text-neutral-400"
                  }`}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>

          {order.trackingNumber && (
            <div className="mt-5 pt-4 border-t border-[#EBE8D8] flex items-center gap-2 text-sm text-neutral-600">
              <RiTruckLine className="text-[#E84672]" size={16} />
              <span>
                Tracking:{" "}
                <strong className="text-neutral-800">
                  {order.trackingNumber}
                </strong>
              </span>
              <button
                onClick={() => copyToClipboard(order.trackingNumber!)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <RiFileCopyLine size={12} />
              </button>
              {order.estimatedDelivery && (
                <span className="ml-auto text-xs text-neutral-400">
                  Est. delivery: {formatDate(order.estimatedDelivery)}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Cancelled/Returned banner */}
      {(isCancelled || isReturned) && (
        <div
          className={`rounded-2xl p-5 mb-5 border ${isCancelled ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
        >
          <p
            className={`font-semibold ${isCancelled ? "text-red-700" : "text-amber-700"}`}
          >
            Order {isCancelled ? "Cancelled" : "Returned"}
          </p>
          {order.cancelReason && (
            <p className="text-sm text-neutral-600 mt-1">
              Reason: {order.cancelReason}
            </p>
          )}
          {order.cancelledAt && (
            <p className="text-xs text-neutral-400 mt-1">
              On {formatDate(order.cancelledAt)}
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-5">
        {/* Items with images */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-3 space-y-5"
        >
          <div className="bg-white rounded-2xl p-5 border border-neutral-100">
            <h2 className="font-semibold text-neutral-900 mb-4">
              Items ({order.items.length})
            </h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 py-3 border-b border-[#F5F4ED] last:border-0"
                >
                  <div className="w-16 h-16 rounded-xl bg-[#F7F6F0] overflow-hidden shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg text-neutral-300">
                        🌿
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 text-sm">
                      {item.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {item.variant}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-neutral-800 text-sm shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-3 border-t border-[#EBE8D8] space-y-1.5">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Shipping</span>
                <span>
                  {order.shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    formatCurrency(order.shippingCost)
                  )}
                </span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-neutral-900 pt-1.5 border-t border-[#EBE8D8]">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shiprocket Tracking Timeline */}
          {(trackingData.length > 0 || trackingLoading) && (
            <div className="bg-white rounded-2xl p-5 border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                  <RiTruckLine className="text-[#E84672]" size={16} />
                  Shipment Tracking
                </h2>
                <button
                  onClick={fetchTracking}
                  disabled={trackingLoading}
                  className="text-xs text-[#E84672] hover:text-[#C9305A] flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RiRefreshLine
                    size={12}
                    className={trackingLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {trackingLoading && trackingData.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="relative">
                  {trackingData.map((event, i) => (
                    <div key={i} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            i === 0 ? "bg-[#E84672]" : "bg-neutral-300"
                          }`}
                        />
                        {i < trackingData.length - 1 && (
                          <div className="w-px flex-1 bg-neutral-200 mt-1" />
                        )}
                      </div>
                      <div className="min-w-0 -mt-1">
                        <p
                          className={`text-sm font-medium ${i === 0 ? "text-neutral-900" : "text-neutral-600"}`}
                        >
                          {event.activity || event.status}
                        </p>
                        {event.location && (
                          <p className="text-xs text-neutral-400">
                            {event.location}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-4"
        >
          {/* Shipping address */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-100">
            <div className="flex items-center gap-2 mb-3">
              <RiMapPinLine className="text-[#E84672]" size={16} />
              <h2 className="font-semibold text-neutral-900 text-sm">
                Shipping Address
              </h2>
            </div>
            <p className="text-sm font-medium text-neutral-800">
              {order.shippingAddress.fullName}
            </p>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 &&
                `, ${order.shippingAddress.addressLine2}`}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
              {order.shippingAddress.pincode}
            </p>
            <p className="text-sm text-neutral-400 mt-1 flex items-center gap-1">
              <RiPhoneLine size={12} /> {order.shippingAddress.phone}
            </p>
          </div>

          {/* Payment details */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-100">
            <div className="flex items-center gap-2 mb-3">
              <RiBankCardLine className="text-[#E84672]" size={16} />
              <h2 className="font-semibold text-neutral-900 text-sm">
                Payment Details
              </h2>
            </div>
            <div className="text-sm text-neutral-600 space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium text-neutral-800 uppercase">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between items-center">
                  <span>Payment ID</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-neutral-600">
                      {order.razorpayPaymentId}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.razorpayPaymentId!)
                      }
                      className="p-0.5 text-neutral-400 hover:text-neutral-600"
                    >
                      <RiFileCopyLine size={10} />
                    </button>
                  </div>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="flex justify-between items-center">
                  <span>Order ID</span>
                  <span className="font-mono text-xs text-neutral-600">
                    {order.razorpayOrderId}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Amount Paid</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Order timeline */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-100">
            <div className="flex items-center gap-2 mb-3">
              <RiTimeLine className="text-[#E84672]" size={16} />
              <h2 className="font-semibold text-neutral-900 text-sm">
                Timeline
              </h2>
            </div>
            <div className="text-sm text-neutral-600 space-y-2">
              <div className="flex justify-between">
                <span>Ordered</span>
                <span className="text-neutral-800">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span>Delivered</span>
                  <span className="text-green-600">
                    {formatDate(order.deliveredAt)}
                  </span>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex justify-between">
                  <span>Cancelled</span>
                  <span className="text-red-600">
                    {formatDate(order.cancelledAt)}
                  </span>
                </div>
              )}
              {order.estimatedDelivery &&
                !order.deliveredAt &&
                !isCancelled && (
                  <div className="flex justify-between">
                    <span>Est. Delivery</span>
                    <span className="text-neutral-800">
                      {formatDate(order.estimatedDelivery)}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl p-5 border border-neutral-100">
              <h2 className="font-semibold text-neutral-900 text-sm mb-2">
                Order Notes
              </h2>
              <p className="text-sm text-neutral-600">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {canCancel && (
              <Button
                variant="outline"
                fullWidth
                onClick={handleCancel}
                isLoading={cancelling}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Order
              </Button>
            )}
            <Link href="/orders">
              <Button variant="outline" className="w-full">
                Back to Orders
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
