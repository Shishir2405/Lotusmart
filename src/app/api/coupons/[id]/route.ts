// PATCH  /api/coupons/[id] — update coupon (admin)
// DELETE /api/coupons/[id] — delete coupon (admin)

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Coupon from "@/modules/coupons/coupon.model";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    delete body.code; // code is immutable after creation
    delete body.usedCount;

    const coupon = await Coupon.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!coupon) throw ApiError.notFound("Coupon not found");

    return successResponse(coupon, "Coupon updated");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw ApiError.notFound("Coupon not found");

    return successResponse(null, "Coupon deleted");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
