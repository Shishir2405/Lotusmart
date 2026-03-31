

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Wishlist from "@/modules/products/wishlist.model";
import Cart from "@/modules/cart/cart.model";
import Product from "@/modules/products/product.model";

async function resolveQuery(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (authUser) return { user: authUser.userId };

  const deviceId = request.headers.get("x-device-id");
  if (deviceId) return { deviceId };

  throw ApiError.unauthorized("Authentication or device ID required");
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const query = await resolveQuery(request);

    const { productId, variant } = await request.json();
    if (!productId) throw ApiError.badRequest("productId is required");

    
    const product = await Product.findById(productId).select("price stock isActive").lean();
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");
    if (product.stock < 1) throw ApiError.badRequest("Product is out of stock");

    
    const wishlist = await Wishlist.findOne(query);
    if (wishlist) {
      wishlist.items = wishlist.items.filter(
        (i: { product: { toString: () => string } }) => i.product.toString() !== productId,
      ) as typeof wishlist.items;
      await wishlist.save();
    }

    
    let cart = await Cart.findOne(query);
    if (!cart) {
      cart = await Cart.create({ ...query, items: [], discount: 0 });
    }
    await cart.addItem({
      product: productId,
      quantity: 1,
      variant,
      price: product.price,
    });

    return successResponse(null, "Moved to cart successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
