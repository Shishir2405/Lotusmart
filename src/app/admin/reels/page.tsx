"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiCheckLine,
  RiSearchLine,
  RiUploadLine,
  RiPlayCircleLine,
  RiShoppingBag3Line,
  RiEyeLine,
} from "react-icons/ri";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import toast from "@/components/ui/toast";
import { useUpload } from "@/hooks/useUpload";
import { useDebounce } from "@/hooks/useDebounce";
import { normalizeImageUrl } from "@/utils/helpers";

interface ReelProduct {
  _id: string;
  name: string;
  slug?: string;
  price?: number;
  compareAtPrice?: number;
  images?: string[];
  stock?: number;
}

interface Reel {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  products: ReelProduct[];
  order: number;
  isActive: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface ReelForm {
  title: string;
  caption: string;
  order: string;
  isActive: boolean;
}

const EMPTY_FORM: ReelForm = {
  title: "",
  caption: "",
  order: "0",
  isActive: true,
};

/** Shape returned by /api/products/search */
interface SearchHit {
  id: string;
  name: string;
  slug?: string;
  price?: number;
  image?: string | null;
}

/** Shape returned by /api/products */
interface ListProduct {
  _id: string;
  name: string;
  slug?: string;
  price?: number;
  images?: string[];
}

/** Normalised picker row — both product endpoints collapse into this. */
interface PickerProduct {
  _id: string;
  name: string;
  price?: number;
  image: string;
}

function fromSearchHit(hit: SearchHit): PickerProduct {
  return {
    _id: String(hit.id),
    name: hit.name,
    price: hit.price,
    image: normalizeImageUrl(hit.image ?? ""),
  };
}

function fromListProduct(product: ListProduct): PickerProduct {
  return {
    _id: String(product._id),
    name: product.name,
    price: product.price,
    image: normalizeImageUrl(product.images?.[0] ?? ""),
  };
}

function fromReelProduct(product: ReelProduct): PickerProduct {
  return {
    _id: String(product._id),
    name: product.name,
    price: product.price,
    image: normalizeImageUrl(product.images?.[0] ?? ""),
  };
}

export default function AdminReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);


  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Reel | null>(null);
  const [form, setForm] = useState<ReelForm>(EMPTY_FORM);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<PickerProduct[]>([]);
  const [saving, setSaving] = useState(false);


  const [productQuery, setProductQuery] = useState("");
  const debouncedProductQuery = useDebounce(productQuery, 300);
  const [productResults, setProductResults] = useState<PickerProduct[]>([]);
  const [productLoading, setProductLoading] = useState(false);


  const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    upload: uploadVideo,
    uploading: videoUploading,
    progress: videoProgress,
    stage: videoStage,
  } = useUpload({ target: "banners" });
  const { upload: uploadThumbnail, uploading: thumbnailUploading } = useUpload({
    target: "banners",
  });

  const fetchReels = useCallback(() => {
    setLoading(true);
    axios
      .get<{ data: Reel[] }>("/api/admin/reels", {
        params: { limit: 100, ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}) },
      })
      .then((r) => setReels(r.data.data))
      .catch(() => toast.error("Failed to load reels"))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // Product picker: fall back to a recent-products list until the admin types
  // 2+ characters, which is the minimum /api/products/search accepts.
  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    const q = debouncedProductQuery.trim();
    setProductLoading(true);

    const request =
      q.length >= 2
        ? axios
            .get<{ data: SearchHit[] }>("/api/products/search", { params: { q } })
            .then((r) => r.data.data.map(fromSearchHit))
        : axios
            .get<{ data: ListProduct[] }>("/api/products", { params: { limit: 12 } })
            .then((r) => r.data.data.map(fromListProduct));

    request
      .then((rows) => {
        if (!cancelled) setProductResults(rows);
      })
      .catch(() => {
        if (!cancelled) setProductResults([]);
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedProductQuery, showForm]);

  const resetForm = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setVideoUrl("");
    setThumbnailUrl("");
    setSelectedProducts([]);
    setProductQuery("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (reel: Reel) => {
    setEditTarget(reel);
    setForm({
      title: reel.title,
      caption: reel.caption ?? "",
      order: String(reel.order),
      isActive: reel.isActive,
    });
    setVideoUrl(reel.videoUrl);
    setThumbnailUrl(reel.thumbnailUrl);
    setSelectedProducts((reel.products ?? []).map(fromReelProduct));
    setProductQuery("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const uploaded = await uploadVideo(file);
    if (uploaded) {
      setVideoUrl(uploaded.url);
      toast.success("Video uploaded");
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const uploaded = await uploadThumbnail(file);
    if (uploaded) {
      setThumbnailUrl(uploaded.url);
      toast.success("Thumbnail uploaded");
    }
  };

  const toggleProduct = (product: PickerProduct) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p._id === product._id)
        ? prev.filter((p) => p._id !== product._id)
        : [...prev, product],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Reel title is required");
      return;
    }
    if (!videoUrl.trim()) {
      toast.error("Upload a video or paste a video URL");
      return;
    }
    // Thumbnail is optional: when left empty the server derives the video's
    // first frame. Send an empty string so an edit that clears it re-derives.

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        caption: form.caption.trim(),
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        products: selectedProducts.map((p) => p._id),
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };

      if (editTarget) {
        await axios.patch(`/api/admin/reels/${editTarget._id}`, payload);
        toast.success("Reel updated");
      } else {
        await axios.post("/api/admin/reels", payload);
        toast.success("Reel created");
      }

      closeForm();
      fetchReels();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to save reel";
      toast.error(msg ?? "Failed to save reel");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (reel: Reel) => {
    try {
      await axios.patch(`/api/admin/reels/${reel._id}`, { isActive: !reel.isActive });
      setReels((prev) =>
        prev.map((r) => (r._id === reel._id ? { ...r, isActive: !reel.isActive } : r)),
      );
      toast.success(reel.isActive ? "Reel deactivated" : "Reel activated");
    } catch {
      toast.error("Failed to update reel status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/reels/${deleteTarget._id}`);
      setReels((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      toast.success("Reel deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to delete reel";
      toast.error(msg ?? "Failed to delete reel");
    } finally {
      setDeleting(false);
    }
  };

  const activeReels = reels.filter((r) => r.isActive);

  return (
    <div className="p-8">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Watch &amp; Buy Reels</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {reels.length} total &middot; {activeReels.length} active
          </p>
        </div>
        <Button leftIcon={<RiAddLine />} onClick={openCreate}>
          Add Reel
        </Button>
      </div>


      <div className="mb-6">
        <Input
          placeholder="Search reels by title or caption..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<RiSearchLine />}
          className="max-w-sm"
        />
      </div>


      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editTarget ? `Edit Reel: ${editTarget.title}` : "Create New Reel"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Video <span className="text-[#E84672] ml-0.5">*</span>
              </label>
              {videoUrl ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-neutral-200 bg-black mb-2">
                  <video
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <button
                    type="button"
                    onClick={() => setVideoUrl("")}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 text-xs"
                  >
                    <RiCloseLine size={14} />
                  </button>
                </div>
              ) : (
                <label
                  className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-[#E84672] transition-colors mb-2 ${
                    videoUploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <RiPlayCircleLine size={24} className="text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-400">
                    {videoUploading
                      ? `${videoStage === "compressing" ? "Compressing" : "Uploading"}${
                          videoProgress != null ? ` ${videoProgress}%` : ""
                        }...`
                      : "Click to upload a vertical video"}
                  </span>
                  <span className="text-xs text-neutral-300 mt-0.5">
                    MP4 / WebM / MOV &middot; 9:16 &middot; max 75 MB
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={handleVideoUpload}
                  />
                </label>
              )}
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="...or paste an mp4 / HLS URL"
                hint="Paste a URL to skip the upload"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Thumbnail{" "}
                <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              {thumbnailUrl && normalizeImageUrl(thumbnailUrl) ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-neutral-200 bg-[#F7F6F0] mb-2">

                  <img
                    src={normalizeImageUrl(thumbnailUrl)}
                    alt="Reel thumbnail preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl("")}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 text-xs"
                  >
                    <RiCloseLine size={14} />
                  </button>
                </div>
              ) : (
                <label
                  className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-[#E84672] transition-colors mb-2 ${
                    thumbnailUploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <RiUploadLine size={24} className="text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-400">
                    {thumbnailUploading ? "Uploading..." : "Click to upload a poster image"}
                  </span>
                  <span className="text-xs text-neutral-300 mt-0.5">
                    Leave empty to auto-use the video&apos;s first frame &middot; 1080&times;1920px
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleThumbnailUpload}
                  />
                </label>
              )}
              <Input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="...or paste an image URL"
                hint="Paste a URL to skip the upload"
              />
            </div>
          </div>


          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Premium Kashmiri Almonds unboxing"
            required
          />


          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Caption</label>
            <textarea
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              rows={2}
              placeholder="Short caption shown under the reel"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/30 bg-white transition-all duration-200 resize-y"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Shoppable Products
              <span className="ml-1.5 text-xs font-normal text-neutral-400">
                {selectedProducts.length} selected
              </span>
            </label>

            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2.5">
                {selectedProducts.map((product) => (
                  <span
                    key={product._id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F3] border border-[#E84672]/30 pl-1.5 pr-2 py-1 text-xs font-medium text-[#E84672]"
                  >
                    {product.image ? (

                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <RiShoppingBag3Line size={12} />
                    )}
                    <span className="max-w-[160px] truncate">{product.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className="text-[#E84672]/60 hover:text-[#E84672] transition-colors"
                      title="Remove product"
                    >
                      <RiCloseLine size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <Input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search products to attach..."
              leftIcon={<RiSearchLine />}
            />

            <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-50">
              {productLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" rounded="lg" />
                  ))}
                </div>
              ) : productResults.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-neutral-400">
                  {productQuery.trim().length >= 2
                    ? "No products match your search."
                    : "No products available."}
                </p>
              ) : (
                productResults.map((product) => {
                  const selected = selectedProducts.some((p) => p._id === product._id);
                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                        selected ? "bg-[#FFF1F3]" : "hover:bg-[#FAFAF9]"
                      }`}
                    >
                      <span className="w-8 h-8 shrink-0 rounded-lg bg-[#F7F6F0] overflow-hidden flex items-center justify-center">
                        {product.image ? (

                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <RiShoppingBag3Line size={14} className="text-neutral-300" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-neutral-700 truncate">
                          {product.name}
                        </span>
                        {product.price != null && (
                          <span className="block text-xs text-neutral-400">
                            &#8377;{product.price}
                          </span>
                        )}
                      </span>
                      {selected && <RiCheckLine size={16} className="text-[#E84672]" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Order"
              type="number"
              step="1"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              placeholder="0"
              hint="Lower numbers appear first"
            />
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded accent-[#E84672]"
                />
                <span className="text-sm text-neutral-700">Active</span>
              </label>
            </div>
          </div>


          <div className="flex gap-3 pt-2 border-t border-neutral-100">
            <Button type="submit" isLoading={saving} leftIcon={<RiCheckLine />}>
              {editTarget ? "Save Changes" : "Create Reel"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>


      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Reel"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-neutral-800">{deleteTarget?.title}</span>?
            This action cannot be undone.
          </p>
          {deleteTarget && deleteTarget.views > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              This reel has {deleteTarget.views} view
              {deleteTarget.views !== 1 ? "s" : ""}. Deleting it removes it from the
              storefront immediately.
            </p>
          )}
          <div className="flex gap-3 mt-5">
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
              leftIcon={<RiDeleteBinLine />}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>


      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Reel
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Products
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Views
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-14 w-10" rounded="lg" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-16" rounded="full" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Skeleton className="h-8 w-20 ml-auto" rounded="lg" />
                      </td>
                    </tr>
                  ))
                : reels.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <RiPlayCircleLine size={40} className="text-neutral-200 mb-3" />
                            <p className="text-neutral-400 text-sm">
                              {searchQuery.trim()
                                ? "No reels match your search."
                                : "No reels yet. Create one to get started."}
                            </p>
                            {!searchQuery.trim() && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-4"
                                leftIcon={<RiAddLine />}
                                onClick={openCreate}
                              >
                                Add Reel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  : reels.map((reel) => (
                      <motion.tr
                        key={reel._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[#FAFAF9] transition-colors group"
                      >

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-[#F7F6F0]">

                              {normalizeImageUrl(reel.thumbnailUrl) && (
                                <img
                                  src={normalizeImageUrl(reel.thumbnailUrl)}
                                  alt={reel.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                                <RiPlayCircleLine size={16} />
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-800 truncate max-w-[260px]">
                                {reel.title}
                              </p>
                              {reel.caption && (
                                <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[260px]">
                                  {reel.caption}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>


                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600">
                            <RiShoppingBag3Line size={14} className="text-neutral-300" />
                            {reel.products?.length ?? 0}
                          </span>
                        </td>


                        <td className="px-4 py-4 text-sm text-neutral-600">{reel.order}</td>


                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600">
                            <RiEyeLine size={14} className="text-neutral-300" />
                            {reel.views}
                          </span>
                        </td>


                        <td className="px-4 py-4">
                          <button onClick={() => toggleActive(reel)}>
                            <Badge variant={reel.isActive ? "success" : "neutral"} dot>
                              {reel.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </button>
                        </td>


                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(reel)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                              title="Edit reel"
                            >
                              <RiEditLine size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(reel)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                              title="Delete reel"
                            >
                              <RiDeleteBinLine size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
