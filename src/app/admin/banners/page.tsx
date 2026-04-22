"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiAddLine, RiDeleteBinLine, RiUploadLine, RiDraggable, RiEditLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import axios from "axios";
import toast from "@/components/ui/toast";
import { normalizeImageUrl } from "@/utils/helpers";

type ColorScheme = "amber" | "olive" | "rose" | "emerald" | "sky";

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
  position: "hero" | "sidebar" | "category";
  colorScheme?: ColorScheme;
}

const COLOR_SCHEMES: {
  id: ColorScheme;
  label: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
}[] = [
  { id: "amber",   label: "Amber",   bgFrom: "#FFF9E8", bgTo: "#FFE8C8", accent: "#E84672" },
  { id: "olive",   label: "Olive",   bgFrom: "#F7F6F0", bgTo: "#EBE8D8", accent: "#7A6E42" },
  { id: "rose",    label: "Rose",    bgFrom: "#FFF1F3", bgTo: "#FFE0E6", accent: "#E84672" },
  { id: "emerald", label: "Emerald", bgFrom: "#F0FDF4", bgTo: "#DCFCE7", accent: "#16A34A" },
  { id: "sky",     label: "Sky",     bgFrom: "#EFF6FF", bgTo: "#DBEAFE", accent: "#2563EB" },
];

type BannerForm = {
  title: string;
  subtitle: string;
  link: string;
  position: "hero" | "sidebar" | "category";
  sortOrder: number;
  isActive: boolean;
  colorScheme: ColorScheme;
};

const EMPTY_FORM: BannerForm = {
  title: "",
  subtitle: "",
  link: "",
  position: "hero",
  sortOrder: 0,
  isActive: true,
  colorScheme: "amber",
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageUrl("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      link: banner.link ?? "",
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      colorScheme: banner.colorScheme ?? "amber",
    });
    setImageUrl(banner.image);
    setShowForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const fetchBanners = () => {
    setLoading(true);
    axios
      .get<{ data: Banner[] }>("/api/admin/banners")
      .then((r) => setBanners(r.data.data))
      .catch(() => toast.error("Failed to load banners"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target", "banner");
      const res = await axios.post<{ data: { url: string } }>("/api/upload", fd);
      setImageUrl(res.data.data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Upload failed")
          : "Upload failed",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) { toast.error("Please upload a banner image"); return; }
    setSaving(true);
    try {
      const payload = { ...form, image: imageUrl };
      if (editingId) {
        await axios.patch(`/api/admin/banners/${editingId}`, payload);
        toast.success("Banner updated");
      } else {
        await axios.post("/api/admin/banners", payload);
        toast.success("Banner created");
      }
      closeForm();
      fetchBanners();
    } catch {
      toast.error(editingId ? "Failed to update banner" : "Failed to create banner");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await axios.patch(`/api/admin/banners/${id}`, { isActive: !current });
      setBanners((prev) => prev.map((b) => b._id === id ? { ...b, isActive: !current } : b));
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/admin/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b._id !== id));
      toast.success("Banner deleted");
    } catch { toast.error("Failed to delete"); } finally { setDeletingId(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Banners</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage hero and promotional banners</p>
        </div>
        {!showForm && (
          <Button leftIcon={<RiAddLine />} onClick={openCreate}>Add Banner</Button>
        )}
      </div>

      
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl p-6 border border-neutral-100 mb-6"
          >
            <h2 className="font-semibold text-neutral-800 mb-5">
              {editingId ? "Edit Banner" : "New Banner"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Banner Image *</label>
                {imageUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-neutral-200 mb-2">
                    
                    <img src={normalizeImageUrl(imageUrl)} alt="Banner preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 text-xs">Remove</button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-[#E84672] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <RiUploadLine size={24} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400">{uploading ? "Uploading..." : "Click to upload banner image"}</span>
                    <span className="text-xs text-neutral-300 mt-0.5">Recommended: 1920×600px</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Link URL" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="/products or https://..." />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Position</label>
                  <select value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value as typeof form.position }))} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white">
                    <option value="hero">Hero</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="category">Category</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Background Colour
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SCHEMES.map((scheme) => {
                    const selected = form.colorScheme === scheme.id;
                    return (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, colorScheme: scheme.id }))
                        }
                        className="group flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition-all"
                        style={{
                          borderColor: selected ? scheme.accent : "#e5e5e5",
                          backgroundColor: selected ? "#fff" : "#fafafa",
                          boxShadow: selected
                            ? `0 0 0 2px ${scheme.accent}22`
                            : "none",
                        }}
                      >
                        <span
                          className="h-6 w-10 rounded-md border border-black/5"
                          style={{
                            background: `linear-gradient(135deg, ${scheme.bgFrom} 0%, ${scheme.bgTo} 100%)`,
                          }}
                        />
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: scheme.accent }}
                        />
                        <span
                          className="pr-1"
                          style={{ color: selected ? scheme.accent : "#737373" }}
                        >
                          {scheme.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-neutral-400">
                  Used as the background gradient and accent colour on the hero
                  section.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Sort Order" type="number" value={String(form.sortOrder)} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded accent-[#E84672]" />
                    <span className="text-sm text-neutral-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="submit" isLoading={saving}>
                  {editingId ? "Save Changes" : "Create Banner"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-28 border border-neutral-100 animate-pulse" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100">
          <RiUploadLine size={40} className="text-neutral-200 mb-3 mx-auto" />
          <p className="text-neutral-500">No banners yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {banners.map((banner) => (
              <motion.div
                key={banner._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden flex items-center"
              >
                <div className="p-3 text-neutral-300 cursor-grab">
                  <RiDraggable size={18} />
                </div>
                <div className="w-28 h-16 shrink-0 bg-[#F7F6F0] overflow-hidden">
                  
                  <img src={normalizeImageUrl(banner.image)} alt={banner.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{banner.title}</p>
                  {banner.subtitle && <p className="text-xs text-neutral-400 truncate mt-0.5">{banner.subtitle}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-neutral-400 capitalize bg-[#F7F6F0] px-2 py-0.5 rounded-full">{banner.position}</span>
                    {banner.link && <span className="text-xs text-neutral-400 truncate max-w-xs">→ {banner.link}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4">
                  <button onClick={() => toggleActive(banner._id, banner.isActive)}>
                    <Badge variant={banner.isActive ? "success" : "neutral"} dot>
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                  <button
                    onClick={() => openEdit(banner)}
                    title="Edit banner"
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                  >
                    <RiEditLine size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    disabled={deletingId === banner._id}
                    title="Delete banner"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <RiDeleteBinLine size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
