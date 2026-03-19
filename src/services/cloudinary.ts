// Cloudinary image upload & management service for LotusMart

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ──────────────────────────────────────────────
// Folder constants (from env with sensible defaults)
// ──────────────────────────────────────────────

const CLOUDINARY_PRODUCT_FOLDER =
  process.env.CLOUDINARY_PRODUCT_FOLDER ?? "lotusmart/products";
const CLOUDINARY_PROFILE_FOLDER =
  process.env.CLOUDINARY_PROFILE_FOLDER ?? "lotusmart/profiles";
const CLOUDINARY_BANNER_FOLDER =
  process.env.CLOUDINARY_BANNER_FOLDER ?? "lotusmart/banners";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  transformation?: Record<string, unknown>;
  overwrite?: boolean;
  unique_filename?: boolean;
  resource_type?: "image" | "video" | "raw" | "auto";
}

// ──────────────────────────────────────────────
// Core helpers
// ──────────────────────────────────────────────

/**
 * Upload an image to Cloudinary.
 *
 * @param file - Base64 data URI string, remote URL, or file path on disk.
 * @param folder - The Cloudinary folder to place the asset in.
 * @param options - Additional Cloudinary upload options.
 * @returns The secure URL and public_id of the uploaded asset.
 */
export async function uploadImage(
  file: string | Buffer,
  folder: string,
  options?: CloudinaryUploadOptions,
): Promise<CloudinaryUploadResult> {
  try {
    // If a Buffer is provided, convert it to a base64 data URI
    const uploadSource =
      file instanceof Buffer
        ? `data:image/webp;base64,${file.toString("base64")}`
        : file;

    const result: UploadApiResponse = await cloudinary.uploader.upload(
      uploadSource,
      {
        folder,
        overwrite: options?.overwrite ?? false,
        unique_filename: options?.unique_filename ?? true,
        resource_type: options?.resource_type ?? "image",
        ...(options?.transformation
          ? { transformation: options.transformation }
          : {}),
      },
    );

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    const cloudinaryError = error as UploadApiErrorResponse;
    console.error("[Cloudinary] Upload failed:", cloudinaryError.message);
    throw new Error(
      `Cloudinary upload failed: ${cloudinaryError.message ?? "Unknown error"}`,
    );
  }
}

/**
 * Delete an image from Cloudinary by its public_id.
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      console.warn(
        `[Cloudinary] Delete returned non-ok result for ${publicId}:`,
        result.result,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Cloudinary] Delete failed:", error);
    throw new Error(
      `Cloudinary delete failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// ──────────────────────────────────────────────
// Convenience upload functions
// ──────────────────────────────────────────────

/**
 * Upload a product image to the products folder.
 */
export async function uploadProductImage(
  file: string | Buffer,
  options?: CloudinaryUploadOptions,
): Promise<CloudinaryUploadResult> {
  return uploadImage(file, CLOUDINARY_PRODUCT_FOLDER, options);
}

/**
 * Upload a user profile/avatar image to the profiles folder.
 */
export async function uploadProfileImage(
  file: string | Buffer,
  options?: CloudinaryUploadOptions,
): Promise<CloudinaryUploadResult> {
  return uploadImage(file, CLOUDINARY_PROFILE_FOLDER, {
    ...options,
    transformation: options?.transformation ?? {
      width: 400,
      height: 400,
      crop: "fill",
      gravity: "face",
    },
  });
}

/**
 * Upload a banner image to the banners folder.
 */
export async function uploadBannerImage(
  file: string | Buffer,
  options?: CloudinaryUploadOptions,
): Promise<CloudinaryUploadResult> {
  return uploadImage(file, CLOUDINARY_BANNER_FOLDER, options);
}

// ──────────────────────────────────────────────
// URL generation
// ──────────────────────────────────────────────

/**
 * Generate an optimised/transformed Cloudinary URL for a given public_id.
 *
 * @param publicId - The Cloudinary public_id of the asset.
 * @param width    - Desired width in pixels.
 * @param height   - Desired height in pixels.
 * @param quality  - Quality level (1–100 or "auto"). Defaults to "auto".
 * @returns The transformed image URL.
 */
export function getOptimizedUrl(
  publicId: string,
  width?: number,
  height?: number,
  quality: number | "auto" = "auto",
): string {
  const transformations: Record<string, unknown> = {
    fetch_format: "auto",
    quality,
  };

  if (width) transformations.width = width;
  if (height) transformations.height = height;
  if (width || height) transformations.crop = "fill";

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [transformations],
  });
}

export { cloudinary };
