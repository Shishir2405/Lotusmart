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
          resource_type: "image",
          public_id: sanitizeName(originalName),
          overwrite: false,
          unique_filename: true,
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

export async function deleteImage(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

function sanitizeName(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "") // remove extension
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
