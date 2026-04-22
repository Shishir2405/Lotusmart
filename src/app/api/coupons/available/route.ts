import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Coupon from "@/modules/coupons/coupon.model";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })
      .sort({ minOrderValue: 1, createdAt: -1 })
      .select(
        "code description discountType discountValue minOrderValue maxDiscountAmount validUntil usageLimit usedCount",
      )
      .lean();

    const filtered = coupons.filter(
      (c) => !c.usageLimit || (c.usedCount ?? 0) < c.usageLimit,
    );

    return successResponse(filtered);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
