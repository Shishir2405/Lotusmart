import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { pushOrderToShipmozo } from "@/services/shipmozo-push";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { orderId } = await request.json();
    if (!orderId) throw ApiError.badRequest("orderId is required");

    const outcome = await pushOrderToShipmozo(orderId);

    if (outcome.status === "skipped") {
      throw ApiError.badRequest(`Cannot push: ${outcome.reason}`);
    }

    return successResponse(
      { order_id: outcome.orderId, reference_id: outcome.referenceId },
      "Order pushed to Shipmozo",
    );
  } catch (err) {
    console.error("[Shipmozo push-order]", (err as { response?: { data?: unknown } })?.response?.data ?? (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
