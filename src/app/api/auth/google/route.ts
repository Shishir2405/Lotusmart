import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { setAuthCookie } from "@/lib/auth";
import connectDB from "@/lib/db";
import { upsertGoogleUser } from "@/modules/auth/auth.service";
import { verifyGoogleIdToken } from "@/services/google-auth";
import { googleAuthSchema } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const parsed = googleAuthSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.validationError(parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    let profile;
    try {
      profile = await verifyGoogleIdToken(parsed.data.idToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid Google token";
      throw ApiError.unauthorized(`Google sign-in failed: ${msg}`);
    }

    const { user, token, isNew } = await upsertGoogleUser(profile);

    const response = successResponse(
      { user, token, isNew, profileComplete: user.profileComplete },
      isNew ? "Account created with Google" : "Signed in with Google",
    );
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
