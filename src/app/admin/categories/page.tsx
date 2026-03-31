"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiUploadLine,
  RiCheckLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import axios from "axios";
import toast from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: { _id: string; name: string; slug: string } | null;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  image: "",
  parent: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    axios
      .get<{ data: Category[] }>("/api/admin/categories")
      .then((r) => setCategories(r.data.data))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      image: cat.image ?? "",
      parent: cat.parent?._id ?? "",
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target", "category");
      const res = await axios.post<{ data: { url: string } }>("/api/upload", fd);
      setForm((f) => ({ ...f, image: res.data.data.url }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        image: form.image || undefined,
        parent: form.parent || null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };

      if (editTarget) {
        await axios.patch(`/api/admin/categories/${editTarget._id}`, payload);
        toast.success("Category updated");
      } else {
        await axios.post("/api/admin/categories", payload);
        toast.success("Category created");
      }

      closeForm();
      fetchCategories();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to save";
      toast.error(msg ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await axios.patch(`/api/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories((prev) =>
        prev.map((c) => c._id === cat._id ? { ...c, isActive: !cat.isActive } : c)
      );
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/categories/${deleteTarget._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      toast.success("Category deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to delete";
      toast.error(msg ?? "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  
  const parentOptions = categories.filter((c) => !c.parent && (!editTarget || c._id !== editTarget._id));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categories</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{categories.length} total categories</p>
        </div>
        <Button leftIcon={<RiAddLine />} onClick={openCreate}>
          Add Category
        </Button>
      </div>

      
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Parent
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Sort
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
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9" rounded="lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-14" rounded="full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto" rounded="lg" /></td>
                  </tr>
                ))
              : categories.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <RiAddLine size={40} className="text-neutral-200 mb-3 mx-auto" />
                      <p className="text-neutral-400 text-sm">No categories yet. Add one to get started.</p>
                    </td>
                  </tr>
                )
              : categories.map((cat) => (
                  <motion.tr
                    key={cat._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[#FAFAF9] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F7F6F0] overflow-hidden shrink-0 flex items-center justify-center text-lg">
                          {cat.image ? (
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              width={36}
                              height={36}
                              className="object-cover w-full h-full"
                            />
                          ) : <span className="text-sm font-bold text-neutral-300">{cat.name.charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{cat.name}</p>
                          <p className="text-xs text-neutral-400 font-mono">{cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-500">
                      {cat.parent ? (
                        <span className="bg-[#F7F6F0] px-2 py-0.5 rounded-full text-xs font-medium text-neutral-600">
                          {cat.parent.name}
                        </span>
                      ) : (
                        <span className="text-neutral-300 text-xs">--</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-500">{cat.sortOrder}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleActive(cat)}>
                        <Badge variant={cat.isActive ? "success" : "neutral"} dot>
                          {cat.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                        >
                          <RiEditLine size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
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

      
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editTarget ? `Edit: ${editTarget.name}` : "New Category"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Fresh Vegetables"
              required
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Parent Category
              </label>
              <select
                value={form.parent}
                onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white"
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short category description..."
          />

          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category Image
            </label>
            {form.image ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                  <Image
                    src={form.image}
                    alt="Category"
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image: "" }))}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-3 w-fit px-4 py-2.5 border border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-[#E84672] transition-colors text-sm text-neutral-400 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <RiUploadLine size={16} />
                {uploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <Input
              label="Sort Order"
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
            <div className="flex items-center gap-2 pb-2.5">
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
              {editTarget ? "Save Changes" : "Create Category"}
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
        title="Delete Category"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-neutral-800">
              {deleteTarget?.name}
            </span>
            ? This action cannot be undone.
          </p>
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
    </div>
  );
}
