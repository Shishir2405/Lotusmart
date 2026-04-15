

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { createdResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import { register } from "@/modules/auth/auth.service";
import { sendVerificationEmail } from "@/services/email";
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

    
    const { user, verificationToken } = await register(parsed.data);

    sendVerificationEmail(user.email, user.name, verificationToken).catch(() => null);

    return createdResponse(
      { user },
      "Registration successful. Please check your email to verify your account.",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
