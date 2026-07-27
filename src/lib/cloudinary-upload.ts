"use client";

import axios from "axios";

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  resourceType: "image" | "video";
  params: Record<string, string>;
  signature: string;
}

export interface DirectUploadResult {
  url: string;
  publicId: string;
}

// Cloudinary rejects a single request body over 100 MB, so anything larger has
// to be split. Chunks must be a multiple of 5 MB (the final one may be short).
const CHUNK_SIZE = 20 * 1024 * 1024;

interface CloudinaryAsset {
  secure_url: string;
  public_id: string;
}

/**
 * Upload a file from the browser straight to Cloudinary using a signature
 * minted by /api/upload/signature. The bytes never touch our own server, which
 * is what lets videos exceed Vercel's 4.5 MB request body cap.
 */
export async function uploadDirectToCloudinary(
  file: File,
  signed: SignedUpload,
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResult> {
  const endpoint = `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`;

  const form = (blob: Blob) => {
    const fd = new FormData();
    for (const [key, value] of Object.entries(signed.params)) fd.append(key, value);
    fd.append("api_key", signed.apiKey);
    fd.append("signature", signed.signature);
    fd.append("file", blob, file.name);
    return fd;
  };

  if (file.size <= CHUNK_SIZE) {
    const res = await axios.post<CloudinaryAsset>(endpoint, form(file), {
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
      },
    });
    return { url: res.data.secure_url, publicId: res.data.public_id };
  }

  // Chunked upload: every chunk carries the same signature and the same
  // X-Unique-Upload-Id so Cloudinary reassembles them into one asset. Only the
  // final chunk's response contains the finished asset.
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let asset: CloudinaryAsset | null = null;

  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const res = await axios.post<CloudinaryAsset>(endpoint, form(file.slice(start, end)), {
      headers: {
        "X-Unique-Upload-Id": uploadId,
        "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
      },
      onUploadProgress: (e) => {
        onProgress?.(Math.min(99, Math.round(((start + e.loaded) / file.size) * 100)));
      },
    });
    asset = res.data;
  }

  if (!asset?.secure_url) {
    throw new Error("Upload finished but Cloudinary returned no file URL. Please try again.");
  }

  onProgress?.(100);
  return { url: asset.secure_url, publicId: asset.public_id };
}

/**
 * Turn a failed upload into something an admin can act on. Cloudinary replies
 * with { error: { message } }; account-level size limits surface as a 400 or
 * 413 whose wording ("File size too large") is worth passing through verbatim.
 */
export function describeUploadError(err: unknown, kind: "image" | "video"): string {
  const label = kind === "image" ? "Photo" : "Video";

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    const cloudinaryMessage = data?.error?.message ?? data?.message;

    if (status === 413) {
      return `${label} is too large for the upload service to accept. Try a shorter clip or a lower resolution export.`;
    }
    if (status === 401 || status === 403) {
      return `Upload was rejected (${status}). Your session may have expired — please refresh the page and sign in again.`;
    }
    if (cloudinaryMessage) {
      return `${label} upload failed: ${cloudinaryMessage}`;
    }
    if (err.code === "ERR_NETWORK") {
      return `${label} upload failed — the connection dropped. Large files need a stable network; please retry.`;
    }
    if (status) {
      return `${label} upload failed with error ${status}. Please try again.`;
    }
  }

  if (err instanceof Error && err.message) return err.message;
  return `${label} upload failed. Please try again.`;
}
