/**
 * POST /api/wishlist/merge
 * Merges guest localStorage wishlist into the authenticated user's DB wishlist.
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Wishlist from "@/modules/products/wishlist.model";
import Product from "@/modules/products/product.model";
import type { WishlistItem } from "@/store/wishlist.store";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const { localItems }: { localItems: WishlistItem[] } = await request.json();

    let wishlist = await Wishlist.findOne({ user: authUser.userId });
    if (!wishlist) wishlist = await Wishlist.create({ user: authUser.userId, items: [] });

    for (const local of localItems ?? []) {
      if (!local.productId) continue;

      const exists = wishlist.items.some(
        (i: { product: { toString: () => string } }) => i.product.toString() === local.productId,
      );
      if (exists) continue;

      const product = await Product.findById(local.productId).select("isActive").lean();
      if (!product || !product.isActive) continue;

      wishlist.items.push({ product: local.productId, addedAt: new Date() });
    }

    await wishlist.save();

    // Populate and return merged wishlist in WishlistItem shape
    const populated = await Wishlist.findById(wishlist._id).populate(
      "items.product",
      "name slug images price compareAtPrice stock unit isActive",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: WishlistItem[] = ((populated?.items ?? []) as any[])
      .filter((i: { product: { isActive: boolean } }) => i.product?.isActive)
      .map((i: {
        product: {
          _id: { toString: () => string };
          name: string;
          slug: string;
          images: string[];
          price: number;
          compareAtPrice?: number;
          stock: number;
          unit: string;
        };
      }) => ({
        productId: i.product._id.toString(),
        name: i.product.name,
        slug: i.product.slug,
        image: i.product.images?.[0] ?? "",
        price: i.product.price,
        compareAtPrice: i.product.compareAtPrice,
        unit: i.product.unit,
        isInStock: i.product.stock > 0,
      }));

    return successResponse({ items }, "Wishlist merged successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
