// GET /api/admin/site-config/[key] — Get single config
// PUT /api/admin/site-config/[key] — Update config
// DELETE /api/admin/site-config/[key] — Delete config

import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, noContentResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import SiteConfig from "@/modules/settings/site-config.model";

type Params = { params: Promise<{ key: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    await connectDB();
    const { key } = await params;
    const config = await SiteConfig.findOne({ key }).lean();
    if (!config) throw ApiError.notFound("Configuration not found");
    return successResponse(config);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(request);
    await connectDB();
    const { key } = await params;
    const { value } = await request.json();

    if (!value) throw ApiError.badRequest("Value is required");

    const config = await SiteConfig.findOneAndUpdate(
      { key },
      { value, updatedBy: admin.userId },
      { upsert: true, new: true, runValidators: true },
    );

    return successResponse(config, "Configuration updated");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    await connectDB();
    const { key } = await params;
    await SiteConfig.findOneAndDelete({ key });
    return noContentResponse();
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
