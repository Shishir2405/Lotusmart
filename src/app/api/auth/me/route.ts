

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { clearAuthCookie, requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { deleteAccount, getProfile, updateProfile, isSuperAdminEmail } from "@/modules/auth/auth.service";
import User from "@/modules/users/user.model";
import AdminRole from "@/modules/roles/admin-role.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await requireAuth(request);
    const user = await getProfile(authUser.userId);

    
    const isSuperAdmin =
      (user as { isSuperAdmin?: boolean }).isSuperAdmin === true ||
      isSuperAdminEmail(authUser.email);
    let permissions: string[] | undefined;
    if (authUser.role === "admin") {
      const populated = await User.findById(authUser.userId).populate({ path: "adminRole", model: AdminRole });
      if (populated?.adminRole && typeof populated.adminRole === "object" && "permissions" in populated.adminRole) {
        permissions = (populated.adminRole as unknown as Record<string, unknown>).permissions as string[];
      }
      if (isSuperAdmin) {
        permissions = undefined;
      }
    }

    return successResponse(
      { user: { ...user, permissions, isSuperAdmin } },
      "Profile retrieved successfully",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await requireAuth(request);
    const body = await request.json();

    const user = await updateProfile(authUser.userId, {
      name: body.name,
      phone: body.phone,
      avatar: body.avatar,
    });

    return successResponse(user, "Profile updated successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await requireAuth(request);

    let reason: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.reason === "string") reason = body.reason.trim();
    } catch {
      // Empty body is allowed.
    }

    await deleteAccount(authUser.userId, reason);

    const response = successResponse(null, "Account deleted");
    clearAuthCookie(response);
    return response;
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
