import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import Blog from "@/modules/blog/blog.model";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { slug } = await params;

    const blog = await Blog.findOneAndUpdate(
      { slug, status: "published", isActive: true },
      { $inc: { viewCount: 1 } },
      { new: true },
    ).lean();

    if (!blog) throw ApiError.notFound("Blog post not found");

    return successResponse(blog);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
