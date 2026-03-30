// GET /api/site-config/[key] — Public: get site config by key

import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import SiteConfig from "@/modules/settings/site-config.model";

type Params = { params: Promise<{ key: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { key } = await params;
    const config = await SiteConfig.findOne({ key }).lean();
    if (!config) {
      return successResponse({ key, value: null }, "No configuration found");
    }
    return successResponse(config);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
