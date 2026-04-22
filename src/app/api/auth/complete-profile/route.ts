import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { completeProfile } from "@/modules/auth/auth.service";
import { completeProfileSchema } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const body = await request.json();
    const parsed = completeProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.validationError(parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const user = await completeProfile(authUser.userId, parsed.data);
    return successResponse({ user }, "Profile completed");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
