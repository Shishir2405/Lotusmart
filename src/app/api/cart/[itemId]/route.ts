

import mongoose from "mongoose";
import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Cart from "@/modules/cart/cart.model";

type RouteParams = { params: Promise<{ itemId: string }> };


export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { itemId } = await params;

    const body = await request.json();
    const { quantity, variant } = body;

    if (quantity === undefined || quantity === null) {
      throw ApiError.badRequest("quantity is required");
    }

    if (!mongoose.isValidObjectId(itemId)) {
      throw ApiError.badRequest("Invalid item id");
    }

    const cart = await Cart.findOne({ user: authUser.userId });
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    // Match on product + variant so two variants of the same product can be
    // addressed independently. Normalize undefined/"" for the no-variant line.
    const wantVariant = variant ?? undefined;
    const item = cart.items.find(
      (i) => i.product.toString() === itemId && (i.variant ?? undefined) === wantVariant,
    );
    if (!item) {
      throw ApiError.notFound("Item not found in cart");
    }

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


export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { itemId } = await params;
    const variant = new URL(request.url).searchParams.get("variant") ?? undefined;

    if (!mongoose.isValidObjectId(itemId)) {
      throw ApiError.badRequest("Invalid item id");
    }

    const cart = await Cart.findOne({ user: authUser.userId });
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    const item = cart.items.find(
      (i) => i.product.toString() === itemId && (i.variant ?? undefined) === variant,
    );
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
