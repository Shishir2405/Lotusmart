

import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import Cart from "@/modules/cart/cart.model";
import Product from "@/modules/products/product.model";


async function resolveCartQuery(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (authUser) return { user: authUser.userId };

  const deviceId = request.headers.get("x-device-id");
  if (deviceId) return { deviceId };

  throw ApiError.unauthorized("Authentication or device ID required");
}


async function getOrCreateCart(query: { user?: string; deviceId?: string }) {
  let cart = await Cart.findOne(query).populate(
    "items.product",
    "name slug images price stock isActive",
  );

  if (!cart) {
    cart = await Cart.create({ ...query, items: [], discount: 0 });
  }

  return cart;
}


export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const query = await resolveCartQuery(request);
    const cart = await getOrCreateCart(query);
    const total = cart.getTotal();

    return successResponse({ ...cart.toJSON(), total }, "Cart fetched successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}


export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const query = await resolveCartQuery(request);

    const body = await request.json();
    const { productId, quantity, variant } = body;

    if (!productId) {
      throw ApiError.badRequest("productId is required");
    }

    const qty = typeof quantity === "number" ? quantity : 1;
    if (qty < 1) {
      throw ApiError.badRequest("Quantity must be at least 1");
    }

    
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      throw ApiError.notFound("Product not found or is no longer available");
    }
    if (product.stock < qty) {
      throw ApiError.badRequest(
        `Insufficient stock. Only ${product.stock} unit(s) available`,
      );
    }

    let cart = await Cart.findOne(query);
    if (!cart) {
      cart = await Cart.create({
        ...query,
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


export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const query = await resolveCartQuery(request);

    await Cart.findOneAndUpdate(
      query,
      { $set: { items: [], discount: 0, couponCode: undefined } },
    );

    return successResponse(null, "Cart cleared successfully");
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
