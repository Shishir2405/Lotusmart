import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { trackOrder } from "@/services/shipmozo";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const awb = searchParams.get("awb");
    if (!awb) throw ApiError.badRequest("awb query parameter is required");

    const data = await trackOrder(awb);

    if (data.result !== "1") {
      throw ApiError.badRequest(data.message || "Tracking failed");
    }

    return successResponse(data.data);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
