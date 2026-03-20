import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createRazorpayOrder } from "@/services/razorpay";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { amount, internalOrderId } = await request.json();

    if (!amount || amount <= 0) throw ApiError.badRequest("Invalid amount");

    const rzOrder = await createRazorpayOrder(amount, `rcpt_${internalOrderId ?? Date.now()}`, {
      userId: authUser.userId,
      internalOrderId: internalOrderId ?? "",
    });

    return successResponse({
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
