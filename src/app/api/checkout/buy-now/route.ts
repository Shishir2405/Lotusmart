// POST /api/checkout/buy-now
// Direct single-product checkout — bypasses cart entirely.
// Body: { productId, quantity, variantName?, variantValue?, shippingAddress, paymentMethod, notes? }

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";
import Product from "@/modules/products/product.model";
import { sendOrderConfirmation, sendAdminNewOrderAlert } from "@/services/email";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const body = await request.json();
    const {
      productId,
      quantity = 1,
      variantName,
      variantValue,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
    } = body;

    if (!productId) throw ApiError.badRequest("productId is required");
    if (!shippingAddress) throw ApiError.badRequest("shippingAddress is required");
    if (!["cod", "razorpay"].includes(paymentMethod))
      throw ApiError.badRequest("Invalid payment method");

    const qty = Math.max(1, Number(quantity));

    // Fetch and validate product
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive)
      throw ApiError.notFound("Product not found or unavailable");
    if (product.stock < qty)
      throw ApiError.badRequest(`Only ${product.stock} unit(s) in stock`);

    // Resolve variant price adjustment
    let unitPrice = product.price;
    let variantLabel: string | undefined;

    if (variantName && variantValue) {
      const variant = product.variants?.find((v) => v.name === variantName);
      const option = variant?.options?.find((o) => o.value === variantValue);
      if (option) {
        unitPrice = product.price + (option.priceAdjustment ?? 0);
        variantLabel = `${variantName}: ${variantValue}`;
      }
    }

    const orderItems = [
      {
        product: product._id,
        name: product.name,
        image: product.images?.[0] ?? "",
        quantity: qty,
        price: unitPrice,
        variant: variantLabel,
        sku: product.sku,
      },
    ];

    const subtotal = unitPrice * qty;
    const shippingCost = subtotal >= 500 ? 0 : 60;
    const tax = 0;
    const total = subtotal + shippingCost;

    const order = await Order.create({
      user: authUser.userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress ?? shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "placed",
      subtotal,
      shippingCost,
      tax,
      discount: 0,
      total,
      notes,
    });

    // Decrement stock
    await Product.findByIdAndUpdate(productId, { $inc: { stock: -qty } });

    // Emails (non-blocking)
    sendOrderConfirmation(authUser.email, authUser.name ?? "Customer", {
      orderNumber: order.orderNumber,
      items: [{ name: product.name, quantity: qty, price: unitPrice }],
      subtotal,
      shippingCost,
      tax,
      total,
      shippingAddress,
    }).catch(() => null);

    sendAdminNewOrderAlert({
      orderNumber: order.orderNumber,
      total,
      customerName: authUser.name ?? authUser.email,
      paymentMethod,
      itemCount: 1,
    }).catch(() => null);

    return successResponse(order, "Order placed successfully", 201);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
