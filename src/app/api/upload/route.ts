import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadFile, type UploadTarget, type UploadKind } from "@/services/cloudinary";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const runtime = "nodejs";
export const maxDuration = 60;

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
];
const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/x-matroska",
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

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

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", avif: "image/avif", heic: "image/heic", heif: "image/heif",
  mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  ogg: "video/ogg", mkv: "video/x-matroska",
};

function inferTypeFromName(name: string): string {
  const ext = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  return EXT_TYPES[ext] ?? "";
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file");
    const rawTarget = (formData.get("target") as string) ?? "products";
    const target = TARGET_ALIASES[rawTarget];
    const rawKind = (formData.get("kind") as string) ?? "";

    if (!file || !(file instanceof Blob)) {
      throw ApiError.badRequest("No file provided");
    }

    if (!target || !VALID_TARGETS.includes(target)) {
      throw ApiError.badRequest(`Invalid target. Must be one of: ${VALID_TARGETS.join(", ")}`);
    }

    const originalName =
      (file as File).name ?? `upload.${file.type.split("/")[1] ?? "bin"}`;
    // Browsers occasionally send an empty MIME type (notably HEIC/HEIF); fall
    // back to the file extension so we don't reject an otherwise valid upload.
    const fileType = file.type || inferTypeFromName(originalName);

    const kind: UploadKind =
      rawKind === "video" || (!rawKind && fileType.startsWith("video/"))
        ? "video"
        : "image";

    if (kind === "image") {
      if (!IMAGE_TYPES.includes(fileType)) {
        throw ApiError.badRequest("Invalid image type. Allowed: JPEG, PNG, WebP, GIF, AVIF, HEIC");
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw ApiError.badRequest("Image too large. Max 10 MB");
      }
    } else {
      if (!VIDEO_TYPES.includes(fileType)) {
        throw ApiError.badRequest("Invalid video type. Allowed: MP4, WebM, MOV, OGG, MKV");
      }
      if (file.size > MAX_VIDEO_BYTES) {
        throw ApiError.badRequest("Video too large. Max 150 MB");
      }
    }

    const result = await uploadFile(target, file, originalName, fileType, kind);

    return successResponse(
      { url: result.url, key: result.key, kind },
      "File uploaded successfully",
      201,
    );
  } catch (err) {
    const apiErr = ApiError.from(err);
    return errorResponse(apiErr.message, apiErr.statusCode);
  }
}
