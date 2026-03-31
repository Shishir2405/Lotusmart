"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { RiArrowLeftLine, RiMapPinLine, RiTruckLine } from "react-icons/ri";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/utils/helpers";
import axios from "axios";

interface OrderDetail {
  _id: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number; variant?: { name: string; value: string } }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
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

const ORDER_STEPS = ["placed", "confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<{ data: OrderDetail }>(`/api/orders/${id}`)
      .then((r) => setOrder(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

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
        <div className="text-neutral-300 mb-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Order not found</h2>
        <Link href="/orders"><Button variant="outline">Back to Orders</Button></Link>
      </div>
    );
  }

  const stepIndex = ORDER_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";

  return (
    <div className="container-narrow py-10">
      {/* Back */}
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6">
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

      {/* Progress tracker */}
      {!isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-neutral-100 mb-5"
        >
          <div className="flex items-center justify-between">
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex flex-col items-center relative">
                {i < ORDER_STEPS.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < stepIndex ? "bg-[#E84672]" : "bg-neutral-200"}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${i <= stepIndex ? "bg-[#E84672] text-white" : "bg-neutral-100 text-neutral-400"}`}>
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <p className={`text-xs mt-2 capitalize text-center ${i <= stepIndex ? "text-[#E84672] font-medium" : "text-neutral-400"}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>
          {order.trackingNumber && (
            <div className="mt-5 pt-4 border-t border-[#EBE8D8] flex items-center gap-2 text-sm text-neutral-600">
              <RiTruckLine className="text-[#E84672]" size={16} />
              <span>Tracking: <strong className="text-neutral-800">{order.trackingNumber}</strong></span>
              {order.estimatedDelivery && (
                <span className="ml-auto text-xs text-neutral-400">
                  Est. delivery: {formatDate(order.estimatedDelivery)}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      <div className="grid md:grid-cols-5 gap-5">
        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-3 bg-white rounded-2xl p-5 border border-neutral-100"
        >
          <h2 className="font-semibold text-neutral-900 mb-4">
            Items ({order.items.length})
          </h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm py-2.5 border-b border-[#F5F4ED] last:border-0">
                <div>
                  <p className="font-medium text-neutral-800">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-neutral-400 mt-0.5">{item.variant.name}: {item.variant.value}</p>
                  )}
                  <p className="text-xs text-neutral-400 mt-0.5">× {item.quantity}</p>
                </div>
                <span className="font-semibold text-neutral-800">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-3 border-t border-[#EBE8D8] space-y-1.5">
            <div className="flex justify-between text-sm text-neutral-500">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-500">
              <span>Shipping</span>
              <span>{order.shippingCost === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatCurrency(order.shippingCost)}</span>
            </div>
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

        {/* Shipping info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-4"
        >
          <div className="bg-white rounded-2xl p-5 border border-neutral-100">
            <div className="flex items-center gap-2 mb-3">
              <RiMapPinLine className="text-[#E84672]" size={16} />
              <h2 className="font-semibold text-neutral-900 text-sm">Shipping Address</h2>
            </div>
            <p className="text-sm font-medium text-neutral-800">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
            <p className="text-sm text-neutral-400 mt-1">{order.shippingAddress.phone}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-100">
            <h2 className="font-semibold text-neutral-900 text-sm mb-3">Payment Info</h2>
            <div className="text-sm text-neutral-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium text-neutral-800 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>

          <Link href="/orders">
            <Button variant="outline" className="w-full">
              Back to Orders
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
