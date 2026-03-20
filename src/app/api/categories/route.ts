// GET  /api/categories — list all active categories (public)
// POST /api/categories — create category (admin only)

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { createdResponse, errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";

// ──────────────────────────────────────────────
// GET /api/categories
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const includeSubcategories =
      searchParams.get("includeSubcategories") === "true";

    // Fetch top-level categories (no parent)
    const query = Category.find({ isActive: true, parent: null }).sort({
      sortOrder: 1,
      name: 1,
    });

    if (includeSubcategories) {
      query.populate({
        path: "children",
        match: { isActive: true },
        options: { sort: { sortOrder: 1, name: 1 } },
      });
    }

    const categories = await query.lean({ virtuals: includeSubcategories });

    return successResponse(categories, "Categories fetched successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

// ──────────────────────────────────────────────
// POST /api/categories  (admin only)
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const body = await request.json();
    const { name, description, image, parent, isActive, sortOrder } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw ApiError.badRequest("Category name is required");
    }

    // Verify parent exists if provided
    if (parent) {
      const parentDoc = await Category.findById(parent).lean();
      if (!parentDoc) {
        throw ApiError.badRequest("Parent category not found");
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

    return createdResponse(category, "Category created successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
