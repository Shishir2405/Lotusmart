"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/utils/helpers";
import axios from "axios";

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<{ data: Order[] }>("/api/orders?limit=20")
      .then((r) => setOrders(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-narrow py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="container-narrow py-24 text-center">
        <div className="text-6xl mb-5">📦</div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">No orders yet</h2>
        <p className="text-neutral-500 mb-8">Place your first order and it'll appear here.</p>
        <Link href="/products"><Button size="lg">Start Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="container-narrow py-10">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order, i) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 border border-neutral-100 hover:border-neutral-200 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-bold text-neutral-800">{order.orderNumber}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <PaymentStatusBadge status={order.paymentStatus} />
                <OrderStatusBadge status={order.orderStatus} />
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              {order.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-neutral-600">{item.name} × {item.quantity}</span>
                  <span className="text-neutral-800 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-xs text-neutral-400">+{order.items.length - 3} more items</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EBE8D8]">
              <div>
                <span className="text-base font-bold text-neutral-900">{formatCurrency(order.total)}</span>
                <span className="text-xs text-neutral-400 ml-2">via {order.paymentMethod.toUpperCase()}</span>
              </div>
              <Link href={`/orders/${order._id}`}>
                <Button variant="outline" size="sm">View Details</Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
