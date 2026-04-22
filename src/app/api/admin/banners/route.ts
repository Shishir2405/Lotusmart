import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import { requireAdmin, getAuthUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Banner from "@/modules/auth/banner.model";


export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const position = searchParams.get("position");

    const query: Record<string, unknown> = {};
    const authUser = await getAuthUser(request);

    
    if (!authUser || authUser.role !== "admin") query.isActive = true;
    if (position) query.position = position;

    const banners = await Banner.find(query).sort({ sortOrder: 1 }).lean();
    return successResponse(banners);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const banner = await Banner.create(body);
    revalidatePath("/");
    return successResponse(banner, "Banner created", 201);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
