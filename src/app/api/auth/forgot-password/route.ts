// POST /api/auth/forgot-password — Initiate password reset flow

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import { forgotPassword } from "@/modules/auth/auth.service";
import { forgotPasswordSchema } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      throw ApiError.validationError(fieldErrors);
    }

    // Generate reset token (email dispatch would happen here)
    await forgotPassword(parsed.data.email);

    // Always return the same generic message to prevent email enumeration
    return successResponse(
      null,
      "If an account with that email exists, a password reset link has been sent.",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
