

import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import LandingSection from "@/modules/landing/landing-section.model";

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { order } = (await request.json()) as {
      order: { id: string; sortOrder: number }[];
    };

    if (!Array.isArray(order) || order.length === 0) {
      throw ApiError.badRequest("Order array is required");
    }

    const ops = order.map(({ id, sortOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { sortOrder },
      },
    }));

    await LandingSection.bulkWrite(ops);

    const sections = await LandingSection.find()
      .sort({ sortOrder: 1 })
      .populate("products", "name slug images price compareAtPrice")
      .populate("categories", "name slug image")
      .lean();

    return successResponse(sections, "Order updated");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
