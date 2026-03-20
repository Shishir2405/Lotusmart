/**
 * Cloudflare R2 Storage Service
 *
 * Two buckets:
 *   - ASSETS bucket   → products, banners, category images  (public CDN)
 *   - PROFILES bucket → user avatars                        (public CDN)
 *
 * R2 is S3-compatible — we use the AWS SDK v3 under the hood.
 */

import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// ─── Env helpers ──────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

// ─── Bucket config ────────────────────────────────────────────────────────────

const ASSETS_BUCKET = process.env.R2_ASSETS_BUCKET ?? "lotusmart-assets";
const PROFILES_BUCKET = process.env.R2_PROFILES_BUCKET ?? "lotusmart-profiles";

const ASSETS_PUBLIC_URL = (process.env.R2_ASSETS_PUBLIC_URL ?? "").replace(/\/$/, "");
const PROFILES_PUBLIC_URL = (process.env.R2_PROFILES_PUBLIC_URL ?? "").replace(/\/$/, "");

// ─── Bucket discriminator ─────────────────────────────────────────────────────

type BucketAlias = "assets" | "profiles";

function resolveBucket(alias: BucketAlias): { name: string; publicUrl: string } {
  return alias === "profiles"
    ? { name: PROFILES_BUCKET, publicUrl: PROFILES_PUBLIC_URL }
    : { name: ASSETS_BUCKET, publicUrl: ASSETS_PUBLIC_URL };
}

// ─── S3Client instances (one per bucket, lazy-initialised) ────────────────────

let _assetsClient: S3Client | null = null;
let _profilesClient: S3Client | null = null;

function makeS3Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

function getAssetsClient(): S3Client {
  if (!_assetsClient) _assetsClient = makeS3Client();
  return _assetsClient;
}

function getProfilesClient(): S3Client {
  if (!_profilesClient) _profilesClient = makeS3Client();
  return _profilesClient;
}

function getClient(alias: BucketAlias): S3Client {
  return alias === "profiles" ? getProfilesClient() : getAssetsClient();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadTarget = "products" | "banners" | "categories" | "profiles";

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

// ─── Key generator ────────────────────────────────────────────────────────────

/**
 * Build a unique storage key.
 * Pattern: `<folder>/<timestamp>-<uuid>-<sanitised-filename>`
 */
export function generateKey(folder: string, filename: string): string {
  const uuid = randomUUID();
  const timestamp = Date.now();
  // Sanitise filename — lowercase, replace spaces/special chars with hyphens
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  return `${folder}/${timestamp}-${uuid}-${safe}`;
}

// ─── Public URL helper ────────────────────────────────────────────────────────

function buildPublicUrl(baseUrl: string, key: string): string {
  if (!baseUrl) return key; // Fallback: key only until CDN is configured
  return `${baseUrl}/${key}`;
}

// ─── Core upload ──────────────────────────────────────────────────────────────

/**
 * Upload a Buffer to R2 and return the public URL.
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
  bucket: BucketAlias,
): Promise<string> {
  const { name: bucketName, publicUrl: base } = resolveBucket(bucket);
  const client = getClient(bucket);

  const upload = new Upload({
    client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      // R2 does not support ACL — public access is managed at bucket level
    },
  });

  await upload.done();
  return buildPublicUrl(base, key);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string, bucket: BucketAlias): Promise<void> {
  const { name: bucketName } = resolveBucket(bucket);
  const client = getClient(bucket);
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

// ─── Convenience upload functions ─────────────────────────────────────────────

/**
 * Upload a product image to the assets bucket under `products/`.
 */
export async function uploadProductImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("products", filename);
  const url = await uploadToR2(buffer, key, contentType, "assets");
  return { key, url, bucket: ASSETS_BUCKET };
}

/**
 * Upload a profile avatar to the profiles bucket under `avatars/`.
 */
export async function uploadProfileImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("avatars", filename);
  const url = await uploadToR2(buffer, key, contentType, "profiles");
  return { key, url, bucket: PROFILES_BUCKET };
}

/**
 * Upload a banner image to the assets bucket under `banners/`.
 */
export async function uploadBannerImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("banners", filename);
  const url = await uploadToR2(buffer, key, contentType, "assets");
  return { key, url, bucket: ASSETS_BUCKET };
}

/**
 * Upload a category image to the assets bucket under `categories/`.
 */
export async function uploadCategoryImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("categories", filename);
  const url = await uploadToR2(buffer, key, contentType, "assets");
  return { key, url, bucket: ASSETS_BUCKET };
}

// ─── Generic upload (used by the /api/upload route) ───────────────────────────

/**
 * Route upload to the correct bucket & folder based on the target type.
 */
export async function uploadFile(
  target: UploadTarget,
  file: Buffer | Blob,
  originalName: string,
  contentType: string,
): Promise<UploadResult> {
  // Normalise Blob → Buffer
  const buffer =
    file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

  switch (target) {
    case "profiles":
      return uploadProfileImage(buffer, originalName, contentType);
    case "banners":
      return uploadBannerImage(buffer, originalName, contentType);
    case "categories":
      return uploadCategoryImage(buffer, originalName, contentType);
    case "products":
    default:
      return uploadProductImage(buffer, originalName, contentType);
  }
}

// ─── Delete helpers (alias-aware) ─────────────────────────────────────────────

export async function deleteAsset(key: string): Promise<void> {
  return deleteFromR2(key, "assets");
}

export async function deleteProfile(key: string): Promise<void> {
  return deleteFromR2(key, "profiles");
}

// ─── Presigned URL (for private / temporary access) ───────────────────────────

export async function getPresignedUrl(
  bucket: BucketAlias,
  key: string,
  expiresInSeconds = 3_600,
): Promise<string> {
  const { name: bucketName } = resolveBucket(bucket);
  const client = getClient(bucket);
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
