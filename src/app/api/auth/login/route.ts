

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { setAuthCookie } from "@/lib/auth";
import connectDB from "@/lib/db";
import { login } from "@/modules/auth/auth.service";
import { loginSchema } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      throw ApiError.validationError(fieldErrors);
    }

    
    const { user, token } = await login(parsed.data.email, parsed.data.password);

    
    const response = successResponse(
      { user, token },
      "Logged in successfully",
    );
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
