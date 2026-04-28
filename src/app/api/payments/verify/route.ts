import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { verifyRazorpayPayment } from "@/services/razorpay";
import { pushOrderToShipmozo, type PushOutcome } from "@/services/shipmozo-push";
import Order from "@/modules/orders/order.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } = body;

    console.log("[verify] incoming", {
      hasOrderId: !!razorpay_order_id,
      hasPaymentId: !!razorpay_payment_id,
      hasSignature: !!razorpay_signature,
      internalOrderId,
      userId: authUser.userId,
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw ApiError.badRequest("Missing Razorpay payment fields");
    }

    const isValid = verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
    console.log("[verify] signature valid?", isValid);
    if (!isValid) throw ApiError.badRequest("Payment verification failed — invalid signature");

    let pushResult: PushOutcome | { status: "failed"; reason: string } | null = null;

    if (internalOrderId) {
      const order = await Order.findById(internalOrderId);
      if (!order) {
        console.warn("[verify] order not found", internalOrderId);
      } else if (order.user.toString() !== authUser.userId) {
        console.warn("[verify] order user mismatch", {
          orderUser: order.user.toString(),
          authUser: authUser.userId,
        });
      } else {
        order.paymentStatus = "paid";
        order.orderStatus = "confirmed";
        order.razorpayOrderId = razorpay_order_id;
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();
        console.log("[verify] order saved as paid", {
          orderNumber: order.orderNumber,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
        });

        // IMPORTANT: await the Shipmozo push. Fire-and-forget does NOT
        // survive Netlify/Vercel serverless — the function freezes the
        // moment the response is returned and the promise is dropped.
        // We swallow errors here so a Shipmozo failure cannot undo the
        // verified payment — admin can retry from /admin/orders/[id].
        try {
          console.log("[verify→shipmozo] pushing", order.orderNumber);
          const outcome = await pushOrderToShipmozo(order._id.toString());
          console.log("[verify→shipmozo] outcome", order.orderNumber, outcome);
          pushResult = outcome;
        } catch (err: unknown) {
          const detail =
            (err as { response?: { data?: unknown } })?.response?.data ??
            (err as Error)?.message ??
            String(err);
          console.error("[verify→shipmozo] push failed for", order.orderNumber, detail);
          pushResult = { status: "failed", reason: typeof detail === "string" ? detail : "push failed" };
        }
      }
    }

    return successResponse({ verified: true, shipmozo: pushResult }, "Payment verified successfully");
  } catch (err) {
    console.error("[verify] error", (err as Error)?.message ?? err);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
