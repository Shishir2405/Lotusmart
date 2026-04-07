"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiCalendarLine,
  RiEyeLine,
  RiArrowRightLine,
  RiUserLine,
} from "react-icons/ri";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import { normalizeImageUrl } from "@/utils/helpers";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  viewCount: number;
  publishedAt: string;
  createdAt: string;
}

function BlogListContent() {
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));

  const debouncedSearch = useDebounce(search, 400);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(tag && { tag }),
      });
      const res = await axios.get(`/api/blog?${params}`);
      setBlogs(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, tag]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tag]);

  const clearTag = () => setTag("");

  return (
    <div className="container-wide py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">Our Blog</h1>
        <p className="text-neutral-500 max-w-xl mx-auto">
          Discover recipes, health tips, and stories about premium spices & dry fruits.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<RiSearchLine />}
        />
      </div>

      {/* Active tag filter */}
      {tag && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-sm text-neutral-500">Filtered by tag:</span>
          <span className="px-3 py-1 bg-[#FFF1F3] text-[#E84672] text-sm font-medium rounded-full">
            {tag}
          </span>
          <button onClick={clearTag} className="text-xs text-neutral-400 hover:text-neutral-700 underline">
            Clear
          </button>
        </div>
      )}

      {/* Blog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-neutral-300 mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">No articles found</h3>
          <p className="text-neutral-400 mb-4">Try adjusting your search term</p>
          {(search || tag) && (
            <Button variant="outline" onClick={() => { setSearch(""); clearTag(); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link href={`/blog/${blog.slug}`} className="group block">
                  <article className="bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg hover:border-neutral-200 transition-all duration-300">
                    {/* Image */}
                    <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                      {blog.coverImage ? (
                        <Image
                          src={normalizeImageUrl(blog.coverImage)}
                          alt={blog.title}
                          width={400}
                          height={250}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Tags */}
                      {blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {blog.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 bg-[#F7F6F0] text-neutral-500 text-[11px] font-medium rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-[#E84672] transition-colors">
                        {blog.title}
                      </h2>

                      <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{blog.excerpt}</p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <RiUserLine size={12} />
                            {blog.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <RiCalendarLine size={12} />
                            {new Date(blog.publishedAt ?? blog.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <RiEyeLine size={12} />
                          {blog.viewCount}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-neutral-500">
                Page {page} of {pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="container-wide py-10">
          <div className="text-center mb-10">
            <Skeleton className="h-9 w-48 mx-auto mb-3" />
            <Skeleton className="h-4 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <BlogListContent />
    </Suspense>
  );
}
