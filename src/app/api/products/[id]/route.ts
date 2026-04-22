

import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";

function revalidateProductSurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

type RouteParams = { params: Promise<{ id: string }> };


export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    
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


export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();

    // Slug is regenerated from name on save; don't let clients overwrite it.
    delete body.slug;

    // Normalize empty strings on Date fields so bad client payloads can't silently
    // block the whole patch (bestBefore was the culprit for the seed-mix stock bug).
    if (body.bestBefore === "") body.bestBefore = undefined;

    // Legacy field-name aliases that older payloads may still send.
    if (body.hsnCode !== undefined && body.hsn === undefined) {
      body.hsn = body.hsnCode;
      delete body.hsnCode;
    }
    if (body.fssaiLicenseNumber !== undefined && body.fssaiLicense === undefined) {
      body.fssaiLicense = body.fssaiLicenseNumber;
      delete body.fssaiLicenseNumber;
    }
    if (body.seo && typeof body.seo === "object") {
      if (body.metaTitle === undefined) body.metaTitle = body.seo.metaTitle;
      if (body.metaDescription === undefined)
        body.metaDescription = body.seo.metaDescription;
      delete body.seo;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).populate("category", "name slug");

    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    revalidateProductSurfaces(product.slug);

    return successResponse(product, "Product updated successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}


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

    revalidateProductSurfaces(product.slug);

    return successResponse(
      { id: product._id },
      "Product deactivated successfully",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
