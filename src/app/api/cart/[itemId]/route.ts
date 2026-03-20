// PATCH  /api/cart/[itemId] — update item quantity (0 = remove)
// DELETE /api/cart/[itemId] — remove specific item from cart

import mongoose from "mongoose";
import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Cart from "@/modules/cart/cart.model";

type RouteParams = { params: Promise<{ itemId: string }> };

// ──────────────────────────────────────────────
// PATCH /api/cart/[itemId]
// ──────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { itemId } = await params;

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity === null) {
      throw ApiError.badRequest("quantity is required");
    }

    const cart = await Cart.findOne({ user: authUser.userId });
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    // Find the cart item by its product ObjectId (itemId is the productId here)
    if (!mongoose.isValidObjectId(itemId)) {
      throw ApiError.badRequest("Invalid item id");
    }

    const item = cart.items.find((i) => i.product.toString() === itemId);
    if (!item) {
      throw ApiError.notFound("Item not found in cart");
    }

    // updateQuantity removes the item when quantity <= 0
    await cart.updateQuantity(itemId, quantity, item.variant);

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name slug images price stock isActive",
    );

    const total = updatedCart!.getTotal();

    return successResponse(
      { ...updatedCart!.toJSON(), total },
      quantity <= 0 ? "Item removed from cart" : "Cart item updated",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

// ──────────────────────────────────────────────
// DELETE /api/cart/[itemId]
// ──────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { itemId } = await params;

    if (!mongoose.isValidObjectId(itemId)) {
      throw ApiError.badRequest("Invalid item id");
    }

    const cart = await Cart.findOne({ user: authUser.userId });
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    const item = cart.items.find((i) => i.product.toString() === itemId);
    if (!item) {
      throw ApiError.notFound("Item not found in cart");
    }

    await cart.removeItem(itemId, item.variant);

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name slug images price stock isActive",
    );

    const total = updatedCart!.getTotal();

    return successResponse(
      { ...updatedCart!.toJSON(), total },
      "Item removed from cart",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
