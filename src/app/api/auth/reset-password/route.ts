// POST /api/auth/reset-password — Reset password using a valid token

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import { resetPassword } from "@/modules/auth/auth.service";
import { resetPasswordSchema } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      throw ApiError.validationError(fieldErrors);
    }

    await resetPassword(parsed.data.token, parsed.data.password);

    return successResponse(
      null,
      "Password has been reset successfully. You can now log in with your new password.",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
