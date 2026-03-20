/**
 * GET  /api/auth/addresses — list user's addresses
 * POST /api/auth/addresses — add a new address
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import User from "@/modules/users/user.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const user = await User.findById(authUser.userId).select("addresses").lean();
    if (!user) throw ApiError.notFound("User not found");
    return successResponse(user.addresses ?? []);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const body = await request.json();

    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, label, isDefault } = body;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      throw ApiError.badRequest("Required fields: fullName, phone, addressLine1, city, state, pincode");
    }

    const user = await User.findById(authUser.userId);
    if (!user) throw ApiError.notFound("User not found");

    // If new address is default, unset others
    if (isDefault) {
      user.addresses.forEach((a: { isDefault: boolean }) => { a.isDefault = false; });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user.addresses as any[]).push({ fullName, phone, addressLine1, addressLine2, city, state, pincode, label: label ?? "home", isDefault: isDefault ?? user.addresses.length === 0 });
    await user.save();

    return successResponse(user.addresses, "Address added", 201);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
