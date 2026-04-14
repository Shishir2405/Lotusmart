import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { assignCourier, autoAssignOrder } from "@/services/shipmozo";
import Order from "@/modules/orders/order.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { orderId, courier_id, auto } = await request.json();
    if (!orderId) throw ApiError.badRequest("orderId is required");

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");
    if (!order.shipmozoOrderId) throw ApiError.badRequest("Order not pushed to Shipmozo yet");

    let result;

    if (auto) {
      result = await autoAssignOrder(order.shipmozoOrderId);
      if (result.result !== "1") {
        throw ApiError.badRequest(result.message || "Auto-assign failed");
      }
      order.awbNumber = result.data.awb_number;
      order.trackingNumber = result.data.awb_number;
      order.courierCompany = result.data.courier_company;
    } else {
      if (!courier_id) throw ApiError.badRequest("courier_id is required for manual assignment");
      result = await assignCourier(order.shipmozoOrderId, Number(courier_id));
      if (result.result !== "1") {
        throw ApiError.badRequest(result.message || "Courier assignment failed");
      }
      order.courierCompany = result.data.courier;
    }

    order.orderStatus = "processing";
    await order.save();

    return successResponse(result.data, "Courier assigned");
  } catch (err) {
    console.error("[Shipmozo assign-courier]", (err as any)?.response?.data ?? (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
