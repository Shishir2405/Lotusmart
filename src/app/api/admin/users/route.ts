import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { paginatedResponse, errorResponse } from "@/lib/api-response";
import User from "@/modules/users/user.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return paginatedResponse(users, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
