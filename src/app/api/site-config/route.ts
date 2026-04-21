import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import SiteConfig from "@/modules/settings/site-config.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const key = searchParams.get("key")?.trim().toLowerCase();

    if (!key) {
      throw ApiError.badRequest("Missing 'key' query parameter");
    }

    const config = await SiteConfig.findOne({ key }).lean();
    if (!config) {
      return successResponse({ key, value: null }, "No configuration found");
    }

    if (key === "contact" && config.value && typeof config.value === "object") {
      const v = config.value as Record<string, unknown>;
      if (v.social && !v.socialLinks) {
        (config as { value: Record<string, unknown> }).value = {
          ...v,
          socialLinks: v.social,
        };
      }
    }

    return successResponse(config);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
