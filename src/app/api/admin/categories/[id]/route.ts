// GET    /api/admin/categories/[id] — get single category
// PATCH  /api/admin/categories/[id] — update category
// DELETE /api/admin/categories/[id] — delete category

import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;

    const category = await Category.findById(id)
      .populate("parent", "name slug")
      .lean({ virtuals: false });

    if (!category) throw ApiError.notFound("Category not found");

    return successResponse(category);
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
    const { name, description, image, parent, isActive, sortOrder } = body;

    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound("Category not found");

    // Prevent circular parent
    if (parent && String(parent) === String(id)) {
      throw ApiError.badRequest("Category cannot be its own parent");
    }

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parent !== undefined) category.parent = parent ?? null;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    await category.save();

    return successResponse(category, "Category updated");
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

    // Check for children
    const childCount = await Category.countDocuments({ parent: id });
    if (childCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete: this category has ${childCount} subcategorie${childCount === 1 ? "" : "s"}. Remove them first.`
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) throw ApiError.notFound("Category not found");

    return successResponse(null, "Category deleted");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
