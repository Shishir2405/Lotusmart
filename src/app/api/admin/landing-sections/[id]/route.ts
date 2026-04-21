

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, noContentResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import LandingSection from "@/modules/landing/landing-section.model";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    await connectDB();
    const { id } = await params;
    const section = await LandingSection.findById(id)
      .populate("products", "name slug images price compareAtPrice")
      .populate("categories", "name slug image");
    if (!section) throw ApiError.notFound("Section not found");
    return successResponse(section);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const section = await LandingSection.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("products", "name slug images price compareAtPrice")
      .populate("categories", "name slug image");
    if (!section) throw ApiError.notFound("Section not found");
    revalidatePath("/");
    return successResponse(section, "Section updated");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    await connectDB();
    const { id } = await params;
    const section = await LandingSection.findByIdAndDelete(id);
    if (!section) throw ApiError.notFound("Section not found");
    revalidatePath("/");
    return noContentResponse();
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
