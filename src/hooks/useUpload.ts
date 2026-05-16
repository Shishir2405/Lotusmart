"use client";

import { useCallback, useState } from "react";
import axios from "axios";
import toast from "@/components/ui/toast";
import {
  compressImage,
  compressVideo,
  detectKind,
  validateFile,
} from "@/lib/upload";

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
      setStage("compressing");

      try {
        const compressed =
          kind === "image"
            ? await compressImage(file)
            : await compressVideo(file, (pct) => setProgress(pct));

        setStage("uploading");
        setProgress(null);

        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("target", target);
        fd.append("kind", kind);

        const res = await axios.post<{ data: { url: string } }>("/api/upload", fd, {
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        });

        const uploaded: UploadedFile = { url: res.data.data.url, kind };
        onSuccess?.(uploaded);
        return uploaded;
      } catch (e) {
        const message = axios.isAxiosError(e)
          ? (e.response?.data?.message ?? `${kind === "image" ? "Image" : "Video"} upload failed`)
          : e instanceof Error
            ? e.message
            : `${kind === "image" ? "Image" : "Video"} upload failed`;
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
