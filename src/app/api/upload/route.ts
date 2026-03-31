import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadFile, type UploadTarget } from "@/services/r2";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; 
const VALID_TARGETS: UploadTarget[] = ["products", "banners", "categories", "profiles"];

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file");
    const target = (formData.get("target") as UploadTarget) ?? "products";

    if (!file || !(file instanceof Blob)) {
      throw ApiError.badRequest("No file provided");
    }

    if (!VALID_TARGETS.includes(target)) {
      throw ApiError.badRequest(`Invalid target. Must be one of: ${VALID_TARGETS.join(", ")}`);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw ApiError.badRequest("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, AVIF");
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw ApiError.badRequest("File too large. Maximum size is 5 MB");
    }

    const originalName =
      (file as File).name ?? `upload.${file.type.split("/")[1] ?? "jpg"}`;

    const result = await uploadFile(target, file, originalName, file.type);

    return successResponse(
      { url: result.url, key: result.key, bucket: result.bucket },
      "File uploaded successfully",
      201,
    );
  } catch (err) {
    const apiErr = ApiError.from(err);
    return errorResponse(apiErr.message, apiErr.statusCode);
  }
}
