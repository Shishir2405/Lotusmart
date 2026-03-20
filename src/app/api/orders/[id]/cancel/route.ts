// POST /api/orders/[id]/cancel — customer cancels their own order

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";
import Product from "@/modules/products/product.model";

type Params = { params: Promise<{ id: string }> };

const CANCELLABLE_STATUSES = ["placed", "confirmed"];

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const cancelReason = body.reason ?? "Cancelled by customer";

    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound("Order not found");

    // Only owner can cancel (admin can cancel via PATCH /api/orders/[id])
    if (order.user.toString() !== authUser.userId) {
      throw ApiError.forbidden("Access denied");
    }

    if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
      throw ApiError.badRequest(
        `Order cannot be cancelled — current status is "${order.orderStatus}". Only placed or confirmed orders can be cancelled.`
      );
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = cancelReason;
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    return successResponse(order, "Order cancelled successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
