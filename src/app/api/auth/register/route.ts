// POST /api/auth/register — Create a new user account

import { NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api-error";
import { createdResponse, errorResponse } from "@/lib/api-response";
import { setAuthCookie } from "@/lib/auth";
import connectDB from "@/lib/db";
import { register } from "@/modules/auth/auth.service";
import { registerSchema } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate request body
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      throw ApiError.validationError(fieldErrors);
    }

    // Register user
    const { user, token } = await register(parsed.data);

    // Build response with auth cookie
    const response = createdResponse(
      { user },
      "Registration successful. Please verify your email.",
    );
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
