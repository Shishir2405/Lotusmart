/**
 * GET  /api/wishlist — get authenticated user's server wishlist
 * POST /api/wishlist — toggle item (add/remove)
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Wishlist from "@/modules/products/wishlist.model";
import Product from "@/modules/products/product.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const wishlist = await Wishlist.findOne({ user: authUser.userId }).populate(
      "items.product",
      "name slug images price compareAtPrice stock unit isActive",
    );

    return successResponse(wishlist ?? { items: [] });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const { productId } = await request.json();
    if (!productId) throw ApiError.badRequest("productId is required");

    const product = await Product.findById(productId).select("isActive").lean();
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");

    let wishlist = await Wishlist.findOne({ user: authUser.userId });
    if (!wishlist) wishlist = await Wishlist.create({ user: authUser.userId, items: [] });

    const existingIdx = wishlist.items.findIndex(
      (i: { product: { toString: () => string } }) => i.product.toString() === productId,
    );

    let added: boolean;
    if (existingIdx >= 0) {
      wishlist.items.splice(existingIdx, 1);
      added = false;
    } else {
      wishlist.items.push({ product: productId, addedAt: new Date() });
      added = true;
    }

    await wishlist.save();
    return successResponse({ added, count: wishlist.items.length }, added ? "Added to wishlist" : "Removed from wishlist");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
