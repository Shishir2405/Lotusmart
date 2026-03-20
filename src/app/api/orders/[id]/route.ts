import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";
import { sendShippingUpdate } from "@/services/email";

// GET /api/orders/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { id } = await params;

    const order = await Order.findById(id).lean();
    if (!order) throw ApiError.notFound("Order not found");

    // Customers can only view their own orders
    if (authUser.role !== "admin" && order.user.toString() !== authUser.userId) {
      throw ApiError.forbidden("Access denied");
    }

    return successResponse(order);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

// PATCH /api/orders/[id] — admin status update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const {
      orderStatus,
      paymentStatus,
      trackingNumber,
      shiprocketOrderId,
      shiprocketShipmentId,
      estimatedDelivery,
      cancelReason,
    } = body;

    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound("Order not found");

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shiprocketOrderId) order.shiprocketOrderId = shiprocketOrderId;
    if (shiprocketShipmentId) order.shiprocketShipmentId = shiprocketShipmentId;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    if (cancelReason) order.cancelReason = cancelReason;

    if (orderStatus === "delivered") order.deliveredAt = new Date();
    if (orderStatus === "cancelled") order.cancelledAt = new Date();

    await order.save();

    // Notify customer of shipping update
    if (orderStatus && ["shipped", "delivered", "cancelled"].includes(orderStatus)) {
      sendShippingUpdate(
        body.customerEmail ?? "",
        body.customerName ?? "Customer",
        order.orderNumber,
        orderStatus,
        trackingNumber,
      ).catch(() => null);
    }

    return successResponse(order, "Order updated");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
