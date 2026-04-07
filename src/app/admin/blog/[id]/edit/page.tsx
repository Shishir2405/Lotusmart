"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  RiArrowLeftLine,
  RiUploadLine,
  RiCheckLine,
  RiDraftLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import dynamic from "next/dynamic";
import axios from "axios";
import toast from "@/components/ui/toast";
import { normalizeImageUrl } from "@/utils/helpers";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 rounded-xl border border-neutral-200 bg-neutral-50 animate-pulse" />
    ),
  },
);

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    author: "",
    tags: "",
    status: "draft" as "draft" | "published" | "archived",
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`/api/admin/blog/${blogId}`);
        const blog = res.data.data;
        setForm({
          title: blog.title ?? "",
          excerpt: blog.excerpt ?? "",
          content: blog.content ?? "",
          coverImage: blog.coverImage ?? "",
          author: blog.author ?? "",
          tags: (blog.tags ?? []).join(", "),
          status: blog.status ?? "draft",
          metaTitle: blog.metaTitle ?? "",
          metaDescription: blog.metaDescription ?? "",
        });
      } catch {
        toast.error("Failed to load blog post");
        router.push("/admin/blog");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [blogId, router]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target", "blog");
      const res = await axios.post<{ data: { url: string } }>("/api/upload", fd);
      updateField("coverImage", res.data.data.url);
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

  const handleSubmit = async (publishStatus?: "draft" | "published") => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.excerpt.trim()) return toast.error("Excerpt is required");
    if (!form.content.trim()) return toast.error("Content is required");
    if (!form.author.trim()) return toast.error("Author is required");

    setSaving(true);
    try {
      await axios.patch(`/api/admin/blog/${blogId}`, {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        coverImage: form.coverImage,
        author: form.author.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: publishStatus ?? form.status,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      });
      toast.success("Blog updated!");
      router.push("/admin/blog");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to save";
      toast.error(msg ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/blog"
          className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <RiArrowLeftLine size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Edit Blog Post</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Update your blog post</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <Input
          label="Title *"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Enter blog title..."
        />

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Excerpt *</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            placeholder="Short summary of the blog post..."
            rows={3}
            maxLength={500}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E84672] resize-none"
          />
          <p className="text-xs text-neutral-400 mt-1">{form.excerpt.length}/500</p>
        </div>

        {/* Content */}
        <RichTextEditor
          label="Content *"
          value={form.content}
          onChange={(val) => updateField("content", val)}
          placeholder="Write your blog post..."
        />

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Cover Image</label>
          {form.coverImage ? (
            <div className="flex items-center gap-4">
              <div className="w-40 h-24 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                <Image
                  src={normalizeImageUrl(form.coverImage)}
                  alt="Cover"
                  width={160}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <button
                type="button"
                onClick={() => updateField("coverImage", "")}
                className="text-sm text-red-500 hover:underline"
              >
                Remove image
              </button>
            </div>
          ) : (
            <label
              className={`flex items-center gap-3 w-fit px-4 py-2.5 border border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-[#E84672] transition-colors text-sm text-neutral-400 ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <RiUploadLine size={16} />
              {uploading ? "Uploading..." : "Upload cover image"}
              <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
            </label>
          )}
        </div>

        {/* Author & Tags */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Author *"
            value={form.author}
            onChange={(e) => updateField("author", e.target.value)}
            placeholder="Author name"
          />
          <Input
            label="Tags"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
            placeholder="health, spices, recipes (comma-separated)"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value as typeof form.status)}
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* SEO */}
        <div className="border-t border-neutral-100 pt-5">
          <p className="text-sm font-semibold text-neutral-700 mb-3">SEO (Optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Meta Title"
              value={form.metaTitle}
              onChange={(e) => updateField("metaTitle", e.target.value)}
              placeholder="SEO title"
            />
            <Input
              label="Meta Description"
              value={form.metaDescription}
              onChange={(e) => updateField("metaDescription", e.target.value)}
              placeholder="SEO description"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-neutral-100">
          <Button
            onClick={() => handleSubmit("published")}
            isLoading={saving}
            leftIcon={<RiCheckLine />}
          >
            {form.status === "published" ? "Update" : "Publish"}
          </Button>
          {form.status !== "published" && (
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              isLoading={saving}
              leftIcon={<RiDraftLine />}
            >
              Save as Draft
            </Button>
          )}
          <Link href="/admin/blog">
            <Button variant="ghost">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
