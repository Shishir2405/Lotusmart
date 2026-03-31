import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import AdminRole, { ADMIN_PERMISSIONS } from "@/modules/roles/admin-role.model";
import type { ITokenPayload, AdminPermission } from "@/types";

function hasPermission(user: ITokenPayload, permission: AdminPermission): boolean {
  if (!user.permissions) return true; 
  return user.permissions.includes(permission);
}

type RouteContext = { params: Promise<{ id: string }> };


export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const user = await requireAdmin(request);

    if (!hasPermission(user, "roles")) {
      throw ApiError.forbidden("You do not have permission to manage roles.");
    }

    const { id } = await context.params;
    const role = await AdminRole.findById(id).lean();
    if (!role) {
      throw ApiError.notFound("Admin role not found.");
    }

    return successResponse(role);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}


export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const user = await requireAdmin(request);

    if (!hasPermission(user, "roles")) {
      throw ApiError.forbidden("You do not have permission to manage roles.");
    }

    const { id } = await context.params;
    const role = await AdminRole.findById(id);
    if (!role) {
      throw ApiError.notFound("Admin role not found.");
    }

    if (role.isSystem) {
      throw ApiError.forbidden("System roles cannot be modified.");
    }

    const body = await request.json();

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        throw ApiError.badRequest("Role name cannot be empty.");
      }
      role.name = body.name.trim();
    }

    if (body.description !== undefined) {
      role.description = body.description?.trim() || undefined;
    }

    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
        throw ApiError.badRequest("At least one permission is required.");
      }
      const invalidPerms = body.permissions.filter(
        (p: string) => !ADMIN_PERMISSIONS.includes(p as any)
      );
      if (invalidPerms.length > 0) {
        throw ApiError.badRequest(`Invalid permissions: ${invalidPerms.join(", ")}`);
      }
      role.permissions = body.permissions;
    }

    if (body.isDefault !== undefined) {
      role.isDefault = body.isDefault;
    }

    await role.save();

    return successResponse(role, "Admin role updated successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}


export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const user = await requireAdmin(request);

    if (!hasPermission(user, "roles")) {
      throw ApiError.forbidden("You do not have permission to manage roles.");
    }

    const { id } = await context.params;
    const role = await AdminRole.findById(id);
    if (!role) {
      throw ApiError.notFound("Admin role not found.");
    }

    if (role.isSystem) {
      throw ApiError.forbidden("System roles cannot be deleted.");
    }

    await role.deleteOne();

    return successResponse(null, "Admin role deleted successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
