// GET   /api/products/[id] — get single product by id or slug (public)
// PATCH /api/products/[id] — update product (admin only)
// DELETE /api/products/[id] — soft-delete product (admin only)

import mongoose from "mongoose";
import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";

type RouteParams = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────
// GET /api/products/[id]
// ──────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    // Try ObjectId first, fall back to slug lookup
    const isObjectId = mongoose.isValidObjectId(id);
    const product = isObjectId
      ? await Product.findById(id).populate("category", "name slug").lean()
      : await Product.findOne({ slug: id, isActive: true })
          .populate("category", "name slug")
          .lean();

    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    return successResponse(product, "Product fetched successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

// ──────────────────────────────────────────────
// PATCH /api/products/[id]  (admin only)
// ──────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();

    // Prevent overwriting slug directly (it is auto-generated from name)
    delete body.slug;

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).populate("category", "name slug");

    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    return successResponse(product, "Product updated successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

// ──────────────────────────────────────────────
// DELETE /api/products/[id]  (admin only — soft delete)
// ──────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { id } = await params;

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    );

    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    return successResponse(
      { id: product._id },
      "Product deactivated successfully",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
