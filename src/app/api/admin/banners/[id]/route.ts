import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Banner from "@/modules/auth/banner.model";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const banner = await Banner.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!banner) throw ApiError.notFound("Banner not found");

    revalidatePath("/");
    return successResponse(banner, "Banner updated");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) throw ApiError.notFound("Banner not found");

    revalidatePath("/");
    return successResponse(null, "Banner deleted");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
