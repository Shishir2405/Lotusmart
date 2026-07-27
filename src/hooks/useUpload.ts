"use client";

import { useCallback, useState } from "react";
import axios from "axios";
import toast from "@/components/ui/toast";
import {
  compressImage,
  detectKind,
  validateFile,
  withUploadType,
} from "@/lib/upload";
import {
  describeUploadError,
  uploadDirectToCloudinary,
  type SignedUpload,
} from "@/lib/cloudinary-upload";

export type UploadTarget = "products" | "banners" | "categories" | "profiles" | "blog";

export interface UploadedFile {
  url: string;
  kind: "image" | "video";
}

interface UseUploadOptions {
  target: UploadTarget;
  onSuccess?: (file: UploadedFile) => void;
  onError?: (message: string) => void;
}

export function useUpload({ target, onSuccess, onError }: UseUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState<"idle" | "validating" | "compressing" | "uploading">("idle");

  const upload = useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      setStage("validating");
      const err = validateFile(file);
      if (err) {
        toast.error(err.message);
        onError?.(err.message);
        setStage("idle");
        return null;
      }

      const kind = detectKind(file)!;
      setUploading(true);
      setProgress(0);

      try {
        // Images get a fast client-side compress. Videos are uploaded as-is:
        // transcoding H.264 in the browser (ffmpeg.wasm) took minutes and a
        // ~30MB core download — Cloudinary now compresses server-side instead,
        // so we just hand off the original and let the upload progress show.
        let prepared: File;
        if (kind === "image") {
          setStage("compressing");
          prepared = await compressImage(file);
        } else {
          prepared = withUploadType(file);
        }

        setStage("uploading");
        setProgress(0);

        // The file goes browser -> Cloudinary directly; only the signature comes
        // from us. Routing bytes through /api/upload capped uploads at Vercel's
        // 4.5 MB serverless request body limit, which failed every real video.
        const sig = await axios.post<{ data: SignedUpload }>("/api/upload/signature", {
          target,
          kind,
          filename: prepared.name,
        });

        const { url } = await uploadDirectToCloudinary(prepared, sig.data.data, setProgress);

        const uploaded: UploadedFile = { url, kind };
        onSuccess?.(uploaded);
        return uploaded;
      } catch (e) {
        const message = describeUploadError(e, kind);
        toast.error(message);
        onError?.(message);
        return null;
      } finally {
        setUploading(false);
        setProgress(null);
        setStage("idle");
      }
    },
    [target, onSuccess, onError],
  );

  const uploadMany = useCallback(
    async (files: File[]): Promise<UploadedFile[]> => {
      const results: UploadedFile[] = [];
      for (const f of files) {
        const r = await upload(f);
        if (r) results.push(r);
      }
      return results;
    },
    [upload],
  );

  return { upload, uploadMany, uploading, progress, stage };
}
