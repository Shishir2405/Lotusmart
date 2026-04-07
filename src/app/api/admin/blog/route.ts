import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  buildPagination,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Blog from "@/modules/blog/blog.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    return paginatedResponse(blogs, buildPagination(page, limit, total), "Blogs fetched");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const { title, excerpt, content, coverImage, author, tags, status, metaTitle, metaDescription } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw ApiError.badRequest("Blog title is required");
    }
    if (!excerpt || typeof excerpt !== "string" || excerpt.trim().length === 0) {
      throw ApiError.badRequest("Blog excerpt is required");
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw ApiError.badRequest("Blog content is required");
    }
    if (!author || typeof author !== "string" || author.trim().length === 0) {
      throw ApiError.badRequest("Author name is required");
    }

    const blog = await Blog.create({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      coverImage: coverImage ?? "",
      author: author.trim(),
      tags: tags ?? [],
      status: status ?? "draft",
      metaTitle,
      metaDescription,
    });

    return createdResponse(blog, "Blog created");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
