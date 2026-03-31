import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { verifyRazorpayPayment } from "@/services/razorpay";
import Order from "@/modules/orders/order.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw ApiError.badRequest("Missing Razorpay payment fields");
    }

    const isValid = verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
    if (!isValid) throw ApiError.badRequest("Payment verification failed — invalid signature");

    
    if (internalOrderId) {
      const order = await Order.findById(internalOrderId);
      if (order && order.user.toString() === authUser.userId) {
        order.paymentStatus = "paid";
        order.orderStatus = "confirmed";
        order.razorpayOrderId = razorpay_order_id;
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();
      }
    }

    return successResponse({ verified: true }, "Payment verified successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
