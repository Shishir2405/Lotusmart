// POST /api/coupons/validate
// Validates a coupon code and returns the discount amount.
// Body: { code, orderTotal, categoryIds?, productIds? }

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Coupon from "@/modules/coupons/coupon.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAuth(request);

    const body = await request.json();
    const { code, orderTotal } = body;

    if (!code?.trim()) throw ApiError.badRequest("Coupon code is required");
    if (!orderTotal || orderTotal <= 0) throw ApiError.badRequest("orderTotal is required");

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();

    if (!coupon) throw ApiError.notFound("Invalid coupon code");
    if (!coupon.isActive) throw ApiError.badRequest("This coupon is no longer active");

    const now = new Date();
    if (now < coupon.validFrom) throw ApiError.badRequest("This coupon is not yet valid");
    if (now > coupon.validUntil) throw ApiError.badRequest("This coupon has expired");

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw ApiError.badRequest("This coupon has reached its usage limit");
    }

    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      throw ApiError.badRequest(
        `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`
      );
    }

    // Calculate discount
    let discount =
      coupon.discountType === "percentage"
        ? (orderTotal * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }

    discount = Math.min(discount, orderTotal); // never exceed total

    return successResponse(
      {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: Math.round(discount * 100) / 100,
        finalTotal: Math.round((orderTotal - discount) * 100) / 100,
        description: coupon.description,
      },
      "Coupon applied successfully"
    );
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
