import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";
import Cart from "@/modules/cart/cart.model";
import Product from "@/modules/products/product.model";
import { sendOrderConfirmation, sendAdminNewOrderAlert } from "@/services/email";

// GET /api/orders — list current user's orders
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 10));
    const status = searchParams.get("status");

    const query: Record<string, unknown> = { user: authUser.userId };
    if (status) query.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return paginatedResponse(orders, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

// POST /api/orders — place a new order (works for guest checkout too — user created before this)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { shippingAddress, billingAddress, paymentMethod, notes, items: clientItems } = body;

    if (!shippingAddress) throw ApiError.badRequest("Shipping address is required");
    if (!["cod", "razorpay"].includes(paymentMethod))
      throw ApiError.badRequest("Invalid payment method");

    // Use client-sent items (for guest checkout) or fall back to server cart
    let orderItems = clientItems;

    if (!orderItems || orderItems.length === 0) {
      const cart = await Cart.findOne({ user: authUser.userId }).populate(
        "items.product",
        "name price stock isActive sku",
      );
      if (!cart || cart.items.length === 0) throw ApiError.badRequest("Cart is empty");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderItems = (cart.items as any[])
        .filter((i: { product: { isActive: boolean } }) => i.product?.isActive)
        .map((i: {
          product: { _id: { toString(): string }; name: string; price: number; sku: string };
          quantity: number;
          variant?: { name: string; value: string };
          price: number;
        }) => ({
          product: i.product._id.toString(),
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant,
          sku: i.product.sku,
        }));
    }

    if (!orderItems || orderItems.length === 0)
      throw ApiError.badRequest("No valid items in order");

    // Validate stock for each item
    for (const item of orderItems) {
      const product = await Product.findById(item.product).select("stock name").lean();
      if (!product) throw ApiError.badRequest(`Product not found: ${item.name}`);
      if (product.stock < item.quantity)
        throw ApiError.badRequest(`Insufficient stock for "${product.name}"`);
    }

    // Calculate totals
    const subtotal = orderItems.reduce(
      (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
      0,
    );
    const shippingCost = subtotal >= 500 ? 0 : 60; // free shipping above ₹500
    const tax = 0; // inclusive pricing for now
    const total = subtotal + shippingCost - (body.discount ?? 0);

    const order = await Order.create({
      user: authUser.userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress ?? shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      orderStatus: "placed",
      subtotal,
      shippingCost,
      tax,
      discount: body.discount ?? 0,
      total,
      notes,
    });

    // Decrement stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // Clear server cart
    await Cart.findOneAndUpdate(
      { user: authUser.userId },
      { $set: { items: [], discount: 0, couponCode: null } },
    );

    // Send emails (non-blocking)
    sendOrderConfirmation(authUser.email, authUser.name ?? "Customer", {
      orderNumber: order.orderNumber,
      items: orderItems.map((i: { name: string; quantity: number; price: number }) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal,
      shippingCost,
      tax,
      total: order.total,
      shippingAddress,
    }).catch(() => null);

    sendAdminNewOrderAlert({
      orderNumber: order.orderNumber,
      total: order.total,
      customerName: authUser.name ?? authUser.email,
      paymentMethod,
      itemCount: orderItems.length,
    }).catch(() => null);

    return successResponse(order, "Order placed successfully", 201);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
