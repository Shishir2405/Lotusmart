import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import User from "@/modules/users/user.model";
import AdminRole from "@/modules/roles/admin-role.model";
import type { ITokenPayload, AdminPermission } from "@/types";

function hasPermission(user: ITokenPayload, permission: AdminPermission): boolean {
  if (user.isSuperAdmin) return true;
  if (!user.permissions) return false; // default-deny
  return user.permissions.includes(permission);
}

type RouteContext = { params: Promise<{ id: string }> };


export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const authUser = await requireAdmin(request);

    if (!hasPermission(authUser, "roles")) {
      throw ApiError.forbidden("You do not have permission to manage roles.");
    }

    const { id } = await context.params;
    const body = await request.json();

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    if (user.role !== "admin") {
      throw ApiError.badRequest("Admin roles can only be assigned to admin users.");
    }

    
    const superAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (user.email === superAdminEmail) {
      throw ApiError.forbidden("Cannot modify the super admin's role assignment.");
    }

    // The UI sends `roleId`; accept `adminRole` too for backward compatibility.
    const roleId = body.roleId ?? body.adminRole;

    if (!roleId) {
      // null / undefined / "" → unassign the role
      user.adminRole = undefined;
    } else {
      const role = await AdminRole.findById(roleId);
      if (!role) {
        throw ApiError.notFound("Admin role not found.");
      }
      user.adminRole = role._id;
    }

    await user.save();

    const updatedUser = await User.findById(id).populate("adminRole");

    return successResponse(updatedUser, "User admin role updated successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
