import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getOrderLabel } from "@/services/shipmozo";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb");

    if (!awb) throw ApiError.badRequest("awb query parameter is required");

    const result = await getOrderLabel(awb);

    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Failed to get label");
    }

    return successResponse(result.data);
  } catch (err) {
    console.error("[Shipmozo label]", (err as any)?.response?.data ?? (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
