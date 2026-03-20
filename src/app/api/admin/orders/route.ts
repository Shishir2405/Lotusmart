// GET /api/admin/orders — list ALL orders (admin only)

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { errorResponse, paginatedResponse, buildPagination } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const paymentStatus = searchParams.get("paymentStatus");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email phone")
        .lean(),
      Order.countDocuments(query),
    ]);

    return paginatedResponse(orders, buildPagination(page, limit, total));
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
