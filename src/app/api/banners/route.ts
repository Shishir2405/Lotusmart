import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Banner from "@/modules/auth/banner.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const position = request.nextUrl.searchParams.get("position");

    const query: Record<string, unknown> = { isActive: true };
    if (position) query.position = position;

    const banners = await Banner.find(query).sort({ sortOrder: 1 }).lean();
    return successResponse(banners);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
