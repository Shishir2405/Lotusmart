

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import { verifyEmail } from "@/modules/auth/auth.service";
import { sendWelcomeEmail } from "@/services/email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      throw ApiError.badRequest("Verification token is required");
    }

    const user = await verifyEmail(token);

    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error("[auth/verify-email] welcome email failed", err instanceof Error ? err.message : err);
    });

    return successResponse({ user }, "Email verified successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
