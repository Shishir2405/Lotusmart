

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import LandingSection from "@/modules/landing/landing-section.model";

export const revalidate = 60; 

export async function GET() {
  try {
    await connectDB();

    const sections = await LandingSection.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .populate("products", "name slug images price compareAtPrice stock isFeatured ratings unit weight")
      .populate("categories", "name slug image description")
      .lean();

    return successResponse(sections);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
