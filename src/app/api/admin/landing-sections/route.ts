

import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { successResponse, createdResponse, errorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import LandingSection from "@/modules/landing/landing-section.model";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();
    const sections = await LandingSection.find()
      .sort({ sortOrder: 1 })
      .populate("products", "name slug images price compareAtPrice")
      .populate("categories", "name slug image")
      .lean();
    return successResponse(sections);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();
    const body = await request.json();

    
    if (body.sortOrder === undefined) {
      const count = await LandingSection.countDocuments();
      body.sortOrder = count;
    }

    const section = await LandingSection.create(body);
    return createdResponse(section, "Section created");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
