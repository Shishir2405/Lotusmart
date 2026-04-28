import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getReturnReasons } from "@/services/shipmozo";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const result = await getReturnReasons();
    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Failed to load return reasons");
    }
    return successResponse(result.data);
  } catch (err) {
    console.error("[Shipmozo return-reasons]", (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
