

import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";


function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}


const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "weibaomedia";

type BucketAlias = "assets" | "profiles";

function resolveBucket(_alias: BucketAlias): { name: string } {
  return { name: BUCKET_NAME };
}


let _s3Client: S3Client | null = null;

function getClient(_alias?: BucketAlias): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return _s3Client;
}


export type UploadTarget = "products" | "banners" | "categories" | "profiles";

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}


export function generateKey(folder: string, filename: string): string {
  const uuid = randomUUID();
  const timestamp = Date.now();
  
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  return `${folder}/${timestamp}-${uuid}-${safe}`;
}


function buildPublicUrl(key: string): string {
  // Serve images through the app's own proxy — no public bucket URL exposed
  return `/api/r2/${key}`;
}


export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
  bucket: BucketAlias,
): Promise<string> {
  const { name: bucketName } = resolveBucket(bucket);
  const client = getClient(bucket);

  const upload = new Upload({
    client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    },
  });

  await upload.done();
  return buildPublicUrl(key);
}


export async function deleteFromR2(key: string, bucket: BucketAlias): Promise<void> {
  const { name: bucketName } = resolveBucket(bucket);
  const client = getClient(bucket);
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}


export async function uploadProductImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("products", filename);
  const url = await uploadToR2(buffer, key, contentType, "assets");
  return { key, url, bucket: BUCKET_NAME };
}


export async function uploadProfileImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("avatars", filename);
  const url = await uploadToR2(buffer, key, contentType, "profiles");
  return { key, url, bucket: BUCKET_NAME };
}


export async function uploadBannerImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("banners", filename);
  const url = await uploadToR2(buffer, key, contentType, "assets");
  return { key, url, bucket: BUCKET_NAME };
}


export async function uploadCategoryImage(
  buffer: Buffer,
  filename: string,
  contentType = "image/webp",
): Promise<UploadResult> {
  const key = generateKey("categories", filename);
  const url = await uploadToR2(buffer, key, contentType, "assets");
  return { key, url, bucket: BUCKET_NAME };
}


export async function uploadFile(
  target: UploadTarget,
  file: Buffer | Blob,
  originalName: string,
  contentType: string,
): Promise<UploadResult> {
  
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


export async function deleteAsset(key: string): Promise<void> {
  return deleteFromR2(key, "assets");
}

export async function deleteProfile(key: string): Promise<void> {
  return deleteFromR2(key, "profiles");
}


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
