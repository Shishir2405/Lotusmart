

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import { forgotPassword } from "@/modules/auth/auth.service";
import { sendPasswordResetEmail } from "@/services/email";
import { forgotPasswordSchema } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      throw ApiError.validationError(fieldErrors);
    }

    
    const result = await forgotPassword(parsed.data.email);

    if (result) {
      sendPasswordResetEmail(result.userEmail, result.userName, result.resetToken).catch((err) => {
        console.error("[auth/forgot-password] reset email failed", err instanceof Error ? err.message : err);
      });
    }

    return successResponse(
      null,
      "If an account with that email exists, a password reset link has been sent.",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
