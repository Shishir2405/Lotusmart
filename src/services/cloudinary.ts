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

/**
 * Derive a poster image (first frame) from an uploaded Cloudinary VIDEO url,
 * for reels where the admin didn't upload a thumbnail. Cloudinary renders a
 * still from a video by swapping the resource to an image format and pinning
 * the start offset to 0 (the first frame):
 *   .../video/upload/<rest>/name.mp4  ->  .../video/upload/so_0/<rest>/name.jpg
 * Returns null if the url isn't a recognisable Cloudinary video delivery url,
 * so callers can fall back to requiring an explicit thumbnail.
 */
export function videoPosterUrl(videoUrl: string): string | null {
  if (typeof videoUrl !== "string") return null;
  const marker = "/video/upload/";
  const idx = videoUrl.indexOf(marker);
  if (idx === -1) return null;

  const prefix = videoUrl.slice(0, idx + marker.length);
  let rest = videoUrl.slice(idx + marker.length);

  // Swap the file extension (or a bare url with none) to .jpg.
  rest = rest.includes(".")
    ? rest.replace(/\.[^./?]+(\?.*)?$/, ".jpg")
    : `${rest}.jpg`;

  // so_0 = seek to the first frame of the video and render it as the still.
  return `${prefix}so_0/${rest}`;
}

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
