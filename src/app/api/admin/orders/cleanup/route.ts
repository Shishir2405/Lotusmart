import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";

const STALE_MINUTES = 60; // ~1h

// Prepaid orders that were never paid sit in paymentStatus:"pending" /
// orderStatus:"placed" forever. They hold NO stock (stock is decremented only at
// payment-verify), so this just closes them out. COD orders are committed at
// creation and a verified order is "paid"/"confirmed", so neither is touched.
async function cancelStalePrepaidPending(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);
  const res = await Order.updateMany(
    {
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      orderStatus: "placed",
      createdAt: { $lt: cutoff },
    },
    {
      $set: {
        orderStatus: "cancelled",
        paymentStatus: "failed",
        cancelledAt: new Date(),
        cancelReason: "Auto-cancelled: prepaid payment not completed",
      },
    },
  );
  return res.modifiedCount ?? 0;
}

// Cron-friendly. Auth via a shared secret (x-cron-secret header, Authorization:
// Bearer, or ?secret=). Set CRON_SECRET in the environment.
export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const auth = request.headers.get("authorization");
    const provided =
      request.headers.get("x-cron-secret") ??
      (auth?.startsWith("Bearer ") ? auth.slice(7) : null) ??
      request.nextUrl.searchParams.get("secret");
    if (!secret || provided !== secret) {
      throw ApiError.unauthorized("Invalid cron secret");
    }
    await connectDB();
    const cancelled = await cancelStalePrepaidPending();
    return successResponse({ cancelled }, `Cancelled ${cancelled} stale prepaid order(s)`);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

// Manual trigger from the admin dashboard.
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const cancelled = await cancelStalePrepaidPending();
    return successResponse({ cancelled }, `Cancelled ${cancelled} stale prepaid order(s)`);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
