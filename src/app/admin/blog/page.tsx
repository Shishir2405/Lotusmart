"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiEyeLine,
  RiDraftLine,
  RiCheckLine,
  RiArchiveLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import toast from "@/components/ui/toast";
import { normalizeImageUrl } from "@/utils/helpers";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  viewCount: number;
  isActive: boolean;
  publishedAt?: string;
  createdAt: string;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const statusConfig = {
  draft: { variant: "warning" as const, icon: RiDraftLine, label: "Draft" },
  published: { variant: "success" as const, icon: RiCheckLine, label: "Published" },
  archived: { variant: "neutral" as const, icon: RiArchiveLine, label: "Archived" },
};

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await axios.get(`/api/admin/blog?${params}`);
      setBlogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/blog/${deleteTarget._id}`);
      setBlogs((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setTotal((t) => t - 1);
      toast.success("Blog deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to delete";
      toast.error(msg ?? "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (blog: Blog, newStatus: string) => {
    try {
      await axios.patch(`/api/admin/blog/${blog._id}`, { status: newStatus });
      setBlogs((prev) =>
        prev.map((b) =>
          b._id === blog._id ? { ...b, status: newStatus as Blog["status"] } : b,
        ),
      );
      toast.success(`Blog ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Blog Posts</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{total} posts</p>
        </div>
        <Link href="/admin/blog/new">
          <Button leftIcon={<RiAddLine />}>New Post</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-72">
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<RiSearchLine />}
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-[#E84672] text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-16 h-12" rounded="lg" />
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <RiDraftLine size={40} className="text-neutral-200 mb-3 mx-auto" />
            <p className="text-neutral-400 text-sm">No blog posts found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Post</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Author</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Views</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {blogs.map((blog) => {
                const sc = statusConfig[blog.status];
                return (
                  <tr key={blog._id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {blog.coverImage ? (
                          <div className="w-14 h-10 rounded-lg overflow-hidden border border-neutral-100 shrink-0">
                            <Image
                              src={normalizeImageUrl(blog.coverImage)}
                              alt={blog.title}
                              width={56}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                            <RiDraftLine size={16} className="text-neutral-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">{blog.title}</p>
                          <p className="text-[11px] text-neutral-400 font-mono truncate">{blog.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600">{blog.author}</td>
                    <td className="px-5 py-3">
                      <Badge variant={sc.variant} dot>{sc.label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <RiEyeLine size={14} />
                        {blog.viewCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-500">
                      {new Date(blog.publishedAt ?? blog.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {blog.status === "draft" && (
                          <button
                            onClick={() => toggleStatus(blog, "published")}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-neutral-400 hover:text-emerald-600 transition-colors"
                            title="Publish"
                          >
                            <RiCheckLine size={15} />
                          </button>
                        )}
                        {blog.status === "published" && (
                          <button
                            onClick={() => toggleStatus(blog, "archived")}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-neutral-400 hover:text-amber-600 transition-colors"
                            title="Archive"
                          >
                            <RiArchiveLine size={15} />
                          </button>
                        )}
                        <Link
                          href={`/admin/blog/${blog._id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <RiEditLine size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(blog)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <RiDeleteBinLine size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Blog Post" size="sm">
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-neutral-800">{deleteTarget?.title}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-5">
            <Button variant="danger" onClick={handleDelete} isLoading={deleting} leftIcon={<RiDeleteBinLine />}>
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
