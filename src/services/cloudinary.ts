import { v2 as cloudinary } from "cloudinary";

function ensureConfigured() {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

export type UploadTarget = "products" | "banners" | "categories" | "profiles" | "blog";
export type UploadKind = "image" | "video";

export interface UploadResult {
  key: string;
  url: string;
}

const FOLDER_MAP: Record<UploadTarget, string> = {
  products: "lotusmart/products",
  banners: "lotusmart/banners",
  categories: "lotusmart/categories",
  profiles: "lotusmart/avatars",
  blog: "lotusmart/blog",
};

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  resourceType: UploadKind;
  /** Every param that was signed — must be posted to Cloudinary verbatim. */
  params: Record<string, string>;
  signature: string;
}

/**
 * Produce a short-lived signature so the BROWSER can upload straight to
 * Cloudinary instead of streaming the file through our own API route.
 *
 * This exists because Vercel caps a serverless function's request body at
 * 4.5 MB — a platform limit no config can raise — so any video worth posting
 * as a reel died with a 413 before /api/upload ever ran. Going direct removes
 * our server from the file path entirely, so only Cloudinary's own limits
 * apply.
 *
 * The signed params mirror what uploadFile() sends server-side, so assets land
 * in the same folders with the same derivatives either way.
 */
export function signUpload(
  target: UploadTarget,
  kind: UploadKind,
  originalName: string,
): UploadSignature {
  ensureConfigured();
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured");
  }

  const params: Record<string, string> = {
    folder: FOLDER_MAP[target],
    // unique_filename only applies when public_id is omitted, so we make the
    // id unique ourselves — otherwise overwrite:false would silently hand back
    // a previously uploaded asset with the same filename.
    public_id: `${sanitizeName(originalName)}-${uniqueSuffix()}`,
    timestamp: String(Math.round(Date.now() / 1000)),
    overwrite: "false",
    ...(kind === "video"
      ? {
          // Same background H.264/MP4 derivative uploadFile() requests, written
          // in the REST API's string form: "<transformation>/<format>".
          eager: "q_auto,vc_h264/mp4",
          eager_async: "true",
        }
      : { format: "webp" }),
  };

  return {
    cloudName: cloud_name,
    apiKey: api_key,
    resourceType: kind,
    params,
    signature: cloudinary.utils.api_sign_request(params, api_secret),
  };
}

function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function uploadFile(
  target: UploadTarget,
  file: Buffer | Blob,
  originalName: string,
  _contentType: string,
  kind: UploadKind = "image",
): Promise<UploadResult> {
  ensureConfigured();

  const buffer =
    file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

  const folder = FOLDER_MAP[target];

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: kind,
          public_id: sanitizeName(originalName),
          overwrite: false,
          unique_filename: true,
          ...(kind === "video"
            ? {
                // Generate an optimized H.264/MP4 derivative in the BACKGROUND
                // (eager_async) so the upload response returns as soon as the
                // original is stored, instead of blocking on a second transcode
                // against the 60s function limit. We return the original
                // secure_url, which is immediately playable.
                eager: [
                  { quality: "auto", format: "mp4", video_codec: "h264" },
                ],
                eager_async: true,
              }
            : {
                // Transcode every image to WebP so formats the browser can't
                // pre-process (e.g. HEIC/HEIF from iPhones) still end up as a
                // web-friendly, displayable file.
                format: "webp",
              }),
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result);
        },
      );
      stream.end(buffer);
    },
  );

  return {
    key: result.public_id,
    url: result.secure_url,
  };
}

// The poster helper is a pure string transform shared with client components,
// so it lives in utils/helpers. Re-exported here for existing server callers.
export { videoPosterUrl } from "@/utils/helpers";

export async function deleteImage(publicId: string, kind: UploadKind = "image"): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: kind });
}

function sanitizeName(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
