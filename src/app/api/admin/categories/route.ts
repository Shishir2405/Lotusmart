

import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { createdResponse, errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import { getDepth, MAX_CATEGORY_DEPTH } from "@/modules/products/category.tree";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const categories = await Category.find({})
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, name: 1 })
      .lean({ virtuals: false });

    return successResponse(categories, "Categories fetched");
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
    const { name, description, image, parent, isActive, sortOrder } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw ApiError.badRequest("Category name is required");
    }

    if (parent) {
      const parentDoc = await Category.findById(parent).lean();
      if (!parentDoc) throw ApiError.badRequest("Parent category not found");
      if ((await getDepth(parent)) + 1 > MAX_CATEGORY_DEPTH) {
        throw ApiError.badRequest("Maximum 3 category levels allowed");
      }
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      image,
      parent: parent ?? null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    });

    return createdResponse(category, "Category created");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
