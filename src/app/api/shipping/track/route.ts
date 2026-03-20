import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { trackShipment, trackByAWB } from "@/services/shiprocket";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const shipmentId = searchParams.get("shipmentId");
    const awb = searchParams.get("awb");

    if (!shipmentId && !awb) throw ApiError.badRequest("shipmentId or awb is required");

    const data = shipmentId
      ? await trackShipment(Number(shipmentId))
      : await trackByAWB(awb!);

    return successResponse(data);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
