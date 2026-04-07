import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkPincodeServiceability } from "@/services/shipmozo";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const { pickup_pincode, delivery_pincode } = await request.json();

    if (!pickup_pincode || !delivery_pincode) {
      throw ApiError.badRequest("pickup_pincode and delivery_pincode are required");
    }

    const result = await checkPincodeServiceability(
      Number(pickup_pincode),
      Number(delivery_pincode),
    );

    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Serviceability check failed");
    }

    return successResponse(result.data);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
