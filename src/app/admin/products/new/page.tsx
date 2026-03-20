"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiUploadLine, RiDeleteBinLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import toast from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  unit: "g",
  category: "",
  sku: "",
  isActive: true,
  isFeatured: false,
  tags: "",
  weight: "",
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get<{ data: Category[] }>("/api/categories").then((r) => setCategories(r.data.data)).catch(() => null);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("target", "product");
        const res = await axios.post<{ data: { url: string } }>("/api/upload", fd);
        setImages((prev) => [...prev, res.data.data.url]);
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) {
      toast.error("Name, price and stock are required");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/api/products", {
        ...form,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        stock: Number(form.stock),
        weight: form.weight ? Number(form.weight) : undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        category: form.category || undefined,
        images,
      });
      toast.success("Product created");
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to create product";
      toast.error(msg ?? "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6">
        <RiArrowLeftLine size={15} />
        Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Images */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100">
          <h2 className="font-semibold text-neutral-800 mb-4">Product Images</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RiDeleteBinLine className="text-white" size={16} />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">Main</span>}
              </div>
            ))}
            <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#E84672] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <RiUploadLine size={18} className="text-neutral-400" />
              <span className="text-[10px] text-neutral-400 mt-1">{uploading ? "Uploading..." : "Add photo"}</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
            </label>
          </div>
          <p className="text-xs text-neutral-400">First image is used as the main product image.</p>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-4">
          <h2 className="font-semibold text-neutral-800">Basic Information</h2>
          <Input label="Product Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] resize-none"
              placeholder="Describe the product..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white">
                <option value="">No category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Auto-generated if empty" />
          </div>
          <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="spice, organic, premium" />
        </div>

        {/* Pricing & stock */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-4">
          <h2 className="font-semibold text-neutral-800">Pricing & Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹) *" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            <Input label="Compare At Price (₹)" type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} placeholder="Optional MRP" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock *" type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} required />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Unit</label>
              <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white">
                {["g", "kg", "ml", "L", "pcs", "pack", "box"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Input label="Weight (grams)" type="number" min="0" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="For shipping calculations" />
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-3">
          <h2 className="font-semibold text-neutral-800">Visibility</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded accent-[#E84672]" />
            <span className="text-sm text-neutral-700">Active (visible to customers)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="rounded accent-[#E84672]" />
            <span className="text-sm text-neutral-700">Featured (shown on homepage)</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" isLoading={saving}>Create Product</Button>
          <Link href="/admin/products"><Button variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
