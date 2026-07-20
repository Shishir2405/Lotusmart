import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import {
  buildPagination,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import connectDB from "@/lib/db";
import Reel from "@/modules/reels/reel.model";
// Product must be registered on the mongoose connection before `populate("products")`
// can resolve the "Product" ref in a fresh serverless lambda.
import "@/modules/products/product.model";

const PRODUCT_FIELDS = "_id name slug price compareAtPrice images stock";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    // `|| fallback` catches NaN (parseInt("abc")) and 0; Math.max/Math.min would
    // otherwise propagate NaN into .skip()/.limit() and 500 this public endpoint.
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12),
    );
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    const [reels, total] = await Promise.all([
      Reel.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("products", PRODUCT_FIELDS)
        .lean(),
      Reel.countDocuments(query),
    ]);

    return paginatedResponse(reels, buildPagination(page, limit, total));
  } catch (error) {
    const e = ApiError.from(error);
    return errorResponse(e.message, e.statusCode, e.errors);
  }
}
