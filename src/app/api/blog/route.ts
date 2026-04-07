import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { errorResponse, paginatedResponse, buildPagination } from "@/lib/api-response";
import connectDB from "@/lib/db";
import Blog from "@/modules/blog/blog.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "12", 10));
    const skip = (page - 1) * limit;
    const tag = searchParams.get("tag") ?? "";
    const search = searchParams.get("search") ?? "";

    const query: Record<string, unknown> = {
      status: "published",
      isActive: true,
    };

    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select("-content")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    return paginatedResponse(blogs, buildPagination(page, limit, total));
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
