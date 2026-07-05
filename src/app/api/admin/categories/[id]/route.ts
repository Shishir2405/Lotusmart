

import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import Product from "@/modules/products/product.model";
import {
  getDepth,
  getSubtreeHeight,
  wouldCreateCycle,
  MAX_CATEGORY_DEPTH,
} from "@/modules/products/category.tree";

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

    // Validate a parent change: must exist, not create a cycle, and stay
    // within the 3-level depth cap (accounting for this node's own subtree).
    if (parent !== undefined && parent !== null && parent !== "") {
      if (await wouldCreateCycle(id, parent)) {
        throw ApiError.badRequest(
          "Cannot set parent: it would create a cycle (a category cannot live inside itself)",
        );
      }
      const parentDoc = await Category.findById(parent);
      if (!parentDoc) throw ApiError.badRequest("Parent category not found");
      const parentDepth = await getDepth(parent);
      const subtreeHeight = await getSubtreeHeight(id);
      if (parentDepth + 1 + subtreeHeight > MAX_CATEGORY_DEPTH) {
        throw ApiError.badRequest("Cannot move here — it would exceed 3 category levels");
      }
    }

    if (name !== undefined) category.name = name.trim();
    // Empty string / null explicitly CLEARS these optional fields (so an admin
    // can actually remove an image or description); undefined leaves them.
    if (description !== undefined) category.description = description || undefined;
    if (image !== undefined) category.image = image || undefined;
    if (parent !== undefined) category.parent = parent || null;
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

    
    const childCount = await Category.countDocuments({ parent: id });
    if (childCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete: this category has ${childCount} subcategorie${childCount === 1 ? "" : "s"}. Remove them first.`
      );
    }

    // Don't orphan products — a product whose category was deleted would
    // populate('category') to null and break product/category pages.
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete: ${productCount} product${productCount === 1 ? "" : "s"} still use this category. Reassign them first.`,
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
