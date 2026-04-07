"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiEyeLine,
  RiUserLine,
  RiTimeLine,
} from "react-icons/ri";
import { Skeleton } from "@/components/ui/Skeleton";
import axios from "axios";
import { normalizeImageUrl } from "@/utils/helpers";

interface BlogDetail {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  viewCount: number;
  publishedAt: string;
  createdAt: string;
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`/api/blog/${slug}`);
        setBlog(res.data.data);
      } catch {
        router.push("/blog");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="container-wide py-10 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-96 mb-4" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Skeleton className="w-full h-72 rounded-2xl mb-8" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!blog) return null;

  const readTime = estimateReadTime(blog.content);
  const publishDate = new Date(blog.publishedAt ?? blog.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container-wide py-10">
      <article className="max-w-3xl mx-auto">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-[#E84672] transition-colors mb-6"
        >
          <RiArrowLeftLine size={16} />
          Back to Blog
        </Link>

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-[#F7F6F0] hover:bg-[#E84672] hover:text-white text-neutral-500 text-xs font-medium rounded-full transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 leading-tight">
          {blog.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 mb-8 pb-6 border-b border-neutral-100">
          <span className="flex items-center gap-1.5">
            <RiUserLine size={15} />
            {blog.author}
          </span>
          <span className="flex items-center gap-1.5">
            <RiCalendarLine size={15} />
            {publishDate}
          </span>
          <span className="flex items-center gap-1.5">
            <RiTimeLine size={15} />
            {readTime} min read
          </span>
          <span className="flex items-center gap-1.5">
            <RiEyeLine size={15} />
            {blog.viewCount} views
          </span>
        </div>

        {/* Cover Image */}
        {blog.coverImage && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8 border border-neutral-100">
            <Image
              src={normalizeImageUrl(blog.coverImage)}
              alt={blog.title}
              width={800}
              height={450}
              className="object-cover w-full h-full"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-neutral max-w-none
            prose-headings:text-neutral-900 prose-headings:font-bold
            prose-p:text-neutral-600 prose-p:leading-relaxed
            prose-a:text-[#E84672] prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:border prose-img:border-neutral-100
            prose-blockquote:border-l-[#E84672] prose-blockquote:bg-[#FFF8F0] prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4
            prose-strong:text-neutral-800
            prose-li:text-neutral-600
            prose-code:text-[#E84672] prose-code:bg-[#FFF1F3] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
          "
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Written by</p>
              <p className="text-lg font-semibold text-neutral-800">{blog.author}</p>
            </div>
            <Link href="/blog">
              <button className="px-5 py-2.5 bg-[#E84672] text-white text-sm font-medium rounded-xl hover:bg-[#d63d66] transition-colors">
                More Articles
              </button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
