

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import SiteConfig from "@/modules/settings/site-config.model";

const KEY_TO_PATHS: Record<string, string[]> = {
  faq: ["/faqs"],
  contact: ["/contact"],
  terms: ["/terms"],
  privacy: ["/privacy-policy"],
  refund: ["/refund-policy", "/returns"],
  shipping: ["/shipping-policy"],
  about: ["/about"],
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();
    const configs = await SiteConfig.find().sort({ key: 1 }).lean();
    return successResponse(configs);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    await connectDB();
    const { key, value } = await request.json();

    if (!key || !value) {
      throw ApiError.badRequest("Key and value are required");
    }

    const normalizedKey = key.toLowerCase().trim();
    const config = await SiteConfig.findOneAndUpdate(
      { key: normalizedKey },
      { value, updatedBy: admin.userId },
      { upsert: true, new: true, runValidators: true },
    );

    (KEY_TO_PATHS[normalizedKey] ?? []).forEach((p) => revalidatePath(p));

    return successResponse(config, "Configuration saved");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
