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
    maxBytes: 75 * 1024 * 1024,
    maxLabel: "75 MB",
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
    return { message: `Unsupported file type: ${file.type || fileExt(file.name) || "unknown"}` };
  }

  const cfg = UPLOAD_CONFIG[kind];
  if (!(cfg.accept as readonly string[]).includes(inferType(file))) {
    return {
      message:
        kind === "image"
          ? "Image must be JPEG, PNG, WebP, GIF, AVIF, or HEIC"
          : "Video must be MP4, WebM, MOV, OGG, or MKV",
    };
  }

  if (file.size > cfg.maxBytes) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      message: `${kind === "image" ? "Image" : "Video"} is ${mb} MB. Max allowed is ${cfg.maxLabel}.`,
    };
  }

  return null;
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
    return withInferredType(file);
  }
}

// Guarantee the file carries a MIME type before upload (HEIC files often
// arrive with an empty type, which the server would otherwise reject).
function withInferredType(file: File): File {
  if (file.type) return file;
  const type = inferType(file) || "application/octet-stream";
  return new File([file], file.name, { type });
}

let ffmpegInstance: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
let ffmpegLoading: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

export async function compressVideo(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<File> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFFmpeg();

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.round(progress * 100));
  };
  ffmpeg.on("progress", progressHandler);

  try {
    const inputName = "input" + getExt(file.name);
    const outputName = "output.mp4";
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const { videoBitrate, audioBitrate, maxWidth } = UPLOAD_CONFIG.video.compress;
    await ffmpeg.exec([
      "-i", inputName,
      "-vf", `scale='min(${maxWidth},iw)':-2`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-b:v", videoBitrate,
      "-c:a", "aac",
      "-b:a", audioBitrate,
      "-movflags", "+faststart",
      outputName,
    ]);

    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const blob = new Blob([data], { type: "video/mp4" });
    const newName = file.name.replace(/\.[^.]+$/, "") + ".mp4";

    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {}

    return new File([blob], newName, { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", progressHandler);
  }
}

function getExt(name: string): string {
  const m = name.match(/\.[^.]+$/);
  return m ? m[0] : "";
}
