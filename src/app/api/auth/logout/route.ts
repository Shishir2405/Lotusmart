

import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    const response = successResponse(null, "Logged out successfully");
    clearAuthCookie(response);
    return response;
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
