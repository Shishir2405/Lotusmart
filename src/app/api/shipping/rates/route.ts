import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateRates } from "@/services/shipmozo";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const {
      pickup_pincode,
      delivery_pincode,
      weight,
      payment_type,
      order_amount,
      length,
      width,
      height,
    } = body;

    if (!pickup_pincode || !delivery_pincode || !weight) {
      throw ApiError.badRequest("pickup_pincode, delivery_pincode, and weight are required");
    }

    const rates = await calculateRates({
      pickup_pincode: Number(pickup_pincode),
      delivery_pincode: Number(delivery_pincode),
      payment_type: payment_type || "PREPAID",
      shipment_type: "FORWARD",
      order_amount: Number(order_amount || 0),
      type_of_package: "SPS",
      rov_type: "ROV_OWNER",
      weight: Number(weight),
      dimensions: [
        {
          no_of_box: "1",
          length: String(length || 10),
          width: String(width || 10),
          height: String(height || 10),
        },
      ],
    });

    return successResponse(rates);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
