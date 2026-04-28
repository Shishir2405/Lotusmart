import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { assignCourier, autoAssignOrder } from "@/services/shipmozo";
import Order from "@/modules/orders/order.model";

// Shipmozo's "Error" message is uninformative; dig into `data` for the real
// reason and combine into something a human can read.
function deriveErrorMessage(
  fallback: string,
  raw: { message?: string; data?: unknown },
): string {
  const data = raw.data as
    | { error?: string; Info?: string; message?: string }
    | string
    | undefined;
  const detail =
    typeof data === "string"
      ? data
      : data?.error || data?.Info || data?.message;
  const base = raw.message && raw.message !== "Error" ? raw.message : "";
  const combined = [base, detail].filter(Boolean).join(" — ");
  return combined || fallback;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { orderId, courier_id, auto } = await request.json();
    if (!orderId) throw ApiError.badRequest("orderId is required");

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");
    if (!order.shipmozoOrderId)
      throw ApiError.badRequest("Order not pushed to Shipmozo yet");

    let result;

    if (auto) {
      result = await autoAssignOrder(order.shipmozoOrderId);
      if (result.result !== "1") {
        throw ApiError.badRequest(
          deriveErrorMessage("Auto-assign failed", result),
        );
      }
      order.awbNumber = result.data.awb_number;
      order.trackingNumber = result.data.awb_number;
      order.courierCompany = result.data.courier_company;
    } else {
      if (!courier_id)
        throw ApiError.badRequest("courier_id is required for manual assignment");
      result = await assignCourier(order.shipmozoOrderId, Number(courier_id));
      if (result.result !== "1") {
        throw ApiError.badRequest(
          deriveErrorMessage("Courier assignment failed", result),
        );
      }
      order.courierCompany = result.data.courier;
    }

    order.orderStatus = "processing";
    await order.save();

    return successResponse(result.data, "Courier assigned");
  } catch (err) {
    const e = err as {
      response?: { data?: unknown; status?: number };
      message?: string;
      code?: string;
      cause?: unknown;
    };
    console.error("[Shipmozo assign-courier]", {
      status: e?.response?.status,
      data: e?.response?.data,
      message: e?.message || "(empty)",
      code: e?.code,
      cause: e?.cause,
    });
    const apiErr = ApiError.from(err);
    return errorResponse(apiErr.message, apiErr.statusCode);
  }
}
