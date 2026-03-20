/**
 * PATCH  /api/auth/addresses/[id] — update an address
 * DELETE /api/auth/addresses/[id] — remove an address
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import User from "@/modules/users/user.model";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const user = await User.findById(authUser.userId);
    if (!user) throw ApiError.notFound("User not found");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = (user.addresses as any[]).find((a: { _id: { toString(): string } }) => a._id.toString() === id);
    if (!address) throw ApiError.notFound("Address not found");

    if (body.isDefault) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user.addresses as any[]).forEach((a: { isDefault: boolean }) => { a.isDefault = false; });
    }

    Object.assign(address, body);
    await user.save();

    return successResponse(user.addresses, "Address updated");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { id } = await params;

    const user = await User.findById(authUser.userId);
    if (!user) throw ApiError.notFound("User not found");

    const before = user.addresses.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user.addresses = (user.addresses as any[]).filter((a: { _id: { toString(): string } }) => a._id.toString() !== id) as typeof user.addresses;
    if (user.addresses.length === before) throw ApiError.notFound("Address not found");

    // Make sure there's always a default if addresses remain
    if (user.addresses.length > 0 && !user.addresses.some((a: { isDefault: boolean }) => a.isDefault)) {
      (user.addresses[0] as { isDefault: boolean }).isDefault = true;
    }

    await user.save();
    return successResponse(user.addresses, "Address removed");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
