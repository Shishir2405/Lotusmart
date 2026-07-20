import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { ApiError } from "@/lib/api-error";
import {
  buildPagination,
  createdResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Reel from "@/modules/reels/reel.model";
import "@/modules/products/product.model";
import { videoPosterUrl } from "@/services/cloudinary";

const PRODUCT_FIELDS = "_id name slug price compareAtPrice images stock";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    // `|| fallback` catches NaN (parseInt("abc")) and 0, which would otherwise
    // propagate into .skip()/.limit() and 500 the request.
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20),
    );
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";

    // Admin sees inactive reels too; `status` narrows it on demand.
    const query: Record<string, unknown> = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { caption: { $regex: search, $options: "i" } },
      ];
    }

    const [reels, total] = await Promise.all([
      Reel.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("products", PRODUCT_FIELDS)
        .lean(),
      Reel.countDocuments(query),
    ]);

    return paginatedResponse(reels, buildPagination(page, limit, total), "Reels fetched");
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
    const { title, videoUrl, thumbnailUrl, caption, products, order, isActive } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw ApiError.badRequest("Reel title is required");
    }
    if (!videoUrl || typeof videoUrl !== "string" || videoUrl.trim().length === 0) {
      throw ApiError.badRequest("Reel video URL is required");
    }
    // Thumbnail is optional: if the admin didn't upload one, derive the first
    // frame of the video from Cloudinary. Only error if we can't produce either.
    const trimmedVideo = videoUrl.trim();
    let finalThumbnail =
      typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "";
    if (!finalThumbnail) {
      finalThumbnail = videoPosterUrl(trimmedVideo) ?? "";
    }
    if (!finalThumbnail) {
      throw ApiError.badRequest(
        "Couldn't auto-generate a thumbnail from this video — please upload one.",
      );
    }
    if (products !== undefined) {
      if (!Array.isArray(products)) {
        throw ApiError.badRequest("Products must be an array of product IDs");
      }
      // A non-ObjectId entry would cast-fail inside Reel.create() and 500;
      // reject it up front as a clean 400.
      if (!products.every((p) => mongoose.Types.ObjectId.isValid(p))) {
        throw ApiError.badRequest("Products must all be valid product IDs");
      }
    }

    const reel = await Reel.create({
      title: title.trim(),
      videoUrl: trimmedVideo,
      thumbnailUrl: finalThumbnail,
      caption: typeof caption === "string" ? caption.trim() : undefined,
      products: products ?? [],
      order: typeof order === "number" ? order : 0,
      isActive: isActive ?? true,
    });

    const populated = await reel.populate("products", PRODUCT_FIELDS);

    revalidatePath("/");
    return createdResponse(populated, "Reel created");
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
