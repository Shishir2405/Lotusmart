import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const { items } = body as {
      items: { id: string; parent: string | null; sortOrder: number }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest("Items array is required");
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { parent: item.parent ?? null, sortOrder: item.sortOrder } },
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Category.bulkWrite(bulkOps as any);

    return successResponse(null, "Categories reordered");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
