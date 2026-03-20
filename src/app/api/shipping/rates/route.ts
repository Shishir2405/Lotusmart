import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getShippingRates } from "@/services/shiprocket";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const { pickup_postcode, delivery_postcode, weight, cod } = await request.json();

    if (!pickup_postcode || !delivery_postcode || !weight) {
      throw ApiError.badRequest("pickup_postcode, delivery_postcode, and weight are required");
    }

    const rates = await getShippingRates({
      pickup_postcode: String(pickup_postcode),
      delivery_postcode: String(delivery_postcode),
      weight: Number(weight),
      cod: cod ? 1 : 0,
    });

    return successResponse(rates);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
