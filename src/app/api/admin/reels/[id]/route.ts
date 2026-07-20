import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Reel from "@/modules/reels/reel.model";
import "@/modules/products/product.model";
import { videoPosterUrl } from "@/services/cloudinary";

type Params = { params: Promise<{ id: string }> };

const PRODUCT_FIELDS = "_id name slug price compareAtPrice images stock";

// A malformed :id would otherwise reach Mongoose and surface as a 500 that
// leaks the internal CastError message; treat it as a clean 404 instead.
function assertValidId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound("Reel not found");
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    await requireAdmin(request);
    const { id } = await params;
    assertValidId(id);

    const reel = await Reel.findById(id)
      .populate("products", PRODUCT_FIELDS)
      .lean();
    if (!reel) throw ApiError.notFound("Reel not found");

    return successResponse(reel);
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

    assertValidId(id);

    const body = await request.json();
    const { title, videoUrl, thumbnailUrl, caption, products, order, isActive } = body;

    const reel = await Reel.findById(id);
    if (!reel) throw ApiError.notFound("Reel not found");

    // Partial update: only touch the keys the caller actually sent, so a
    // toggle-only PATCH ({ isActive }) can't blank out the rest of the reel.
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        throw ApiError.badRequest("Reel title cannot be empty");
      }
      reel.title = title.trim();
    }
    if (videoUrl !== undefined) {
      if (typeof videoUrl !== "string" || videoUrl.trim().length === 0) {
        throw ApiError.badRequest("Reel video URL cannot be empty");
      }
      reel.videoUrl = videoUrl.trim();
    }
    if (thumbnailUrl !== undefined) {
      const trimmed = typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "";
      if (trimmed) {
        reel.thumbnailUrl = trimmed;
      } else {
        // Cleared on edit: re-derive the first frame from the (possibly just
        // updated) video rather than rejecting the empty value.
        const derived = videoPosterUrl(reel.videoUrl);
        if (!derived) {
          throw ApiError.badRequest(
            "Couldn't auto-generate a thumbnail from this video — please upload one.",
          );
        }
        reel.thumbnailUrl = derived;
      }
    }
    if (caption !== undefined) {
      reel.caption = typeof caption === "string" ? caption.trim() : "";
    }
    if (products !== undefined) {
      if (!Array.isArray(products)) {
        throw ApiError.badRequest("Products must be an array of product IDs");
      }
      // A non-ObjectId entry would cast-fail inside reel.save() and surface as a
      // 500; reject it up front as a clean 400.
      if (!products.every((p) => mongoose.Types.ObjectId.isValid(p))) {
        throw ApiError.badRequest("Products must all be valid product IDs");
      }
      reel.products = products;
    }
    if (order !== undefined) reel.order = Number(order);
    if (isActive !== undefined) reel.isActive = !!isActive;

    await reel.save();
    await reel.populate("products", PRODUCT_FIELDS);

    revalidatePath("/");
    return successResponse(reel, "Reel updated");
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
    assertValidId(id);

    const reel = await Reel.findByIdAndDelete(id);
    if (!reel) throw ApiError.notFound("Reel not found");

    revalidatePath("/");
    return successResponse(null, "Reel deleted");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
