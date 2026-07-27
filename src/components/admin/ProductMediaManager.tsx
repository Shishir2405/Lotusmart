"use client";

import React, { useRef } from "react";
import {
  RiUploadLine,
  RiDeleteBinLine,
  RiStarFill,
  RiStarLine,
  RiVideoLine,
  RiImageLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiInformationLine,
} from "react-icons/ri";
import { useUpload } from "@/hooks/useUpload";
import { normalizeImageUrl } from "@/utils/helpers";
import toast from "@/components/ui/toast";

interface ProductMediaManagerProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  videos: string[];
  setVideos: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ProductMediaManager({
  images,
  setImages,
  videos,
  setVideos,
}: ProductMediaManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, stage, progress } = useUpload({ target: "products" });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    let uploadedCount = 0;
    for (const file of files) {
      const result = await upload(file);
      if (!result) continue;
      uploadedCount++;
      if (result.kind === "video") {
        setVideos((prev) => [...prev, result.url]);
      } else {
        setImages((prev) => [...prev, result.url]);
      }
    }

    if (uploadedCount > 0) {
      toast.success(
        `Successfully uploaded ${uploadedCount} file${uploadedCount > 1 ? "s" : ""}`
      );
    }
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0 || index >= images.length) return;
    setImages((prev) => {
      const newImages = [...prev];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift(selected);
      return newImages;
    });
    toast.success("Main product image updated");
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const newImages = [...prev];
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return newImages;
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    toast.success("Image removed");
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, idx) => idx !== index));
    toast.success("Video removed");
  };

  return (
    <div className="space-y-5 bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <RiImageLine className="text-[#E84672]" size={20} /> Product Media
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage photos and videos. Select which photo is the primary image.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/60 text-amber-900 rounded-xl px-3.5 py-2 text-xs">
          <RiInformationLine size={18} className="text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold block sm:inline">Limits: </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <RiImageLine size={13} /> Photos: max <strong className="font-bold">10 MB</strong>
            </span>
            <span className="mx-1.5 opacity-40">|</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <RiVideoLine size={13} /> Videos: max <strong className="font-bold">150 MB</strong>
            </span>
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="flex items-center gap-2 bg-[#FFF1F3] border border-[#FFC2D1] text-[#9E1B42] rounded-xl p-3 text-xs">
          <RiStarFill className="text-[#E84672] text-sm shrink-0" />
          <span>
            <strong>Primary Image Rule:</strong> The photo marked as <strong>Main Image</strong> will appear first on product cards and catalog. Click <em>Set as Main</em> on any photo to change it.
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2.5 flex items-center justify-between">
            <span>Photos ({images.length})</span>
            {images.length > 0 && (
              <span className="text-[11px] font-normal text-neutral-400">
                First image is Primary
              </span>
            )}
          </h3>

          {images.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-neutral-200 text-center text-xs text-neutral-400 bg-neutral-50/50">
              No photos uploaded yet. Upload at least 1 product photo.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((url, i) => {
                const isPrimary = i === 0;
                return (
                  <div
                    key={`img-${i}`}
                    className={`group relative rounded-xl overflow-hidden border-2 transition-all bg-neutral-900 ${isPrimary
                        ? "border-[#E84672] ring-2 ring-[#FFC2D1]"
                        : "border-neutral-200 hover:border-neutral-400"
                      }`}
                  >
                    <div className="aspect-square relative w-full bg-neutral-100">
                      <img
                        src={normalizeImageUrl(url)}
                        alt={`Product photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {isPrimary ? (
                        <div className="absolute top-2 left-2 bg-[#E84672] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 z-10">
                          <RiStarFill size={11} /> Main Image
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(i)}
                          className="absolute top-2 left-2 bg-black/70 hover:bg-[#E84672] text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all z-10"
                          title="Click to set this image as Main/Primary"
                        >
                          <RiStarLine size={11} /> Set as Main
                        </button>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition-colors"
                            title="Delete image"
                          >
                            <RiDeleteBinLine size={15} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-1 text-white">
                          <div className="flex gap-1">
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(i, "left")}
                                className="p-1 rounded bg-black/60 hover:bg-black/90 text-white"
                                title="Move left"
                              >
                                <RiArrowLeftSLine size={14} />
                              </button>
                            )}
                            {i < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(i, "right")}
                                className="p-1 rounded bg-black/60 hover:bg-black/90 text-white"
                                title="Move right"
                              >
                                <RiArrowRightSLine size={14} />
                              </button>
                            )}
                          </div>

                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(i)}
                              className="text-[10px] font-semibold bg-[#E84672] hover:bg-[#d13a64] text-white px-2 py-1 rounded transition-colors"
                            >
                              Make Main
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2.5">
            Videos ({videos.length})
          </h3>

          {videos.length === 0 ? (
            <div className="p-3 rounded-xl border border-dashed border-neutral-200 text-center text-xs text-neutral-400 bg-neutral-50/50">
              No videos uploaded.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videos.map((url, i) => (
                <div
                  key={`vid-${i}`}
                  className="relative rounded-xl overflow-hidden border border-neutral-200 bg-black group"
                >
                  <video
                    src={url}
                    controls
                    preload="metadata"
                    className="w-full aspect-video object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 pointer-events-none">
                    <RiVideoLine size={12} className="text-amber-400" /> Video {i + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(i)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition-colors z-10"
                    title="Delete video"
                  >
                    <RiDeleteBinLine size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,video/mp4,video/webm,video/quicktime,video/ogg,video/x-matroska"
            multiple
            className="sr-only"
            onChange={handleUpload}
          />

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${uploading
                ? "border-amber-300 bg-amber-50/30 cursor-wait"
                : "border-neutral-200 hover:border-[#E84672] hover:bg-[#FFF1F3]/30"
              }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${uploading
                  ? "bg-amber-100 text-amber-600"
                  : "bg-neutral-100 text-neutral-500 group-hover:bg-[#FFF1F3] group-hover:text-[#E84672]"
                }`}
            >
              <RiUploadLine size={24} />
            </div>

            {uploading ? (
              <div className="space-y-1.5 w-full max-w-xs">
                <p className="text-xs font-semibold text-neutral-800">
                  {stage === "validating"
                    ? "Validating files..."
                    : stage === "compressing"
                      ? progress != null
                        ? `Optimizing Image (${progress}%)`
                        : "Optimizing Image..."
                      : progress != null
                        ? `Uploading (${progress}%)`
                        : "Uploading to cloud..."}
                </p>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E84672] transition-all duration-200"
                    style={{ width: `${progress ?? 40}%` }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  Click to upload photos or videos
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Photos max <strong className="font-semibold text-neutral-700">10 MB</strong> (JPG, PNG, WebP, AVIF, HEIC) &nbsp;•&nbsp; Videos max <strong className="font-semibold text-neutral-700">150 MB</strong> (MP4, WebM, MOV)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
