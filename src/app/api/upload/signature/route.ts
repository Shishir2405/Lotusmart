import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { signUpload, type UploadTarget, type UploadKind } from "@/services/cloudinary";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const runtime = "nodejs";

const VALID_TARGETS: UploadTarget[] = ["products", "banners", "categories", "profiles", "blog"];

const TARGET_ALIASES: Record<string, UploadTarget> = {
  product: "products",
  banner: "banners",
  category: "categories",
  profile: "profiles",
  blog: "blog",
  products: "products",
  banners: "banners",
  categories: "categories",
  profiles: "profiles",
};

/**
 * Hands the client a signature for a direct browser -> Cloudinary upload.
 * Only the signature crosses our server, never the file, so uploads aren't
 * bound by the 4.5 MB serverless request body limit.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const body = await req.json().catch(() => ({}));
    const target = TARGET_ALIASES[String(body?.target ?? "products")];
    const kind: UploadKind = body?.kind === "video" ? "video" : "image";
    const filename = typeof body?.filename === "string" ? body.filename : "upload";

    if (!target || !VALID_TARGETS.includes(target)) {
      throw ApiError.badRequest(`Invalid target. Must be one of: ${VALID_TARGETS.join(", ")}`);
    }

    return successResponse(signUpload(target, kind, filename), "Upload signature created");
  } catch (err) {
    const apiErr = ApiError.from(err);
    return errorResponse(apiErr.message, apiErr.statusCode);
  }
}
