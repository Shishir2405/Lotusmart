// GET /api/auth/me — Return the currently authenticated user's profile

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { getProfile } from "@/modules/auth/auth.service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await requireAuth(request);
    const user = await getProfile(authUser.userId);

    return successResponse({ user }, "Profile retrieved successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
