// GET  /api/coupons        — list all coupons (admin only)
// POST /api/coupons        — create coupon (admin only)

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, createdResponse } from "@/lib/api-response";
import Coupon from "@/modules/coupons/coupon.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return successResponse(coupons);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
      applicableCategories,
      applicableProducts,
    } = body;

    if (!code?.trim()) throw ApiError.badRequest("Coupon code is required");
    if (!["percentage", "fixed"].includes(discountType))
      throw ApiError.badRequest("discountType must be 'percentage' or 'fixed'");
    if (!discountValue || discountValue <= 0)
      throw ApiError.badRequest("discountValue must be > 0");
    if (discountType === "percentage" && discountValue > 100)
      throw ApiError.badRequest("Percentage discount cannot exceed 100");
    if (!validFrom || !validUntil)
      throw ApiError.badRequest("validFrom and validUntil are required");

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) throw ApiError.conflict("Coupon code already exists");

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      isActive: isActive ?? true,
      applicableCategories: applicableCategories ?? [],
      applicableProducts: applicableProducts ?? [],
    });

    return createdResponse(coupon, "Coupon created");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
