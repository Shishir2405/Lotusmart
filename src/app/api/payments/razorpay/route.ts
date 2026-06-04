import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createRazorpayOrder } from "@/services/razorpay";
import Order from "@/modules/orders/order.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { internalOrderId } = await request.json();

    if (!internalOrderId) throw ApiError.badRequest("internalOrderId is required");

    // Charge the server-computed order total — NEVER trust a client-sent amount,
    // otherwise a tampered client could pay any amount for the order.
    const order = await Order.findById(internalOrderId);
    if (!order || order.user.toString() !== authUser.userId)
      throw ApiError.notFound("Order not found");
    if (order.paymentStatus === "paid") throw ApiError.badRequest("Order is already paid");

    const amount = order.total;
    if (!amount || amount <= 0) throw ApiError.badRequest("Invalid order amount");

    const rzOrder = await createRazorpayOrder(amount, `rcpt_${internalOrderId}`, {
      userId: authUser.userId,
      internalOrderId,
    });

    return successResponse({
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    // Razorpay SDK rejects with { statusCode, error: { description, code, ... } }.
    console.error("[payments/razorpay] createOrder failed", err);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
