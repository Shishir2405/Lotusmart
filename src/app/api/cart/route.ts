// GET    /api/cart — get cart for authenticated user
// POST   /api/cart — add / update item in cart
// DELETE /api/cart — clear entire cart

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Cart from "@/modules/cart/cart.model";
import Product from "@/modules/products/product.model";

// ──────────────────────────────────────────────
// Helper — find-or-create cart and populate items
// ──────────────────────────────────────────────
async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name slug images price stock isActive",
  );

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], discount: 0 });
    // No items yet, no need to re-populate
  }

  return cart;
}

// ──────────────────────────────────────────────
// GET /api/cart — guests get empty response; client Zustand store handles guest cart
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request); // throws 401 for guests → client handles locally

    const cart = await getOrCreateCart(authUser.userId);
    const total = cart.getTotal();

    return successResponse({ ...cart.toJSON(), total }, "Cart fetched successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

// ──────────────────────────────────────────────
// POST /api/cart
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { productId, quantity, variant } = body;

    if (!productId) {
      throw ApiError.badRequest("productId is required");
    }

    const qty = typeof quantity === "number" ? quantity : 1;
    if (qty < 1) {
      throw ApiError.badRequest("Quantity must be at least 1");
    }

    // Validate product exists and has sufficient stock
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      throw ApiError.notFound("Product not found or is no longer available");
    }
    if (product.stock < qty) {
      throw ApiError.badRequest(
        `Insufficient stock. Only ${product.stock} unit(s) available`,
      );
    }

    let cart = await Cart.findOne({ user: authUser.userId });
    if (!cart) {
      cart = await Cart.create({
        user: authUser.userId,
        items: [],
        discount: 0,
      });
    }

    await cart.addItem({
      product: productId,
      quantity: qty,
      variant,
      price: product.price,
    });

    // Re-fetch with populated product details
    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name slug images price stock isActive",
    );

    const total = updatedCart!.getTotal();

    return successResponse(
      { ...updatedCart!.toJSON(), total },
      "Cart updated successfully",
    );
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}

// ──────────────────────────────────────────────
// DELETE /api/cart
// ──────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    await Cart.findOneAndUpdate(
      { user: authUser.userId },
      { $set: { items: [], discount: 0, couponCode: undefined } },
    );

    return successResponse(null, "Cart cleared successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
