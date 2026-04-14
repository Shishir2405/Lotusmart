import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { cancelShipmozoOrder } from "@/services/shipmozo";
import Order from "@/modules/orders/order.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { orderId } = await request.json();
    if (!orderId) throw ApiError.badRequest("orderId is required");

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");
    if (!order.shipmozoOrderId) throw ApiError.badRequest("Order not pushed to Shipmozo yet");
    if (!order.awbNumber) throw ApiError.badRequest("No AWB number to cancel");

    const result = await cancelShipmozoOrder(order.shipmozoOrderId, Number(order.awbNumber));

    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Cancellation failed");
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    return successResponse(result.data, "Shipmozo order cancelled");
  } catch (err) {
    console.error("[Shipmozo cancel]", (err as any)?.response?.data ?? (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
