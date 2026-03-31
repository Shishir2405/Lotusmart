

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

    
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      throw ApiError.validationError(fieldErrors);
    }

    
    const { user, token } = await register(parsed.data);

    
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
