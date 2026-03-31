

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Wishlist from "@/modules/products/wishlist.model";
import Product from "@/modules/products/product.model";


async function resolveWishlistQuery(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (authUser) return { user: authUser.userId };

  const deviceId = request.headers.get("x-device-id");
  if (deviceId) return { deviceId };

  throw ApiError.unauthorized("Authentication or device ID required");
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const query = await resolveWishlistQuery(request);

    const wishlist = await Wishlist.findOne(query).populate(
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
    const query = await resolveWishlistQuery(request);

    const { productId } = await request.json();
    if (!productId) throw ApiError.badRequest("productId is required");

    const product = await Product.findById(productId).select("isActive").lean();
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");

    let wishlist = await Wishlist.findOne(query);
    if (!wishlist) wishlist = await Wishlist.create({ ...query, items: [] });

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

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const query = await resolveWishlistQuery(request);

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) throw ApiError.badRequest("productId query param is required");

    const wishlist = await Wishlist.findOne(query);
    if (!wishlist) throw ApiError.notFound("Wishlist not found");

    wishlist.items = wishlist.items.filter(
      (i: { product: { toString: () => string } }) => i.product.toString() !== productId,
    ) as typeof wishlist.items;

    await wishlist.save();
    return successResponse({ count: wishlist.items.length }, "Item removed from wishlist");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
