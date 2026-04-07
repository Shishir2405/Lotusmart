import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Blog from "@/modules/blog/blog.model";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const blog = await Blog.findById(id).lean();
    if (!blog) throw ApiError.notFound("Blog not found");

    return successResponse(blog);
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const { title, excerpt, content, coverImage, author, tags, status, isActive, metaTitle, metaDescription } = body;

    const blog = await Blog.findById(id);
    if (!blog) throw ApiError.notFound("Blog not found");

    if (title !== undefined) blog.title = title.trim();
    if (excerpt !== undefined) blog.excerpt = excerpt.trim();
    if (content !== undefined) blog.content = content;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (author !== undefined) blog.author = author.trim();
    if (tags !== undefined) blog.tags = tags;
    if (status !== undefined) blog.status = status;
    if (isActive !== undefined) blog.isActive = isActive;
    if (metaTitle !== undefined) blog.metaTitle = metaTitle;
    if (metaDescription !== undefined) blog.metaDescription = metaDescription;

    await blog.save();

    return successResponse(blog, "Blog updated");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) throw ApiError.notFound("Blog not found");

    return successResponse(null, "Blog deleted");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
