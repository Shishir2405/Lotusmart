export const UPLOAD_CONFIG = {
  image: {
    maxBytes: 10 * 1024 * 1024,
    maxLabel: "10 MB",
    accept: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"],
    compress: {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      fileType: "image/webp" as const,
    },
  },
  video: {
    // Uploads go browser -> Cloudinary directly (see lib/cloudinary-upload.ts),
    // so this is no longer bounded by Vercel's 4.5 MB serverless body limit.
    maxBytes: 150 * 1024 * 1024,
    maxLabel: "150 MB",
    accept: ["video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/x-matroska"],
    compress: {
      videoBitrate: "1500k",
      audioBitrate: "128k",
      maxWidth: 1280,
    },
  },
} as const;

export type UploadKind = "image" | "video";

const IMAGE_EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", avif: "image/avif", heic: "image/heic", heif: "image/heif",
};
const VIDEO_EXT_TYPES: Record<string, string> = {
  mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  ogg: "video/ogg", ogv: "video/ogg", mkv: "video/x-matroska",
};

function fileExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

// Some browsers report an empty MIME type for certain formats — most commonly
// HEIC/HEIF photos straight from an iPhone. Fall back to the file extension so
// these are still recognised and accepted.
export function inferType(file: File): string {
  if (file.type) return file.type;
  const ext = fileExt(file.name);
  return IMAGE_EXT_TYPES[ext] ?? VIDEO_EXT_TYPES[ext] ?? "";
}

export function detectKind(file: File): UploadKind | null {
  const type = inferType(file);
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return null;
}

export interface ValidationError {
  message: string;
}

export function validateFile(file: File): ValidationError | null {
  const kind = detectKind(file);
  if (!kind) {
    return {
      message: `Unsupported file type for '${file.name}'. Allowed photos: JPG, PNG, WebP, GIF, AVIF, HEIC. Allowed videos: MP4, WebM, MOV, OGG, MKV.`,
    };
  }

  const cfg = UPLOAD_CONFIG[kind];
  if (!(cfg.accept as readonly string[]).includes(inferType(file))) {
    return {
      message:
        kind === "image"
          ? `Image format not supported for '${file.name}'. Allowed photo formats: JPEG, PNG, WebP, GIF, AVIF, HEIC.`
          : `Video format not supported for '${file.name}'. Allowed video formats: MP4, WebM, MOV, OGG, MKV.`,
    };
  }

  const label = kind === "image" ? "Photo" : "Video";

  if (file.size === 0) {
    return {
      message: `${label} '${file.name}' is empty (0 KB). The file may be corrupted or still syncing from cloud storage — re-export it and try again.`,
    };
  }

  if (file.size > cfg.maxBytes) {
    return {
      message: `${label} '${file.name}' is ${formatSize(file.size)}, which is over the ${cfg.maxLabel} limit. Trim the clip or re-export it at a lower bitrate/resolution, then upload again.`,
    };
  }

  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function compressImage(file: File): Promise<File> {
  try {
    const { default: imageCompression } = await import("browser-image-compression");
    const compressed = await imageCompression(file, {
      maxSizeMB: UPLOAD_CONFIG.image.compress.maxSizeMB,
      maxWidthOrHeight: UPLOAD_CONFIG.image.compress.maxWidthOrHeight,
      useWebWorker: UPLOAD_CONFIG.image.compress.useWebWorker,
      fileType: UPLOAD_CONFIG.image.compress.fileType,
    });
    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([compressed], newName, { type: "image/webp" });
  } catch {
    // The browser can't decode every format in a <canvas> — most notably
    // HEIC/HEIF photos from iPhones — so compression throws. Fall back to the
    // original file; Cloudinary converts it to a web format server-side.
    return withUploadType(file);
  }
}

// Guarantee the file carries a MIME type before upload (HEIC images and some
// video containers arrive with an empty type, which the server would reject).
export function withUploadType(file: File): File {
  if (file.type) return file;
  const type = inferType(file) || "application/octet-stream";
  return new File([file], file.name, { type });
}

// NOTE: Video is no longer transcoded in the browser. In-browser H.264
// encoding via ffmpeg.wasm took minutes and pulled a ~30MB core over the
// network; Cloudinary now compresses server-side (see services/cloudinary.ts),
// so the client uploads the original file directly.
