import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, createdResponse } from "@/lib/api-response";
import AdminRole, { ADMIN_PERMISSIONS } from "@/modules/roles/admin-role.model";
import type { ITokenPayload, AdminPermission } from "@/types";

function hasPermission(user: ITokenPayload, permission: AdminPermission): boolean {
  if (!user.permissions) return true; 
  return user.permissions.includes(permission);
}


export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin(request);

    if (!hasPermission(user, "roles")) {
      throw ApiError.forbidden("You do not have permission to manage roles.");
    }

    const roles = await AdminRole.find().sort({ name: 1 }).lean();
    return successResponse({ roles, availablePermissions: ADMIN_PERMISSIONS });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}


export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin(request);

    if (!hasPermission(user, "roles")) {
      throw ApiError.forbidden("You do not have permission to manage roles.");
    }

    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      throw ApiError.badRequest("Role name is required.");
    }

    if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
      throw ApiError.badRequest("At least one permission is required.");
    }

    
    const invalidPerms = body.permissions.filter(
      (p: string) => !ADMIN_PERMISSIONS.includes(p as any)
    );
    if (invalidPerms.length > 0) {
      throw ApiError.badRequest(`Invalid permissions: ${invalidPerms.join(", ")}`);
    }

    const role = await AdminRole.create({
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      permissions: body.permissions,
      isDefault: body.isDefault ?? false,
      isSystem: false,
      createdBy: user.userId,
    });

    return createdResponse(role, "Admin role created successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
